import dotenv from 'dotenv'

dotenv.config()

class EnumConfig {
    public modelPurpose = {
        ragAnswer: 'rag-answer',
        queryRouter: 'query-router',
        queryRewrite: 'query-rewrite',
        hyde: 'hyde',
        stepBack: 'step-back',
        decomposition: 'decomposition',
        evaluation: 'evaluation',
        guardrail: 'guardrail',
        requestRouter: 'request-router',
        generalConversation: 'general-conversation',
        taskClassifier: 'task-classifier',
    } as const;
}

export const enumConfig = new EnumConfig();