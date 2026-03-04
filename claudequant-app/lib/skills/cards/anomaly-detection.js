export const ANOMALY_DETECTION_SKILL = {
  id: "anomaly-detection",
  name: "Anomaly Detection",
  triggers: {
    keywords: [
      "anomaly", "outlier", "anomaly detection", "outlier detection",
      "isolation forest", "mahalanobis", "z-score",
      "iqr", "interquartile range", "novelty detection",
      "unusual", "abnormal", "spike detection",
    ],
    patterns: [
      /anomal(y|ies|ous)\s*(detect|find|identif)/i,
      /outlier\s*(detect|find|identif|remov)/i,
      /isolation\s*forest/i, /mahalanobis/i,
      /spike\s*(detect|find)/i, /find\s*(unusual|abnormal|anomal)/i,
    ],
  },
  promptCard: `## Skill: Anomaly Detection

### Decision Framework

\`\`\`
Data type?
├── Univariate: normal→Z-score(|z|>3), skewed→IQR(1.5×), time series→rolling/STL
├── Multivariate: low-dim→Mahalanobis, high-dim→Isolation Forest/LOF
└── Unsupervised: density→DBSCAN/LOF, tree→Isolation Forest, statistical→Elliptic Envelope
\`\`\`

### Pitfalls

1. **Z-score assumes normality**: Use IQR for skewed data
2. **Contamination**: Set to expected anomaly rate
3. **Univariate misses multivariate**: Normal per-dim but anomalous jointly
4. **Don't remove blindly**: Investigate — anomalies may be most interesting
5. **Validate with labels**: Evaluate recall if any labeled anomalies exist
`,
  followUps: [
    "Detect anomalies in this dataset",
    "Compare outlier methods",
    "Run Isolation Forest",
    "Detect time series spikes",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
