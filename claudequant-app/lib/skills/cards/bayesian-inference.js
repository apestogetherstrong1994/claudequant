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
      /mcmc|markov\s*chain/i, /credible\s*interval/i,
      /conjugate\s*prior/i, /hierarchical\s*(model|bayesian)/i,
    ],
  },
  promptCard: `## Skill: Bayesian Inference

### Decision Framework

\`\`\`
Goal?
├── Parameter estimation: conjugate→analytical, simple→grid approx, complex→MCMC
├── Model comparison → Bayes Factor or WAIC/LOO
├── Prediction → Posterior predictive
└── Bayesian A/B → P(B>A|data) from posterior samples

Conjugates: Binomial+Beta, Normal+Normal, Poisson+Gamma, Normal(unknown σ)+NIG
\`\`\`

### Pitfalls

1. **Uninformative priors**: With small data, prior matters. Use domain knowledge.
2. **Credible ≠ confidence**: Credible = P(param in interval | data)
3. **MCMC convergence**: R-hat < 1.01, check ESS and traces
4. **Improper priors**: Flat on unbounded → improper posteriors
5. **Bayes factor**: Very sensitive to prior specification
6. **"Bayesian" ≠ "better"**: With large n, Bayesian ≈ frequentist
`,
  followUps: [
    "Run Bayesian A/B test",
    "Estimate posterior distribution",
    "Compare models with Bayes factors",
    "Posterior predictive samples",
  ],
  pythonDeps: ["scipy", "numpy", "pandas"],
};
