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
      /isolation\s*forest/i,
      /mahalanobis/i,
      /spike\s*(detect|find)/i,
      /find\s*(unusual|abnormal|anomal)/i,
    ],
  },
  promptCard: `## Skill: Anomaly Detection

### Decision Framework

\`\`\`
Data characteristics?
├── Univariate
│   ├── Normal distribution → Z-score (|z| > 3)
│   ├── Unknown distribution → IQR method (1.5×IQR rule)
│   └── Time series → Rolling statistics, STL residuals
├── Multivariate
│   ├── Low-dimensional (< 10 features) → Mahalanobis distance
│   ├── High-dimensional → Isolation Forest, LOF
│   └── Labeled anomalies available → Supervised (rare event classification)
└── Unsupervised
    ├── Density-based → DBSCAN, LOF
    ├── Tree-based → Isolation Forest (best general purpose)
    └── Statistical → Elliptic Envelope (assumes Gaussian)
\`\`\`

### Python Code Templates

\`\`\`python
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor

# Z-score method
def zscore_anomalies(series, threshold=3):
    z = np.abs(stats.zscore(series.dropna()))
    return series.index[z > threshold]

# IQR method
def iqr_anomalies(series, k=1.5):
    Q1, Q3 = series.quantile(0.25), series.quantile(0.75)
    IQR = Q3 - Q1
    lower, upper = Q1 - k * IQR, Q3 + k * IQR
    mask = (series < lower) | (series > upper)
    return series[mask].index, lower, upper

# Isolation Forest
def isolation_forest_anomalies(X, contamination=0.05):
    iso = IsolationForest(contamination=contamination, random_state=42)
    labels = iso.fit_predict(X)  # -1 = anomaly, 1 = normal
    scores = iso.score_samples(X)
    return labels, scores

# Mahalanobis distance
def mahalanobis_anomalies(X, threshold_percentile=97.5):
    from scipy.spatial.distance import mahalanobis
    mean = X.mean(axis=0)
    cov = np.cov(X.T)
    cov_inv = np.linalg.pinv(cov)
    distances = [mahalanobis(row, mean, cov_inv) for row in X.values]
    threshold = np.percentile(distances, threshold_percentile)
    anomalies = np.array(distances) > threshold
    return anomalies, distances
\`\`\`

### Common Pitfalls

1. **Z-score assumes normality**: Use IQR for skewed data
2. **Isolation Forest contamination parameter**: Set it to your expected anomaly rate, not arbitrarily
3. **Multivariate outliers missed by univariate methods**: A point can be normal on each dimension but anomalous jointly
4. **Removing outliers blindly**: Investigate first — anomalies may be the most interesting data points
5. **Not validating**: If you have any labeled anomalies, use them to evaluate your method's recall
`,
  followUps: [
    "Detect anomalies in this dataset",
    "Find outliers using multiple methods and compare",
    "Run Isolation Forest on these features",
    "Detect spikes in this time series",
    "Calculate Mahalanobis distances for multivariate outlier detection",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
