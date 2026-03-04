export const FEATURE_ENGINEERING_SKILL = {
  id: "feature-engineering",
  name: "Feature Engineering",
  triggers: {
    keywords: [
      "feature engineering", "feature selection", "feature importance",
      "one-hot encoding", "label encoding", "binning",
      "interaction term", "polynomial features", "log transform",
      "standardization", "normalization", "scaling",
      "target encoding", "feature extraction",
    ],
    patterns: [
      /feature\s*(engineer|select|import|extract|transform)/i,
      /one[\s-]*hot/i, /encoding\s*(categor|nominal|ordinal)/i,
      /transform\s*(feature|variable|column)/i,
      /dimension(ality)?\s*reduc/i, /pca|principal\s*component/i,
    ],
  },
  promptCard: `## Skill: Feature Engineering

### Decision Framework

\`\`\`
Variable type?
├── Numeric: skewed→log/sqrt, outliers→winsorize, scales→StandardScaler, non-linear→polynomial/binning
├── Categorical: low-card→one-hot, high-card→target/frequency encoding, ordinal→ordinal encoding
├── DateTime: extract year/month/day/hour/dow, cyclical sin/cos, time-since-event, rolling aggs
└── Missing: MCAR→mean/median, MAR→KNN/iterative, MNAR→indicator+imputation
\`\`\`

### Pitfalls

1. **Data leakage**: Fit transformers on train only (use Pipeline)
2. **Target leakage**: No features from target or future
3. **One-hot explosion**: High cardinality → thousands of columns
4. **Scaling before split**: Fit on train, transform both
5. **Multicollinearity**: Polynomial features create correlated vars. Check VIF.
`,
  followUps: [
    "Engineer features from datetime column",
    "Best encoding for categorical variables?",
    "Create interaction features",
    "Select most important features",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
