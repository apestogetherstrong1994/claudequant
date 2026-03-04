export const POWER_ANALYSIS_SKILL = {
  id: "power-analysis",
  name: "Power Analysis & Sample Size",
  triggers: {
    keywords: [
      "power analysis", "sample size", "power calculation",
      "effect size", "statistical power", "minimum detectable effect",
      "mde", "type ii error", "beta error", "underpowered",
    ],
    patterns: [
      /power\s*(analysis|calculation|curve)/i,
      /sample\s*size\s*(calc|determ|require|need)/i,
      /minimum\s*detectable\s*effect/i,
      /how\s*many\s*(sample|observation|participant|user)/i,
      /effect\s*size/i, /statistical\s*power/i,
    ],
  },
  promptCard: `## Skill: Power Analysis & Sample Size

### Decision Framework

\`\`\`
Test type?
├── Two-sample t-test → Cohen's d, alpha, power
├── Proportions → baseline rate, MDE, alpha, power
├── Chi-squared → Cohen's w, df, alpha, power
├── ANOVA → Cohen's f, groups, alpha, power
└── Regression → f², predictors, alpha, power

Standard: alpha=0.05, power=0.80 (0.90 for high-stakes)
\`\`\`

### Effect Sizes

Cohen's d: Small=0.2, Medium=0.5, Large=0.8
Cohen's f (ANOVA): Small=0.1, Medium=0.25, Large=0.4
Use statsmodels TTestIndPower, NormalIndPower, GofChisquarePower.

### Pitfalls

1. **Post-hoc power is meaningless**: Never compute after seeing results
2. **Multiple comparisons**: Adjust alpha (Bonferroni: alpha/k)
3. **Clustering**: Need cluster-adjusted sample sizes
4. **Optimistic MDE**: Use realistic effect sizes from prior data
5. **Attrition**: Inflate by expected dropout rate
`,
  followUps: [
    "Calculate sample size for this test",
    "Plot power curve for different effect sizes",
    "What's the MDE with my current sample?",
  ],
  pythonDeps: ["scipy", "numpy", "statsmodels"],
};
