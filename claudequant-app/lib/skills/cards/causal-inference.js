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
      /difference[\s-]*in[\s-]*difference/i,
      /diff[\s-]*in[\s-]*diff/i,
      /instrumental\s*variable/i,
      /regression\s*discontinuity/i,
      /propensity\s*score/i,
      /treatment\s*(effect|group|assign)/i,
      /counterfactual/i,
      /natural\s*experiment/i,
    ],
  },
  promptCard: `## Skill: Causal Inference

### Decision Framework

\`\`\`
What is your identification strategy?
├── Randomized experiment (RCT)
│   └── Simple difference in means (OLS with controls for precision)
├── Observational data, pre/post with control group
│   └── Difference-in-Differences (DiD)
├── Observational data, sharp cutoff in assignment
│   └── Regression Discontinuity Design (RDD)
├── Observational data, instrument available
│   └── Instrumental Variables (2SLS)
├── Observational data, selection on observables
│   └── Propensity Score Matching / Inverse Probability Weighting
└── Panel data, staggered treatment
    └── Event study / Staggered DiD (Callaway-Sant'Anna)
\`\`\`

### Key Methods

**Difference-in-Differences (DiD)**
- Assumption: Parallel trends (treatment and control would have followed same trend absent treatment)
- Always test: plot pre-treatment trends, run placebo tests
- Robust standard errors: cluster at the unit of treatment

**Propensity Score Matching**
- Estimate P(treatment | X) via logistic regression
- Match treated to control on propensity score
- Check balance: standardized mean differences < 0.1

**Instrumental Variables (2SLS)**
- Instrument Z must be: (1) relevant (correlated with treatment), (2) exogenous (uncorrelated with error)
- First stage F-statistic > 10 (weak instrument test)
- Estimates LATE (Local Average Treatment Effect), not ATE

**Regression Discontinuity (RDD)**
- Sharp: treatment deterministically assigned at cutoff
- Fuzzy: treatment probability jumps at cutoff (use IV)
- Bandwidth selection: use rdrobust package
- Always show the discontinuity plot

### Common Pitfalls

1. **Confusing correlation with causation**: Always state your identification assumption explicitly
2. **Parallel trends violation in DiD**: Test with event study plot; consider synthetic control if trends diverge
3. **Bad controls**: Don't control for post-treatment variables (mediators)
4. **p-hacking treatment effects**: Pre-register your specification or show robustness across many specs
5. **Weak instruments**: First-stage F < 10 means IV estimates are unreliable and biased toward OLS
6. **Selection on unobservables**: Propensity score matching only works if all confounders are observed

### Python Code Templates

\`\`\`python
import numpy as np
import pandas as pd
import statsmodels.api as sm
from linearmodels.iv import IV2SLS

# --- DiD ---
def did_estimate(df, outcome, treated_col, post_col):
    df['interaction'] = df[treated_col] * df[post_col]
    X = sm.add_constant(df[[treated_col, post_col, 'interaction']])
    model = sm.OLS(df[outcome], X).fit(cov_type='cluster', cov_kwds={'groups': df[treated_col]})
    print(f"DiD estimate (interaction): {model.params['interaction']:.4f} (p={model.pvalues['interaction']:.4f})")
    return model

# --- Propensity Score Matching ---
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors

def propensity_match(df, treatment_col, covariates, outcome_col, n_neighbors=1):
    lr = LogisticRegression(max_iter=1000)
    lr.fit(df[covariates], df[treatment_col])
    df['pscore'] = lr.predict_proba(df[covariates])[:, 1]

    treated = df[df[treatment_col] == 1]
    control = df[df[treatment_col] == 0]

    nn = NearestNeighbors(n_neighbors=n_neighbors)
    nn.fit(control[['pscore']])
    distances, indices = nn.kneighbors(treated[['pscore']])

    matched_control = control.iloc[indices.flatten()]
    att = treated[outcome_col].mean() - matched_control[outcome_col].mean()
    print(f"ATT (propensity score matching): {att:.4f}")
    return att, df
\`\`\`
`,
  followUps: [
    "Estimate the causal effect using difference-in-differences",
    "Check the parallel trends assumption",
    "Run propensity score matching on this data",
    "Set up an instrumental variables regression",
    "Design a regression discontinuity analysis",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels", "scikit-learn", "linearmodels"],
};
