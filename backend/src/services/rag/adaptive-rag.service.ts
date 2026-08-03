import { CitationBuilder, CitationMap } from './citation.builder'
import { RetrievalService, RetrievedChunk } from './retrieval.service'
import { QueryRouterService } from './router/router.service'
import { QueryRepresentations } from './router/query-representations'
import { RewriteService } from './expansions/rewrite.service'
import { StepBackService } from './expansions/step-back.service'
import { DecompositionService } from './expansions/decomposition.service'
import { HyDEService } from './expansions/hyde.service'
import { EvaluatorService } from './evaluator.service'
import { RagTelemetry } from './rag-telemetry.service'
import { TaskClassifierService } from './task-classifier/task-classifier.service'
import { TaskExecutorService } from './task-executor.service'
import { SkillRegistry } from './skills'
import Logger from '../../config/logger'
import { RoutingDecision } from './router/router.schemas'
import { TaskClassification } from './task-classifier/task-classifier.schemas'

export class AdaptiveRagService {
  static async executeRagQuery(
    workspaceId: string,
    messages: any[],
  ): Promise<{
    result?: any
    citationMap: CitationMap
    routingDecision?: RoutingDecision
    correctiveHistory?: any[]
    fallbackResponse?: string
    taskClassification?: TaskClassification
  }> {
    try {
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('The last message must be from the user.')
      }

      const originalQuery = lastMessage.content as string
      let currentQuery = originalQuery

      const telemetry = RagTelemetry.enabled ? new RagTelemetry(originalQuery) : undefined

      let allChunksMap = new Map<string, RetrievedChunk>()
      const seenChunkIds = new Set<string>()
      let attempt = 1
      const maxAttempts = 3
      let finalRoutingDecision: RoutingDecision | undefined
      const correctiveHistory: any[] = []

      Logger.info(`[AdaptiveRagService] Starting Corrective RAG loop for query: "${originalQuery}"`)

      while (attempt <= maxAttempts) {
        Logger.info(`[AdaptiveRagService] Attempt ${attempt}/${maxAttempts} using query: "${currentQuery}"`)

        const routingDecision = await QueryRouterService.classifyQuery(currentQuery)
        if (attempt === 1) {
          finalRoutingDecision = routingDecision
          telemetry?.setRouting(routingDecision)
        }

        const representations: QueryRepresentations = { original: currentQuery }
        const expansionPromises = []

        if (routingDecision.rewrite) {
          expansionPromises.push(
            RewriteService.rewrite(currentQuery).then((res) => {
              if (res) {
                representations.rewritten = res
                telemetry?.addExpansion('rewrite', res)
              }
            }),
          )
        }
        if (routingDecision.stepBack) {
          expansionPromises.push(
            StepBackService.generateStepBack(currentQuery).then((res) => {
              if (res) {
                representations.stepBack = res
                telemetry?.addExpansion('stepBack', res)
              }
            }),
          )
        }
        if (routingDecision.decompose) {
          expansionPromises.push(
            DecompositionService.decompose(currentQuery).then((res) => {
              if (res) {
                representations.subqueries = res
                res.forEach((sq, i) => telemetry?.addExpansion(`subquery-${i + 1}`, sq))
              }
            }),
          )
        }
        if (routingDecision.hyde) {
          expansionPromises.push(
            HyDEService.generateHypothetical(currentQuery).then((res) => {
              if (res) {
                representations.hypotheticalDocument = res
                telemetry?.addExpansion('hyde', res)
              }
            }),
          )
        }

        await Promise.all(expansionPromises)

        const chunks = await RetrievalService.retrieveWithMultipleQueries(
          workspaceId,
          representations,
          telemetry,
          seenChunkIds,
        )

        for (const chunk of chunks) {
          seenChunkIds.add(chunk.id)
        }

        for (const chunk of chunks) {
          const existing = allChunksMap.get(chunk.id)
          if (!existing || chunk.score > existing.score) {
            allChunksMap.set(chunk.id, chunk)
          }
        }

        const evaluation = await EvaluatorService.evaluate(originalQuery, chunks)
        correctiveHistory.push({ attempt, query: currentQuery, evaluation })

        telemetry?.addEvaluatorResult({
          attempt,
          query: currentQuery,
          chunksEvaluated: chunks.length,
          sufficient: evaluation.sufficient,
          reason: evaluation.reason,
          fallbackQuery: evaluation.fallbackQuery,
        })

        if (evaluation.sufficient) {
          Logger.info(`[AdaptiveRagService] Context deemed sufficient on attempt ${attempt}.`)
          break
        }

        if (attempt === maxAttempts) {
          Logger.warn(`[AdaptiveRagService] Reached max attempts (${maxAttempts}) and context still insufficient.`)
          telemetry?.finalise('fallback')
          return {
            citationMap: {},
            routingDecision: finalRoutingDecision,
            correctiveHistory,
            fallbackResponse:
              "I couldn't find enough relevant information in the workspace sources to answer your question.",
          }
        }

        if (!evaluation.fallbackQuery) {
          Logger.warn(`[AdaptiveRagService] Evaluator provided no fallback query. Breaking loop.`)
          telemetry?.finalise('fallback')
          return {
            citationMap: {},
            routingDecision: finalRoutingDecision,
            correctiveHistory,
            fallbackResponse:
              "I couldn't find enough relevant information in the workspace sources to answer your question.",
          }
        }

        currentQuery = evaluation.fallbackQuery
        attempt++
      }

      const finalChunks = Array.from(allChunksMap.values())

      if (finalChunks.length === 0) {
        telemetry?.finalise('fallback')
        return {
          citationMap: {},
          routingDecision: finalRoutingDecision,
          correctiveHistory,
          fallbackResponse:
            "I couldn't find enough relevant information in the workspace sources to answer your question.",
        }
      }

      const { contextString, citationMap } = CitationBuilder.buildContext(finalChunks)

      const taskClassification = await TaskClassifierService.classify(originalQuery)

      const skill = SkillRegistry.getSkill(taskClassification.task)

      Logger.info(`[AdaptiveRagService] Task: ${taskClassification.task} → Skill: ${skill.id} (${skill.name})`)

      const result = TaskExecutorService.execute(skill, contextString, messages)

      telemetry?.finalise('success')
      return { result, citationMap, routingDecision: finalRoutingDecision, correctiveHistory, taskClassification }
    } catch (error: any) {
      Logger.error(`[AdaptiveRagService] execution failed: ${error.message}`)
      throw error
    }
  }
}
