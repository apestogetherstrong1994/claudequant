export const REGRESSION_DIAGNOSTICS_SKILL = {
  id: "regression-diagnostics",
  name: "Regression Diagnostics",
  triggers: {
    keywords: [
      "regression diagnostic", "residual", "heteroscedasticity",
      "multicollinearity", "vif", "variance inflation",
      "autocorrelation", "durbin-watson", "normality test",
      "cook's distance", "leverage", "influential point",
      "breusch-pagan", "white test", "ols assumption",
    ],
    patterns: [
      /regression\s*diagnostic/i, /residual\s*(plot|analysis|check)/i,
      /heteroscedast/i, /multicollinear/i,
      /vif|variance\s*inflation/i, /ols\s*assumption/i,
      /cook'?s?\s*distance/i, /influential\s*(point|observation)/i,
    ],
  },
  promptCard: `## Skill: Regression Diagnostics

### OLS Assumptions & Tests

| Assumption | Test | Threshold |
|------------|------|-----------|
| Normality | Shapiro-Wilk, Jarque-Bera | p < 0.05 |
| Homoscedasticity | Breusch-Pagan, White | p < 0.05 = hetero |
| Autocorrelation | Durbin-Watson | ~2 = none |
| Multicollinearity | VIF | >10 high, >5 moderate |
| Influential pts | Cook's distance | > 4/n |

Use statsmodels: het_breuschpagan, durbin_watson, variance_inflation_factor, OLSInfluence.

### Pitfalls

1. **Heteroscedasticity**: Use HC3 robust SEs
2. **VIF > 10**: Consider centering or combining, not just dropping
3. **Normality least important**: CLT covers n > 30
4. **Outlier ≠ influential**: Needs high leverage AND coefficient change
5. **R² doesn't validate**: Violated assumptions = misleading inference
`,
  followUps: [
    "Run full regression diagnostics",
    "Check multicollinearity (VIF)",
    "Test for heteroscedasticity",
    "Identify influential observations",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels"],
};
