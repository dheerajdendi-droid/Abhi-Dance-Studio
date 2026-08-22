// Single source of truth for the studio's rate tiers, kept in lockstep
// with the settings.*_rate columns (junior_rate, intermediate_rate, ...)
// and the students.level check constraint.
export const LEVELS = ["junior", "intermediate", "senior", "advanced"];

export function levelLabel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function rateForLevel(settings, level) {
  return Number(settings[`${level}_rate`]);
}
