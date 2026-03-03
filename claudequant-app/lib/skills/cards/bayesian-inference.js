export const BAYESIAN_INFERENCE_SKILL = {
  id: "bayesian-inference",
  name: "Bayesian Inference",
  triggers: {
    keywords: [
      "bayesian", "prior", "posterior", "bayes",
      "mcmc", "markov chain monte carlo",
      "credible interval", "bayesian updating",
      "conjugate prior", "hierarchical model",
      "bayesian regression", "probabilistic programming",
    ],
    patterns: [
      /bayesian\s*(inference|analysis|model|updat|approach|method)/i,
      /prior\s*(distribut|belief|inform)/i,
      /posterior\s*(distribut|probability|estimat)/i,
      /mcmc|markov\s*chain/i,
      /credible\s*interval/i,
      /conjugate\s*prior/i,
      /hierarchical\s*(model|bayesian)/i,
    ],
  },
  promptCard: `## Skill: Bayesian Inference

### Decision Framework

\`\`\`
What's the inference goal?
├── Parameter estimation
│   ├── Conjugate prior available → Analytical posterior
│   ├── Simple model → Grid approximation
│   └── Complex model → MCMC (PyMC, Stan)
├── Model comparison
│   └── Bayes Factor or WAIC/LOO
├── Prediction
│   └── Posterior predictive distribution
└── A/B testing (Bayesian)
    └── P(B > A | data) from posterior samples

Common conjugate pairs:
├── Binomial likelihood + Beta prior → Beta posterior
├── Normal likelihood (known σ) + Normal prior → Normal posterior
├── Poisson likelihood + Gamma prior → Gamma posterior
└── Normal likelihood (unknown σ) + Normal-Inverse-Gamma → NIG posterior
\`\`\`

### Python Code Templates

\`\`\`python
import numpy as np
from scipy import stats

# Beta-Binomial (e.g., conversion rates)
def bayesian_ab_test(successes_a, trials_a, successes_b, trials_b,
                     prior_alpha=1, prior_beta=1, n_samples=100000):
    # Posterior distributions (Beta)
    post_a = stats.beta(prior_alpha + successes_a, prior_beta + trials_a - successes_a)
    post_b = stats.beta(prior_alpha + successes_b, prior_beta + trials_b - successes_b)

    # Sample from posteriors
    samples_a = post_a.rvs(n_samples)
    samples_b = post_b.rvs(n_samples)

    # P(B > A)
    prob_b_better = np.mean(samples_b > samples_a)

    # Expected lift
    lift = (samples_b - samples_a) / samples_a
    expected_lift = np.mean(lift)
    ci_lift = np.percentile(lift, [2.5, 97.5])

    print(f"P(B > A) = {prob_b_better:.4f}")
    print(f"Expected lift: {expected_lift:.2%}")
    print(f"95% credible interval for lift: [{ci_lift[0]:.2%}, {ci_lift[1]:.2%}]")

    return prob_b_better, expected_lift, ci_lift

# Grid approximation for any likelihood
def grid_approximate(likelihood_fn, prior_fn, param_range, n_grid=1000):
    grid = np.linspace(param_range[0], param_range[1], n_grid)
    prior = np.array([prior_fn(p) for p in grid])
    likelihood = np.array([likelihood_fn(p) for p in grid])
    posterior = prior * likelihood
    posterior = posterior / np.trapz(posterior, grid)  # normalize
    return grid, posterior

# Credible interval from posterior samples
def credible_interval(samples, level=0.95):
    lower = (1 - level) / 2
    upper = 1 - lower
    return np.percentile(samples, [lower * 100, upper * 100])
\`\`\`

### Common Pitfalls

1. **Uninformative priors aren't always appropriate**: With small data, the prior matters. Use domain knowledge
2. **Confusing credible and confidence intervals**: Credible = P(param in interval | data), fundamentally different
3. **MCMC convergence**: Always check R-hat < 1.01, effective sample size, trace plots
4. **Improper priors**: Flat priors on unbounded parameters can lead to improper posteriors
5. **Bayes factor sensitivity**: BF is very sensitive to prior specification, unlike posterior estimation
6. **"Bayesian" doesn't mean "better"**: With enough data, Bayesian and frequentist give similar answers
`,
  followUps: [
    "Run a Bayesian A/B test on these conversion rates",
    "Estimate the posterior distribution for this parameter",
    "Compare these models using Bayes factors",
    "Set up a hierarchical Bayesian model",
    "Generate posterior predictive samples",
  ],
  pythonDeps: ["scipy", "numpy", "pandas"],
};
