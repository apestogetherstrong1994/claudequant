export const PORTFOLIO_OPTIMIZATION_SKILL = {
  id: "portfolio-optimization",
  name: "Portfolio Optimization",
  triggers: {
    keywords: [
      "portfolio", "optimization", "sharpe", "efficient frontier",
      "markowitz", "risk parity", "allocation", "diversification",
      "mean-variance", "rebalance", "max drawdown", "risk-adjusted",
    ],
    patterns: [
      /portfolio\s*(optim|alloc|construct|rebalanc)/i,
      /efficient\s*frontier/i, /sharpe\s*ratio/i, /markowitz/i,
      /risk\s*parity/i, /mean[\s-]*variance/i,
      /max(imum)?\s*drawdown/i, /asset\s*allocation/i,
    ],
  },
  promptCard: `## Skill: Portfolio Optimization

### Decision Framework

\`\`\`
Objective?
├── Max risk-adjusted return → Mean-Variance (max Sharpe)
├── Target return, min risk → MVO (min variance)
├── Equal risk contribution → Risk Parity
├── Max diversification → HRP or Max Diversification
├── Min tail risk → CVaR optimization
└── Simple robust → Equal-weight or Inverse-volatility

Constraints?
├── Long-only → w ≥ 0
├── Max position → w ≤ max_weight
├── Sector limits → Group constraints
└── Turnover → Transaction cost penalty
\`\`\`

### Key Formulas

E[Rp] = w'μ, σ²p = w'Σw, Sharpe = (E[Rp]-Rf)/σp
Annualize: μ×252, σ×√252. Log returns for math, simple for reporting.

### Risk Metrics (always report all)

Ann. return, ann. vol, Sharpe, Sortino, max drawdown, Calmar, VaR(95%), CVaR(95%)

### Methods

| Method | Best For |
|--------|----------|
| Max Sharpe | Active allocation |
| Min Variance | Conservative |
| Risk Parity | Balanced exposure |
| Equal Weight | High estimation error |
| Black-Litterman | Active views |

### Pitfalls

1. **Estimation error**: MVO very sensitive to μ. Use shrinkage, Black-Litterman, resampling.
2. **Overfitting**: Use rolling/expanding window backtest.
3. **Transaction costs**: Add turnover constraints.
4. **Concentration**: Add max weight constraints (~25%).
5. **Short lookback**: Need 2-3yr+ for stable covariance.
6. **Crisis correlations**: Stress-test with crisis-period data.
`,
  followUps: [
    "Optimize for maximum Sharpe ratio",
    "Plot the efficient frontier",
    "Calculate risk parity weights",
    "Compute risk metrics",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "matplotlib"],
};
