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
What kind of synthetic data?
├── Match existing distribution
│   ├── Univariate → fit distribution + sample (scipy.stats)
│   ├── Multivariate → Gaussian copula or vine copula
│   └── Time series → bootstrap blocks or parametric simulation
├── Augment existing data
│   ├── Tabular → SMOTE (for imbalanced), bootstrap
│   └── Preserve correlations → copula-based generation
├── From scratch (parametric)
│   ├── Known distribution → np.random functions
│   └── Complex structure → define generative process
└── Privacy-preserving
    └── Differential privacy + synthetic generation
\`\`\`

### Python Code Templates

\`\`\`python
import numpy as np
import pandas as pd
from scipy import stats

# Fit and sample from distribution
def fit_and_generate(data, n_samples=1000):
    distributions = [stats.norm, stats.lognorm, stats.gamma, stats.beta, stats.expon]
    best_dist, best_params, best_ks = None, None, np.inf
    for dist in distributions:
        try:
            params = dist.fit(data)
            ks_stat, _ = stats.kstest(data, dist.cdf, params)
            if ks_stat < best_ks:
                best_dist, best_params, best_ks = dist, params, ks_stat
        except:
            continue
    synthetic = best_dist.rvs(*best_params, size=n_samples)
    return synthetic, best_dist.name, best_params

# Multivariate with correlation preservation
def generate_correlated(means, cov_matrix, n_samples=1000):
    return np.random.multivariate_normal(means, cov_matrix, size=n_samples)

# Bootstrap resampling
def bootstrap_samples(data, n_bootstrap=1000, statistic=np.mean):
    stats_list = []
    for _ in range(n_bootstrap):
        sample = np.random.choice(data, size=len(data), replace=True)
        stats_list.append(statistic(sample))
    ci = np.percentile(stats_list, [2.5, 97.5])
    return np.array(stats_list), ci

# Monte Carlo simulation
def monte_carlo_portfolio(returns_mean, returns_cov, weights, n_sims=10000, horizon=252):
    results = []
    for _ in range(n_sims):
        daily_returns = np.random.multivariate_normal(returns_mean, returns_cov, horizon)
        portfolio_returns = daily_returns @ weights
        cumulative = np.prod(1 + portfolio_returns) - 1
        results.append(cumulative)
    return np.array(results)
\`\`\`

### Common Pitfalls

1. **Assuming normality**: Real data is often skewed or heavy-tailed. Fit multiple distributions
2. **Ignoring correlations**: Generating each column independently destroys the correlation structure
3. **Overfitting to training data**: Synthetic data should capture patterns, not memorize individuals
4. **Bootstrap with dependent data**: Standard bootstrap assumes i.i.d. Use block bootstrap for time series
5. **Not validating**: Compare synthetic vs real distributions (KS test, marginal plots, correlation matrices)
`,
  followUps: [
    "Generate synthetic data matching this dataset's distribution",
    "Run a Monte Carlo simulation for this portfolio",
    "Bootstrap confidence intervals for this statistic",
    "Create synthetic time series with similar properties",
    "Augment this imbalanced dataset with SMOTE",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "scikit-learn"],
};
