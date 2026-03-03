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
      /regression\s*diagnostic/i,
      /residual\s*(plot|analysis|check)/i,
      /heteroscedast/i,
      /multicollinear/i,
      /vif|variance\s*inflation/i,
      /ols\s*assumption/i,
      /cook'?s?\s*distance/i,
      /influential\s*(point|observation)/i,
    ],
  },
  promptCard: `## Skill: Regression Diagnostics

### OLS Assumptions Checklist

1. **Linearity**: E[Y|X] is linear in X
2. **Independence**: Errors are independent (no autocorrelation)
3. **Homoscedasticity**: Var(ε|X) is constant
4. **Normality**: Errors are normally distributed (for inference)
5. **No multicollinearity**: Predictors are not perfectly correlated

### Diagnostic Tests

| Assumption | Test | Python |
|------------|------|--------|
| Linearity | Residuals vs fitted plot | Visual |
| Normality | Shapiro-Wilk, Jarque-Bera | scipy.stats.shapiro |
| Homoscedasticity | Breusch-Pagan, White | statsmodels het_breuschpagan |
| Autocorrelation | Durbin-Watson | statsmodels durbin_watson |
| Multicollinearity | VIF | statsmodels variance_inflation_factor |
| Influential points | Cook's distance | statsmodels OLSInfluence |

### Python Code Templates

\`\`\`python
import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
from statsmodels.stats.stattools import durbin_watson
from statsmodels.stats.outliers_influence import variance_inflation_factor, OLSInfluence

def full_regression_diagnostics(X, y):
    X_const = sm.add_constant(X)
    model = sm.OLS(y, X_const).fit()
    residuals = model.resid
    fitted = model.fittedvalues

    print(model.summary())

    # Normality
    from scipy.stats import shapiro, jarque_bera
    _, sw_p = shapiro(residuals)
    _, jb_p, _, _ = jarque_bera(residuals)
    print(f"\\nNormality: Shapiro p={sw_p:.4f}, Jarque-Bera p={jb_p:.4f}")

    # Heteroscedasticity
    _, bp_p, _, _ = het_breuschpagan(residuals, X_const)
    print(f"Breusch-Pagan p={bp_p:.4f} ({'Heteroscedastic' if bp_p < 0.05 else 'Homoscedastic'})")

    # Autocorrelation
    dw = durbin_watson(residuals)
    print(f"Durbin-Watson: {dw:.4f} (close to 2 = no autocorrelation)")

    # VIF
    print("\\nVIF:")
    for i, col in enumerate(X.columns if hasattr(X, 'columns') else range(X.shape[1])):
        vif = variance_inflation_factor(X_const.values, i + 1)
        flag = " *** HIGH" if vif > 10 else " * moderate" if vif > 5 else ""
        print(f"  {col}: {vif:.2f}{flag}")

    # Influential points (Cook's distance)
    influence = OLSInfluence(model)
    cooks_d = influence.cooks_distance[0]
    threshold = 4 / len(y)
    influential = np.where(cooks_d > threshold)[0]
    print(f"\\nInfluential points (Cook's d > {threshold:.4f}): {len(influential)} observations")

    return model
\`\`\`

### Common Pitfalls

1. **Ignoring heteroscedasticity**: Use robust standard errors (HC3) if Breusch-Pagan rejects
2. **VIF > 10 doesn't mean drop the variable**: Consider centering, combining, or domain reasoning
3. **Normality is least important**: With n > 30, CLT makes inference approximately valid
4. **Outlier ≠ influential**: An outlier only matters if it has high leverage AND changes coefficients
5. **R² doesn't validate a model**: High R² with violated assumptions gives misleading inference
`,
  followUps: [
    "Run full regression diagnostics on this model",
    "Check for multicollinearity in my predictors",
    "Test for heteroscedasticity and suggest fixes",
    "Identify influential observations using Cook's distance",
    "Plot residual diagnostics",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels", "matplotlib"],
};
