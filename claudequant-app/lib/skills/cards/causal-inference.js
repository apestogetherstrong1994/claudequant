export const CAUSAL_INFERENCE_SKILL = {
  id: "causal-inference",
  name: "Causal Inference",
  triggers: {
    keywords: [
      "causal", "causation", "treatment effect", "counterfactual",
      "difference-in-differences", "diff-in-diff", "did",
      "instrumental variable", "regression discontinuity", "rdd",
      "propensity score", "matching", "average treatment effect",
      "ate", "att", "selection bias", "endogeneity",
    ],
    patterns: [
      /causal\s*(inference|effect|impact|analysis)/i,
      /difference[\s-]*in[\s-]*difference/i, /diff[\s-]*in[\s-]*diff/i,
      /instrumental\s*variable/i, /regression\s*discontinuity/i,
      /propensity\s*score/i, /treatment\s*(effect|group|assign)/i,
      /counterfactual/i, /natural\s*experiment/i,
    ],
  },
  promptCard: `## Skill: Causal Inference

### Decision Framework

\`\`\`
Identification strategy?
├── RCT → Difference in means (OLS + controls)
├── Pre/post + control → Difference-in-Differences (DiD)
├── Sharp cutoff → Regression Discontinuity (RDD)
├── Instrument available → IV (2SLS)
├── Selection on observables → Propensity Score Matching / IPW
└── Staggered treatment → Event study / Staggered DiD
\`\`\`

### Methods

**DiD**: Parallel trends assumption. Plot pre-trends, run placebo tests. Cluster SEs at treatment unit.
**PSM**: Logistic P(treatment|X). Match on score. Balance check: std mean diff < 0.1.
**IV**: Relevant (correlated w/ treatment) + exogenous. First-stage F > 10. Estimates LATE not ATE.
**RDD**: Sharp or fuzzy. Use rdrobust for bandwidth. Always show discontinuity plot.

### Pitfalls

1. **Correlation ≠ causation**: State identification assumption explicitly
2. **Parallel trends**: Test with event study; consider synthetic control
3. **Bad controls**: Never control for post-treatment variables
4. **Weak instruments**: F < 10 = biased toward OLS
5. **Unobservables**: PSM only works if ALL confounders observed
`,
  followUps: [
    "Estimate causal effect with DiD",
    "Check parallel trends",
    "Run propensity score matching",
    "Set up IV regression",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels", "scikit-learn"],
};
