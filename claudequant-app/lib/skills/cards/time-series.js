export const TIME_SERIES_SKILL = {
  id: "time-series",
  name: "Time Series Analysis & Forecasting",
  triggers: {
    keywords: [
      "time series", "arima", "forecast", "seasonal", "trend",
      "stationarity", "autocorrelation", "decomposition",
      "exponential smoothing", "moving average", "adf test",
      "kpss test", "sarima", "seasonality",
    ],
    patterns: [
      /time\s*series/i, /\barima\b/i, /\bsarima\b/i,
      /forecast(ing)?\b/i, /seasonal\s*(decompos|adjust|pattern)/i,
      /stationar(y|ity)/i, /auto\s*correlat/i,
      /exponential\s*smooth/i, /\badf\s*test/i, /\bkpss\s*test/i,
      /trend\s*(analys|decompos|detect)/i,
    ],
  },
  promptCard: `## Skill: Time Series Analysis & Forecasting

### Decision Framework

\`\`\`
Pattern type?
├── Trend + seasonality → SARIMA or Holt-Winters
├── Trend only → ARIMA(p,1,q) or Holt's linear
├── Seasonality only → Seasonal ARIMA
├── No clear pattern → Check stationarity → ARMA/ARIMA
└── Multiple seasonal patterns → Prophet, TBATS, or Fourier terms

Stationarity (run both):
├── ADF (null: non-stationary) + KPSS (null: stationary)
├── Both agree stationary → d=0
├── Both agree non-stationary → d=1
├── ADF rejects, KPSS rejects → Trend-stationary (detrend)
└── Neither rejects → Need more data

ACF/PACF:
├── ACF decays, PACF cuts at p → AR(p)
├── ACF cuts at q, PACF decays → MA(q)
├── Both decay → ARMA(p,q)
└── Slow linear ACF decay → Non-stationary
\`\`\`

### Protocol

1. Visual inspection + stationarity tests (ADF + KPSS)
2. Decomposition (STL preferred): measure trend/seasonal strength
3. Model selection: ACF/PACF or grid search by AIC
4. Forecast with prediction intervals. Evaluate: MAE, RMSE, MAPE
5. Residual check: Ljung-Box (must be white noise)

### Smoothing vs ARIMA

| Criterion | ETS | ARIMA |
|-----------|-----|-------|
| External regressors | No | Yes |
| Short series (<50) | Better | Worse |
| Interpretability | High | Medium |

### Pitfalls

1. **Over-differencing**: Test stationarity BEFORE differencing
2. **Missing seasonal differencing**: Monthly+yearly → D=1, period=12
3. **Shuffling**: NEVER shuffle time series data
4. **Forecast horizon**: Reliable ~1 seasonal cycle. Beyond = meaningless CIs
5. **Unchecked residuals**: Must be white noise
6. **Log(0)**: Use log(1+x) or Box-Cox with offset
`,
  followUps: [
    "Test this series for stationarity",
    "Decompose into trend, seasonality, residual",
    "Find best ARIMA model",
    "Forecast with confidence intervals",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "statsmodels", "matplotlib"],
};
