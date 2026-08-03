export interface RerankedResult {
  index: number;
  relevance_score: number;
}

export interface Reranker {
  /**
   * Evaluates the relevance of a list of documents against a query.
   * 
   * @param query The user's search query.
   * @param documents An array of document strings.
   * @param topN The maximum number of results to return.
   * @returns A promise resolving to the scored and sorted indices mapped back to the input array.
   */
  rerank(query: string, documents: string[], topN: number): Promise<RerankedResult[]>;
}
