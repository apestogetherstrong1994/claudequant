export const SYNTHETIC_DATA_SKILL = {
  id: "synthetic-data",
  name: "Synthetic Data Generation",
  triggers: {
    keywords: [
      "synthetic data", "generate data", "simulate data",
      "data generation", "fake data", "mock data",
      "bootstrap", "monte carlo", "simulation",
      "copula", "sampling", "resample",
    ],
    patterns: [
      /synthetic\s*data/i,
      /generat(e|ing)\s*(fake|mock|synthetic|simulated)\s*data/i,
      /simulat(e|ion)\s*(data|dataset)/i,
      /bootstrap\s*(sample|resample|method)/i,
      /monte\s*carlo\s*(sim|method)/i,
      /data\s*(generat|simulat|augment)/i,
    ],
  },
  promptCard: `## Skill: Synthetic Data Generation

### Decision Framework

\`\`\`
Kind?
├── Match existing: univariate→fit+sample(scipy.stats), multivariate→copula, time series→block bootstrap
├── Augment: imbalanced→SMOTE, preserve correlations→copula-based
├── From scratch: known dist→np.random, complex→generative process
└── Privacy: differential privacy + synthetic
\`\`\`

### Methods

Fit & sample: try norm/lognorm/gamma/beta/expon, pick by KS test.
Correlated: multivariate_normal(means, cov, n). Bootstrap: sample w/ replacement, CI=[2.5,97.5] percentile.

### Pitfalls

1. **Assuming normality**: Fit multiple distributions
2. **Ignoring correlations**: Independent columns destroy structure
3. **Overfitting**: Capture patterns, don't memorize
4. **Dependent data**: Block bootstrap for time series
5. **Not validating**: Compare synthetic vs real (KS, marginals, correlations)
`,
  followUps: [
    "Generate synthetic data matching distribution",
    "Run Monte Carlo simulation",
    "Bootstrap confidence intervals",
    "Create synthetic time series",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
