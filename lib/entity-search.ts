export interface EntitySearchResult {
  tableName: string;
  confidence: number;
}

export async function searchEntity(description: string): Promise<EntitySearchResult> {
  // For now, always return the unicorns table with high confidence
  return {
    tableName: "unicorns",
    confidence: 0.95
  };
} 