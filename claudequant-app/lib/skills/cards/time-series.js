export const TIME_SERIES_SKILL = {
  id: "time-series",
  name: "Time Series Analysis & Forecasting",
  triggers: {
    keywords: [
      "time series",
      "arima",
      "forecast",
      "seasonal",
      "trend",
      "stationarity",
      "autocorrelation",
      "decomposition",
      "exponential smoothing",
      "moving average",
      "adf test",
      "kpss test",
      "sarima",
      "seasonality",
    ],
    patterns: [
      /time\s*series/i,
      /\barima\b/i,
      /\bsarima\b/i,
      /forecast(ing)?\b/i,
      /seasonal\s*(decompos|adjust|pattern)/i,
      /stationar(y|ity)/i,
      /auto\s*correlat/i,
      /exponential\s*smooth/i,
      /\badf\s*test/i,
      /\bkpss\s*test/i,
      /trend\s*(analys|decompos|detect)/i,
    ],
  },
  promptCard: `## Skill: Time Series Analysis & Forecasting

### Decision Framework: Model Selection

\`\`\`
What type of time series pattern do you see?
├── Clear trend + seasonality
│   ├── Multiplicative seasonality → SARIMA or Holt-Winters (multiplicative)
│   └── Additive seasonality → SARIMA or Holt-Winters (additive)
├── Trend only (no seasonality)
│   ├── Linear trend → ARIMA(p,1,q) or Holt's linear
│   └── Nonlinear trend → Consider differencing or transformation
├── Seasonality only (no trend)
│   └── Seasonal ARIMA or seasonal decomposition
├── No clear pattern (noisy)
│   └── Check stationarity → ARMA if stationary, ARIMA if not
└── Multiple seasonal patterns (e.g., daily + weekly)
    └── Prophet, TBATS, or Fourier terms in regression

Is the series stationary?
├── Run ADF test (null: unit root exists, i.e., non-stationary)
│   ├── p < 0.05 → Stationary (d=0)
│   └── p ≥ 0.05 → Non-stationary, difference and re-test
├── Run KPSS test (null: stationary)
│   ├── p > 0.05 → Stationary
│   └── p ≤ 0.05 → Non-stationary
└── Cross-check both:
    ├── ADF rejects, KPSS doesn't reject → Stationary
    ├── ADF doesn't reject, KPSS rejects → Non-stationary (difference)
    ├── Both reject → Trend-stationary (detrend, don't difference)
    └── Neither rejects → Low power, collect more data
\`\`\`

### Step-by-Step Protocol

#### 1. Visual Inspection and Stationarity Tests

\`\`\`python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

def stationarity_report(series, name="Series"):
    """
    Run ADF and KPSS tests, report results.
    """
    # ADF test
    adf_result = adfuller(series.dropna(), autolag='AIC')
    adf_pval = adf_result[1]

    # KPSS test
    kpss_result = kpss(series.dropna(), regression='c', nlags='auto')
    kpss_pval = kpss_result[1]

    print(f"=== Stationarity Report: {name} ===")
    print(f"ADF test:  statistic={adf_result[0]:.4f}, p-value={adf_pval:.4f}")
    print(f"  → {'Stationary' if adf_pval < 0.05 else 'Non-stationary (unit root)'}")
    print(f"KPSS test: statistic={kpss_result[0]:.4f}, p-value={kpss_pval:.4f}")
    print(f"  → {'Stationary' if kpss_pval > 0.05 else 'Non-stationary (trend)'}")

    if adf_pval < 0.05 and kpss_pval > 0.05:
        print("Conclusion: STATIONARY — no differencing needed (d=0)")
    elif adf_pval >= 0.05 and kpss_pval <= 0.05:
        print("Conclusion: NON-STATIONARY — apply differencing (d=1)")
    elif adf_pval < 0.05 and kpss_pval <= 0.05:
        print("Conclusion: TREND-STATIONARY — detrend instead of differencing")
    else:
        print("Conclusion: AMBIGUOUS — tests disagree, consider more data")

    return {'adf_pval': adf_pval, 'kpss_pval': kpss_pval}

def plot_diagnostics(series, lags=40):
    """Plot series, ACF, and PACF."""
    fig, axes = plt.subplots(3, 1, figsize=(12, 8))
    series.plot(ax=axes[0], title='Time Series')
    plot_acf(series.dropna(), lags=lags, ax=axes[1])
    plot_pacf(series.dropna(), lags=lags, ax=axes[2], method='ywm')
    plt.tight_layout()
    plt.show()
\`\`\`

#### 2. Decomposition

\`\`\`python
from statsmodels.tsa.seasonal import seasonal_decompose, STL

def decompose_series(series, period, method='stl'):
    """
    Decompose time series into trend, seasonal, and residual components.

    Parameters
    ----------
    series : pd.Series with DatetimeIndex
    period : int (e.g., 12 for monthly, 7 for daily with weekly pattern)
    method : 'stl' (robust, preferred) or 'classical'
    """
    if method == 'stl':
        # STL: Robust to outliers, handles any type of seasonality
        result = STL(series, period=period, robust=True).fit()
    else:
        # Classical: simpler but less robust
        result = seasonal_decompose(series, period=period, model='additive')

    fig, axes = plt.subplots(4, 1, figsize=(12, 10))
    result.observed.plot(ax=axes[0], title='Observed')
    result.trend.plot(ax=axes[1], title='Trend')
    result.seasonal.plot(ax=axes[2], title='Seasonal')
    result.resid.plot(ax=axes[3], title='Residual')
    plt.tight_layout()
    plt.show()

    # Strength of trend and seasonality
    var_resid = np.var(result.resid.dropna())
    trend_strength = max(0, 1 - var_resid / np.var(result.trend.dropna() + result.resid.dropna()))
    seasonal_strength = max(0, 1 - var_resid / np.var(result.seasonal.dropna() + result.resid.dropna()))

    print(f"Trend strength:    {trend_strength:.3f} (>0.6 = strong trend)")
    print(f"Seasonal strength: {seasonal_strength:.3f} (>0.6 = strong seasonality)")

    return result
\`\`\`

#### 3. ARIMA Model Selection

**ACF/PACF Interpretation Guide:**

| ACF Pattern | PACF Pattern | Suggested Model |
|-------------|--------------|-----------------|
| Tails off (decays) | Cuts off at lag p | AR(p) |
| Cuts off at lag q | Tails off (decays) | MA(q) |
| Tails off | Tails off | ARMA(p,q) |
| Slow linear decay | — | Non-stationary, difference first |

\`\`\`python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import itertools
import warnings

def auto_arima_search(series, seasonal_period=None, max_order=3):
    """
    Grid search for best ARIMA/SARIMA model by AIC.

    For large datasets, use pmdarima.auto_arima instead.
    """
    best_aic = np.inf
    best_order = None
    best_seasonal = None
    results = []

    p_range = range(0, max_order + 1)
    d_range = range(0, 2)
    q_range = range(0, max_order + 1)

    if seasonal_period:
        P_range = range(0, 2)
        D_range = range(0, 2)
        Q_range = range(0, 2)
        seasonal_orders = list(itertools.product(P_range, D_range, Q_range))
    else:
        seasonal_orders = [(0, 0, 0)]

    for p, d, q in itertools.product(p_range, d_range, q_range):
        for P, D, Q in seasonal_orders:
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    if seasonal_period and (P + D + Q) > 0:
                        model = SARIMAX(series, order=(p, d, q),
                                       seasonal_order=(P, D, Q, seasonal_period),
                                       enforce_stationarity=False,
                                       enforce_invertibility=False)
                    else:
                        model = ARIMA(series, order=(p, d, q))
                    fit = model.fit(disp=False)
                    results.append({
                        'order': (p, d, q),
                        'seasonal': (P, D, Q, seasonal_period) if seasonal_period else None,
                        'aic': fit.aic,
                        'bic': fit.bic
                    })
                    if fit.aic < best_aic:
                        best_aic = fit.aic
                        best_order = (p, d, q)
                        best_seasonal = (P, D, Q, seasonal_period) if seasonal_period else None
            except:
                continue

    results_df = pd.DataFrame(results).sort_values('aic').head(10)
    print(f"Best model: ARIMA{best_order}", end="")
    if best_seasonal:
        print(f" x {best_seasonal}", end="")
    print(f" (AIC={best_aic:.2f})")
    print("\\nTop 10 models:")
    print(results_df.to_string(index=False))

    return best_order, best_seasonal
\`\`\`

#### 4. Forecasting and Evaluation

\`\`\`python
from sklearn.metrics import mean_absolute_error, mean_squared_error

def forecast_and_evaluate(series, order, seasonal_order=None,
                          test_size=0.2, forecast_horizon=12):
    """
    Fit ARIMA/SARIMA, evaluate on holdout, and produce forecast.
    """
    # Train/test split (time series: always use the last portion as test)
    split_idx = int(len(series) * (1 - test_size))
    train, test = series[:split_idx], series[split_idx:]

    # Fit model
    if seasonal_order:
        model = SARIMAX(train, order=order, seasonal_order=seasonal_order,
                       enforce_stationarity=False, enforce_invertibility=False)
    else:
        model = ARIMA(train, order=order)

    fit = model.fit(disp=False)

    # In-sample diagnostics
    print("=== Model Diagnostics ===")
    print(f"AIC: {fit.aic:.2f}, BIC: {fit.bic:.2f}")

    # Ljung-Box test on residuals (should NOT be significant)
    from statsmodels.stats.diagnostic import acorr_ljungbox
    lb_test = acorr_ljungbox(fit.resid.dropna(), lags=[10, 20], return_df=True)
    print(f"\\nLjung-Box test (residual autocorrelation):")
    print(lb_test)

    # Out-of-sample evaluation
    forecast_test = fit.forecast(steps=len(test))
    mae = mean_absolute_error(test, forecast_test)
    rmse = np.sqrt(mean_squared_error(test, forecast_test))
    mape = np.mean(np.abs((test - forecast_test) / test)) * 100

    print(f"\\n=== Out-of-Sample Performance ===")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAPE: {mape:.2f}%")

    # Refit on full data and forecast
    if seasonal_order:
        full_model = SARIMAX(series, order=order, seasonal_order=seasonal_order,
                            enforce_stationarity=False, enforce_invertibility=False)
    else:
        full_model = ARIMA(series, order=order)

    full_fit = full_model.fit(disp=False)
    forecast = full_fit.get_forecast(steps=forecast_horizon)
    forecast_df = forecast.summary_frame(alpha=0.05)

    return forecast_df, {'mae': mae, 'rmse': rmse, 'mape': mape}
\`\`\`

#### 5. Exponential Smoothing (ETS)

\`\`\`python
from statsmodels.tsa.holtwinters import ExponentialSmoothing

def fit_ets(series, seasonal_period=None, trend='add', seasonal='add'):
    """
    Fit Exponential Smoothing (Holt-Winters) model.

    trend    : 'add', 'mul', or None
    seasonal : 'add', 'mul', or None

    Guidelines:
    - Multiplicative seasonal: seasonal amplitude grows with level
    - Additive seasonal: seasonal amplitude is constant
    - Multiplicative trend: exponential growth (rare, use with caution)
    """
    model = ExponentialSmoothing(
        series,
        trend=trend,
        seasonal=seasonal,
        seasonal_periods=seasonal_period,
        damped_trend=True  # damped trend prevents explosive forecasts
    )
    fit = model.fit(optimized=True)

    print(f"Smoothing parameters:")
    print(f"  alpha (level):    {fit.params['smoothing_level']:.4f}")
    print(f"  beta  (trend):    {fit.params.get('smoothing_trend', 'N/A')}")
    print(f"  gamma (seasonal): {fit.params.get('smoothing_seasonal', 'N/A')}")
    print(f"  phi   (damping):  {fit.params.get('damping_trend', 'N/A')}")
    print(f"AIC: {fit.aic:.2f}")

    return fit
\`\`\`

### Common Pitfalls

1. **Over-differencing**: If you difference a stationary series, you introduce artificial autocorrelation. Always test stationarity BEFORE differencing.

2. **Ignoring seasonal differencing**: For monthly data with yearly pattern, you need seasonal differencing (D=1) at period=12, not just regular differencing.

3. **Using train/test split wrong**: NEVER shuffle time series data. Always use the most recent data as the test set. Use expanding or sliding window cross-validation.

4. **Forecasting too far ahead**: Forecast accuracy degrades exponentially. ARIMA is reliable for ~1 seasonal cycle ahead. Beyond that, confidence intervals become meaningless.

5. **Confusing correlation with stationarity**: A series can have high autocorrelation and still be stationary. Stationarity means the statistical properties don't change over time.

6. **Not checking residuals**: After fitting, residuals should be white noise (no autocorrelation, constant variance). If they're not, your model is missing structure.

7. **Applying log transform to data with zeros**: log(0) is undefined. Use log(1+x) or Box-Cox with offset.

8. **Multiplicative decomposition with negative values**: Multiplicative models require strictly positive values. Use additive decomposition instead.

### Quick Reference: Choosing Smoothing vs. ARIMA

| Criterion | Exponential Smoothing | ARIMA |
|-----------|----------------------|-------|
| Interpretability | High (level, trend, season) | Medium (AR/MA terms) |
| Multiple seasonality | Limited | Use SARIMAX + Fourier |
| External regressors | No | Yes (ARIMAX/SARIMAX) |
| Automatic selection | Limited | auto_arima / grid search |
| Short series (<50 pts) | Better | Worse (needs more data) |
| Point forecasts | Similar accuracy | Similar accuracy |
| Prediction intervals | Analytical | Analytical |
`,
  followUps: [
    "Test this time series for stationarity",
    "Decompose this series into trend, seasonality, and residual",
    "Find the best ARIMA model for this data",
    "Forecast the next N periods with confidence intervals",
    "Compare ARIMA vs exponential smoothing for this data",
    "Detect structural breaks or changepoints",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels", "matplotlib", "scikit-learn"],
};
