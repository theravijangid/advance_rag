/**
 * Skill Registration Barrel.
 *
 * Import this module once at application startup to register all skill definitions
 * with the SkillRegistry. Adding a new skill requires:
 * 1. Creating a definition file in `definitions/`.
 * 2. Importing and registering it here.
 */
import { SkillRegistry } from './skill-registry.service';
import { qaSkill } from './definitions/qa.skill';
import { summarySkill } from './definitions/summary.skill';
import { explainSkill } from './definitions/explain.skill';
import { compareSkill } from './definitions/compare.skill';
import { notesSkill } from './definitions/notes.skill';

// Register all skills
SkillRegistry.register(qaSkill);
SkillRegistry.register(summarySkill);
SkillRegistry.register(explainSkill);
SkillRegistry.register(compareSkill);
SkillRegistry.register(notesSkill);

// Re-export for convenience
export { SkillRegistry } from './skill-registry.service';
export type { SkillDefinition } from './skill.types';
