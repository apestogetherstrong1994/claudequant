export const AB_TESTING_SKILL = {
  id: "ab-testing",
  name: "A/B Testing & Experimentation",
  triggers: {
    keywords: [
      "a/b test", "ab test", "split test", "experiment",
      "control group", "treatment effect", "conversion rate",
      "lift", "significance", "variant", "randomized",
      "hypothesis test", "proportion test",
    ],
    patterns: [
      /a\/?b\s*test/i, /split\s*test/i, /control\s*(vs|versus|group)/i,
      /conversion\s*rate/i, /statistical(ly)?\s*significant/i,
      /treatment\s*(effect|group)/i, /experiment\s*design/i,
      /sample\s*ratio\s*mismatch/i, /multiple\s*comparison/i,
    ],
  },
  promptCard: `## Skill: A/B Testing & Experimentation

### Decision Framework

\`\`\`
Primary metric type?
├── Binary (click/convert) → Z-test for proportions (2 variants) or Chi-squared (multiple)
├── Continuous (revenue, time) → Welch's t-test (2 variants) or ANOVA + Tukey HSD
└── Count data (events/session) → Poisson or negative binomial regression

Ratio-based metric? → Use delta method for variance estimation
Pre-experiment covariates? → Use CUPED for variance reduction (30-50% savings)
\`\`\`

### Protocol

1. **Pre-experiment**: Calculate sample size (statsmodels NormalIndPower/TTestIndPower). Inputs: baseline rate, MDE, alpha=0.05, power=0.80.
2. **During**: Check Sample Ratio Mismatch (chi-squared, p < 0.001 = broken randomization = INVALID).
3. **Post**: Run test, report effect size + CI + p-value. Apply FDR correction if multiple metrics.
4. **CUPED**: If pre-experiment data exists, use covariate adjustment to reduce variance.

### Reference

| Scenario | Test | Effect Size |
|----------|------|-------------|
| Conversion rates | Z-test for proportions | Cohen's h |
| Revenue per user | Welch's t-test | Cohen's d |
| Multiple variants | Chi-squared + pairwise | Cramér's V |
| Time-to-event | Log-rank test | Hazard ratio |

### Pitfalls

1. **Peeking**: Stopping early at p < 0.05 inflates false positive to ~26%. Use sequential testing.
2. **Under-powering**: Non-significant ≠ no effect. Report CIs and minimum detectable effect.
3. **SRM**: Split deviation (p < 0.001) = broken randomization.
4. **Network effects**: User interactions leak treatment to control. Use cluster randomization.
5. **Multiple metrics**: 20 tests at α=0.05 ≈ 1 false positive. Use FDR correction.
6. **Post-treatment filtering**: Never filter by during-experiment behavior.
7. **Lift without CI**: Report "10% lift, 95% CI [3%, 17%]".
8. **Revenue tails**: Winsorize at 99th percentile for heavy-tailed metrics.
`,
  followUps: [
    "Calculate the sample size needed for this A/B test",
    "Analyze these A/B test results for significance",
    "Check for sample ratio mismatch",
    "Apply multiple comparison correction",
  ],
  pythonDeps: ["scipy", "numpy", "statsmodels", "pandas"],
};
