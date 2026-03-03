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
      /effect\s*size/i,
      /statistical\s*power/i,
    ],
  },
  promptCard: `## Skill: Power Analysis & Sample Size Determination

### Decision Framework

\`\`\`
What type of test?
├── Two-sample t-test (means)
│   └── Need: effect size (Cohen's d), alpha, power
├── Proportions test (conversion rates)
│   └── Need: baseline rate, minimum detectable effect, alpha, power
├── Chi-squared test
│   └── Need: effect size (Cohen's w), df, alpha, power
├── ANOVA (multiple groups)
│   └── Need: effect size (Cohen's f), groups, alpha, power
└── Regression (continuous predictor)
    └── Need: f², predictors, alpha, power

Standard targets: alpha = 0.05, power = 0.80 (or 0.90 for high-stakes)
\`\`\`

### Key Formulas

**Cohen's d** (standardized mean difference): d = (μ1 - μ2) / σ_pooled
- Small: 0.2, Medium: 0.5, Large: 0.8

**For proportions**: h = 2 × arcsin(√p1) - 2 × arcsin(√p2)

### Python Code Templates

\`\`\`python
import numpy as np
from scipy import stats
from statsmodels.stats.power import TTestIndPower, NormalIndPower, GofChisquarePower

# Sample size for two-sample t-test
def sample_size_ttest(effect_size, alpha=0.05, power=0.80):
    analysis = TTestIndPower()
    n = analysis.solve_power(effect_size=effect_size, alpha=alpha, power=power, alternative='two-sided')
    print(f"Required n per group: {int(np.ceil(n))}")
    print(f"Total sample size: {int(np.ceil(n)) * 2}")
    return int(np.ceil(n))

# Sample size for proportions (A/B test)
def sample_size_proportions(p1, p2, alpha=0.05, power=0.80):
    from statsmodels.stats.proportion import proportion_effectsize
    es = proportion_effectsize(p1, p2)
    analysis = NormalIndPower()
    n = analysis.solve_power(effect_size=es, alpha=alpha, power=power, alternative='two-sided')
    print(f"Baseline: {p1:.4f}, Target: {p2:.4f}")
    print(f"Effect size (h): {es:.4f}")
    print(f"Required n per group: {int(np.ceil(n))}")
    return int(np.ceil(n))

# Power curve
def power_curve(effect_sizes, n_per_group, alpha=0.05):
    analysis = TTestIndPower()
    powers = [analysis.power(effect_size=es, nobs1=n_per_group, alpha=alpha) for es in effect_sizes]
    return effect_sizes, powers
\`\`\`

### Common Pitfalls

1. **Post-hoc power analysis is meaningless**: Don't compute power after seeing results
2. **Multiple comparisons**: If testing 5 variants, adjust alpha (Bonferroni: alpha/5)
3. **Ignoring clustering**: Clustered data needs cluster-adjusted sample sizes
4. **Optimistic effect sizes**: Use realistic MDE from prior data, not hoped-for effects
5. **Ignoring dropout/attrition**: Inflate sample size by expected attrition rate
`,
  followUps: [
    "Calculate sample size for this A/B test",
    "Plot a power curve for different effect sizes",
    "What's the minimum detectable effect with my current sample?",
    "How long should I run this experiment?",
  ],
  pythonDeps: ["scipy", "numpy", "statsmodels"],
};
