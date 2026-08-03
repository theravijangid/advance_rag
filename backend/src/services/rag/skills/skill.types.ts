export interface SkillDefinition {
  id: string;
  name: string;
  systemPrompt: string;
  temperature?: number;
  outputFormat?: string;
}
