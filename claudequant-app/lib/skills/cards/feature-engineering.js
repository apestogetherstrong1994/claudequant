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
      /one[\s-]*hot/i,
      /encoding\s*(categor|nominal|ordinal)/i,
      /transform\s*(feature|variable|column)/i,
      /dimension(ality)?\s*reduc/i,
      /pca|principal\s*component/i,
    ],
  },
  promptCard: `## Skill: Feature Engineering

### Decision Framework

\`\`\`
Variable type?
├── Numeric
│   ├── Skewed → log/sqrt/Box-Cox transform
│   ├── Outliers → winsorize or robust scaling
│   ├── Different scales → StandardScaler or MinMaxScaler
│   └── Non-linear relationship → polynomial features, binning
├── Categorical
│   ├── Low cardinality (< 10) → one-hot encoding
│   ├── High cardinality → target encoding, frequency encoding
│   ├── Ordinal → ordinal encoding (preserve order)
│   └── Text-like → TF-IDF, embeddings
├── DateTime
│   ├── Extract: year, month, day, hour, day_of_week, is_weekend
│   ├── Cyclical encoding (sin/cos for month, hour)
│   └── Time since event, rolling aggregates
└── Missing values
    ├── MCAR → mean/median imputation OK
    ├── MAR → model-based imputation (KNN, iterative)
    └── MNAR → indicator variable + imputation
\`\`\`

### Python Code Templates

\`\`\`python
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, PolynomialFeatures
from sklearn.feature_selection import SelectKBest, mutual_info_regression

# Numeric transforms
def create_numeric_features(df, col):
    df[f'{col}_log'] = np.log1p(df[col].clip(lower=0))
    df[f'{col}_sqrt'] = np.sqrt(df[col].clip(lower=0))
    df[f'{col}_squared'] = df[col] ** 2
    df[f'{col}_binned'] = pd.qcut(df[col], q=5, labels=False, duplicates='drop')
    return df

# Cyclical encoding for periodic features
def cyclical_encode(df, col, max_val):
    df[f'{col}_sin'] = np.sin(2 * np.pi * df[col] / max_val)
    df[f'{col}_cos'] = np.cos(2 * np.pi * df[col] / max_val)
    return df

# Target encoding
def target_encode(df, cat_col, target_col, smoothing=10):
    global_mean = df[target_col].mean()
    agg = df.groupby(cat_col)[target_col].agg(['mean', 'count'])
    smooth = (agg['count'] * agg['mean'] + smoothing * global_mean) / (agg['count'] + smoothing)
    df[f'{cat_col}_target_enc'] = df[cat_col].map(smooth)
    return df

# Feature importance
def feature_importance_report(X, y, feature_names):
    from sklearn.ensemble import RandomForestRegressor
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    rf.fit(X, y)
    importance = pd.DataFrame({'feature': feature_names, 'importance': rf.feature_importances_})
    return importance.sort_values('importance', ascending=False)
\`\`\`

### Common Pitfalls

1. **Data leakage**: Never use test data to fit transformers. Use Pipeline with fit_transform on train only
2. **Target leakage**: Don't include features derived from the target or future information
3. **One-hot explosion**: High-cardinality categoricals create thousands of sparse columns
4. **Scaling before split**: Fit scaler on training data only, transform both
5. **Multicollinearity**: Polynomial features and interactions can create highly correlated features. Check VIF
`,
  followUps: [
    "Engineer features from this datetime column",
    "What's the best encoding for these categorical variables?",
    "Create interaction features and check importance",
    "Handle missing values in this dataset",
    "Select the most important features for prediction",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
