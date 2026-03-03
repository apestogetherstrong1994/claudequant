export const AB_TESTING_SKILL = {
  id: "ab-testing",
  name: "A/B Testing & Experimentation",
  triggers: {
    keywords: [
      "a/b test",
      "ab test",
      "split test",
      "experiment",
      "control group",
      "treatment effect",
      "conversion rate",
      "lift",
      "significance",
      "variant",
      "randomized",
      "hypothesis test",
      "proportion test",
    ],
    patterns: [
      /a\/?b\s*test/i,
      /split\s*test/i,
      /control\s*(vs|versus|group)/i,
      /conversion\s*rate/i,
      /statistical(ly)?\s*significant/i,
      /treatment\s*(effect|group)/i,
      /experiment\s*design/i,
      /sample\s*ratio\s*mismatch/i,
      /multiple\s*comparison/i,
    ],
  },
  promptCard: `## Skill: A/B Testing & Experimentation

### Decision Framework: Choosing the Right Test

\`\`\`
What is your primary metric?
├── Binary outcome (click/no-click, convert/no-convert)
│   ├── Two variants → Z-test for proportions
│   └── Multiple variants → Chi-squared test + pairwise comparisons
├── Continuous outcome (revenue, time on page)
│   ├── Two variants → Welch's t-test (unequal variances)
│   └── Multiple variants → ANOVA + Tukey HSD
└── Count data (pageviews, events per session)
    └── Poisson or negative binomial regression

Is the metric ratio-based (e.g., revenue per user)?
├── Yes → Use delta method for variance estimation
└── No  → Standard variance estimation

Do you have pre-experiment covariates?
├── Yes → Use CUPED (Controlled-experiment Using Pre-Experiment Data) for variance reduction
└── No  → Standard analysis
\`\`\`

### Step-by-Step Protocol

#### 1. Pre-Experiment: Sample Size Calculation

For a two-proportion z-test (most common A/B test):

**Formula:**
\`\`\`
n = (Z_{α/2} + Z_β)² × [p₁(1-p₁) + p₂(1-p₂)] / (p₂ - p₁)²
\`\`\`

Where:
- p₁ = baseline conversion rate
- p₂ = minimum detectable conversion rate (p₁ × (1 + MDE))
- Z_{α/2} = 1.96 for α=0.05 (two-sided)
- Z_β = 0.84 for power=0.80

**Python:**
\`\`\`python
import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportion_effectsize
from statsmodels.stats.power import NormalIndPower

def calculate_sample_size(baseline_rate, mde_relative, alpha=0.05, power=0.80):
    """
    Calculate required sample size per variant.

    Parameters
    ----------
    baseline_rate : float
        Current conversion rate (e.g., 0.05 for 5%)
    mde_relative : float
        Minimum detectable effect as relative change (e.g., 0.10 for 10% lift)
    alpha : float
        Significance level (default 0.05)
    power : float
        Statistical power (default 0.80)

    Returns
    -------
    int : required sample size per variant
    """
    new_rate = baseline_rate * (1 + mde_relative)
    effect_size = proportion_effectsize(new_rate, baseline_rate)
    analysis = NormalIndPower()
    n = analysis.solve_power(
        effect_size=effect_size,
        alpha=alpha,
        power=power,
        ratio=1.0,
        alternative='two-sided'
    )
    return int(np.ceil(n))

# Example: 5% baseline, detect 10% relative lift
n = calculate_sample_size(0.05, 0.10)
print(f"Need {n} users per variant ({2*n} total)")
\`\`\`

#### 2. During Experiment: Sanity Checks

**Sample Ratio Mismatch (SRM) Detection:**
\`\`\`python
def check_srm(n_control, n_treatment, expected_ratio=0.5):
    """
    Detect sample ratio mismatch using chi-squared test.
    SRM indicates a bug in randomization — results are invalid.
    """
    n_total = n_control + n_treatment
    expected_control = n_total * expected_ratio
    expected_treatment = n_total * (1 - expected_ratio)

    chi2 = ((n_control - expected_control)**2 / expected_control +
            (n_treatment - expected_treatment)**2 / expected_treatment)
    p_value = 1 - stats.chi2.cdf(chi2, df=1)

    if p_value < 0.001:
        print(f"WARNING: SRM detected (p={p_value:.6f})")
        print(f"  Expected: {expected_control:.0f}/{expected_treatment:.0f}")
        print(f"  Observed: {n_control}/{n_treatment}")
        print("  DO NOT trust experiment results. Investigate randomization.")
    else:
        print(f"No SRM detected (p={p_value:.4f})")

    return p_value
\`\`\`

#### 3. Post-Experiment: Analysis

**Z-test for proportions (binary metrics):**
\`\`\`python
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

def analyze_ab_proportions(successes_ctrl, n_ctrl, successes_treat, n_treat, alpha=0.05):
    """
    Analyze A/B test with binary outcome.
    Returns z-stat, p-value, confidence interval for the difference.
    """
    count = np.array([successes_treat, successes_ctrl])
    nobs = np.array([n_treat, n_ctrl])

    # Z-test
    z_stat, p_value = proportions_ztest(count, nobs, alternative='two-sided')

    # Point estimates
    p_ctrl = successes_ctrl / n_ctrl
    p_treat = successes_treat / n_treat
    lift = (p_treat - p_ctrl) / p_ctrl

    # Confidence interval for the difference (Agresti-Caffo method)
    ci_low, ci_high = confint_proportions_2indep(
        successes_treat, n_treat, successes_ctrl, n_ctrl,
        method='agresti-caffo', alpha=alpha
    )

    print(f"Control rate:   {p_ctrl:.4f}")
    print(f"Treatment rate: {p_treat:.4f}")
    print(f"Absolute diff:  {p_treat - p_ctrl:+.4f}")
    print(f"Relative lift:  {lift:+.2%}")
    print(f"95% CI (diff):  [{ci_low:.4f}, {ci_high:.4f}]")
    print(f"Z-statistic:    {z_stat:.4f}")
    print(f"P-value:        {p_value:.6f}")
    print(f"Significant:    {'Yes' if p_value < alpha else 'No'} (α={alpha})")

    return {
        'z_stat': z_stat, 'p_value': p_value,
        'lift': lift, 'ci': (ci_low, ci_high)
    }
\`\`\`

**Welch's t-test for continuous metrics:**
\`\`\`python
def analyze_ab_continuous(control_values, treatment_values, alpha=0.05):
    """
    Analyze A/B test with continuous outcome (e.g., revenue).
    Uses Welch's t-test (does not assume equal variances).
    """
    t_stat, p_value = stats.ttest_ind(treatment_values, control_values, equal_var=False)

    mean_ctrl = np.mean(control_values)
    mean_treat = np.mean(treatment_values)
    diff = mean_treat - mean_ctrl

    # CI for difference using Welch-Satterthwaite
    se = np.sqrt(np.var(treatment_values, ddof=1)/len(treatment_values) +
                 np.var(control_values, ddof=1)/len(control_values))
    ci_low = diff - stats.t.ppf(1 - alpha/2, df=min(len(control_values), len(treatment_values))-1) * se
    ci_high = diff + stats.t.ppf(1 - alpha/2, df=min(len(control_values), len(treatment_values))-1) * se

    print(f"Control mean:   {mean_ctrl:.4f}")
    print(f"Treatment mean: {mean_treat:.4f}")
    print(f"Difference:     {diff:+.4f}")
    print(f"95% CI:         [{ci_low:.4f}, {ci_high:.4f}]")
    print(f"T-statistic:    {t_stat:.4f}")
    print(f"P-value:        {p_value:.6f}")

    return {'t_stat': t_stat, 'p_value': p_value, 'ci': (ci_low, ci_high)}
\`\`\`

#### 4. Multiple Comparison Corrections

When testing multiple variants or metrics:

\`\`\`python
from statsmodels.stats.multitest import multipletests

def correct_multiple_tests(p_values, method='fdr_bh', alpha=0.05):
    """
    Correct p-values for multiple comparisons.

    Methods:
    - 'bonferroni': Most conservative. Use when tests are independent.
    - 'holm': Less conservative than Bonferroni, controls FWER.
    - 'fdr_bh': Benjamini-Hochberg. Controls false discovery rate.
                Best for many metrics.
    """
    reject, corrected_pvals, _, _ = multipletests(p_values, alpha=alpha, method=method)

    for i, (orig, corrected, sig) in enumerate(zip(p_values, corrected_pvals, reject)):
        print(f"Test {i+1}: p={orig:.4f} → corrected p={corrected:.4f} {'✓ Sig' if sig else '✗ NS'}")

    return reject, corrected_pvals
\`\`\`

#### 5. CUPED Variance Reduction

\`\`\`python
def cuped_adjustment(y_post, y_pre):
    """
    CUPED: Use pre-experiment data to reduce variance.
    Can reduce required sample size by 30-50%.

    y_post: post-experiment metric values
    y_pre: pre-experiment metric values (same users)
    """
    theta = np.cov(y_post, y_pre)[0, 1] / np.var(y_pre)
    y_adjusted = y_post - theta * (y_pre - np.mean(y_pre))

    variance_reduction = 1 - np.var(y_adjusted) / np.var(y_post)
    print(f"Variance reduced by {variance_reduction:.1%}")

    return y_adjusted
\`\`\`

### Common Pitfalls

1. **Peeking at results**: Do NOT stop the test early when p < 0.05. This inflates false positive rate to ~26%. Use sequential testing (e.g., alpha-spending) if you must peek.

2. **Under-powering**: A non-significant result does NOT mean no effect. Always compute confidence intervals and state the minimum effect you could detect.

3. **Sample Ratio Mismatch**: If control/treatment split deviates from 50/50 (p < 0.001 on chi-squared test), your randomization is broken. Results are INVALID.

4. **Network effects / SUTVA violation**: If users interact (social networks, marketplaces), treatment can leak to control. Consider cluster randomization.

5. **Multiple metrics without correction**: Testing 20 metrics at α=0.05 means ~1 false positive expected. Always apply FDR correction.

6. **Pre-selecting by post-treatment variables**: Never filter your sample by behavior that occurred during the experiment (e.g., "users who visited checkout"). This introduces selection bias.

7. **Using percentage lift without CI**: "10% lift" is meaningless without the confidence interval. Report: "10% lift, 95% CI [3%, 17%]".

8. **Revenue metrics with heavy tails**: Mean revenue is highly variable. Consider Winsorizing at the 99th percentile or using quantile-based metrics.

### Quick Reference

| Scenario | Test | Effect Size |
|----------|------|-------------|
| Conversion rates | Z-test for proportions | Cohen's h |
| Revenue per user | Welch's t-test | Cohen's d |
| Multiple variants | Chi-squared + pairwise | Cramér's V |
| Time-to-event | Log-rank test | Hazard ratio |
| Count metrics | Poisson regression | Rate ratio |
`,
  followUps: [
    "Calculate the sample size needed for this A/B test",
    "Analyze these A/B test results for significance",
    "Check for sample ratio mismatch in this experiment",
    "How long should I run this experiment?",
    "Apply multiple comparison correction to these results",
    "Use CUPED to reduce variance with pre-experiment data",
  ],
  pythonDeps: ["scipy", "numpy", "statsmodels", "pandas"],
};
