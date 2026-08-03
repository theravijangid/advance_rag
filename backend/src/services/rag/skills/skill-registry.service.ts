import { SkillDefinition } from './skill.types';
import Logger from '../../../config/logger';

export class SkillRegistry {
  private static skills = new Map<string, SkillDefinition>();

  static register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
    Logger.debug(`[SkillRegistry] Registered skill: ${skill.id} (${skill.name})`);
  }

  static getSkill(taskType: string): SkillDefinition {
    const skill = this.skills.get(taskType);

    if (skill) {
      return skill;
    }

    Logger.warn(
      `[SkillRegistry] No skill registered for task type "${taskType}". Falling back to "qa".`
    );

    const fallback = this.skills.get('qa');
    if (!fallback) {
      throw new Error('[SkillRegistry] Critical: QA fallback skill is not registered.');
    }

    return fallback;
  }

  static getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  static clear(): void {
    this.skills.clear();
  }
}
