// ─── Skill Registry & Router ────────────────────────────────────────────────
// Detects which skill (if any) is relevant for a query and assembles
// the multi-block system prompt with cache breakpoints.

import { AB_TESTING_SKILL } from "./cards/ab-testing.js";
import { TIME_SERIES_SKILL } from "./cards/time-series.js";
import { PORTFOLIO_OPTIMIZATION_SKILL } from "./cards/portfolio-optimization.js";
import { CAUSAL_INFERENCE_SKILL } from "./cards/causal-inference.js";
import { POWER_ANALYSIS_SKILL } from "./cards/power-analysis.js";
import { FEATURE_ENGINEERING_SKILL } from "./cards/feature-engineering.js";
import { REGRESSION_DIAGNOSTICS_SKILL } from "./cards/regression-diagnostics.js";
import { ANOMALY_DETECTION_SKILL } from "./cards/anomaly-detection.js";
import { SYNTHETIC_DATA_SKILL } from "./cards/synthetic-data.js";
import { BAYESIAN_INFERENCE_SKILL } from "./cards/bayesian-inference.js";

export const SKILL_REGISTRY = [
  AB_TESTING_SKILL,
  TIME_SERIES_SKILL,
  PORTFOLIO_OPTIMIZATION_SKILL,
  CAUSAL_INFERENCE_SKILL,
  POWER_ANALYSIS_SKILL,
  FEATURE_ENGINEERING_SKILL,
  REGRESSION_DIAGNOSTICS_SKILL,
  ANOMALY_DETECTION_SKILL,
  SYNTHETIC_DATA_SKILL,
  BAYESIAN_INFERENCE_SKILL,
];

/**
 * Score a query against a skill's triggers.
 * Returns 0 (no match) to 1 (strong match).
 */
function scoreSkill(query, skill) {
  const q = query.toLowerCase();
  let score = 0;

  const keywordHits = skill.triggers.keywords.filter(kw => q.includes(kw));
  score += keywordHits.length * 0.3;

  const patternHits = skill.triggers.patterns.filter(p => p.test(query));
  score += patternHits.length * 0.5;

  return Math.min(1.0, score);
}

/**
 * Detect which skill is relevant for a given query.
 * Returns the best-matching skill or null.
 */
export function detectSkill(query) {
  if (!query) return null;
  const scored = SKILL_REGISTRY
    .map(skill => ({ skill, score: scoreSkill(query, skill) }))
    .filter(s => s.score >= 0.3)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].skill : null;
}

/**
 * Build the system prompt as an array of content blocks with cache breakpoints.
 * Layer 1: Core persona (always cached)
 * Layer 2: Skill card (cached per-skill, optional)
 */
export function buildSystemBlocks(corePrompt, detectedSkill) {
  const blocks = [
    {
      type: "text",
      text: corePrompt,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (detectedSkill) {
    blocks.push({
      type: "text",
      text: detectedSkill.promptCard,
      cache_control: { type: "ephemeral" },
    });
  }

  return blocks;
}
