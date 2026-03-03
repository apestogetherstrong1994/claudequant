export const PORTFOLIO_OPTIMIZATION_SKILL = {
  id: "portfolio-optimization",
  name: "Portfolio Optimization",
  triggers: {
    keywords: [
      "portfolio",
      "optimization",
      "sharpe",
      "efficient frontier",
      "markowitz",
      "risk parity",
      "allocation",
      "diversification",
      "mean-variance",
      "rebalance",
      "max drawdown",
      "risk-adjusted",
    ],
    patterns: [
      /portfolio\s*(optim|alloc|construct|rebalanc)/i,
      /efficient\s*frontier/i,
      /sharpe\s*ratio/i,
      /markowitz/i,
      /risk\s*parity/i,
      /mean[\s-]*variance/i,
      /max(imum)?\s*drawdown/i,
      /asset\s*allocation/i,
      /modern\s*portfolio\s*theory/i,
    ],
  },
  promptCard: `## Skill: Portfolio Optimization

### Decision Framework: Choosing an Optimization Method

\`\`\`
What is your objective?
├── Maximize risk-adjusted return (Sharpe ratio)
│   └── Mean-Variance Optimization (MVO) — max Sharpe
├── Target a specific return with minimum risk
│   └── MVO — min variance for target return
├── Equal risk contribution from all assets
│   └── Risk Parity
├── Maximize diversification
│   └── Maximum Diversification Portfolio or HRP
├── Minimize tail risk
│   └── CVaR (Conditional Value at Risk) optimization
└── Simple, robust allocation
    └── Equal-weight or Inverse-volatility weighting

What are the constraints?
├── Long-only (no shorting) → Add w ≥ 0 constraint
├── Max position size → Add w ≤ max_weight constraint
├── Sector limits → Group constraints
├── Turnover limits → Transaction cost penalty
└── Cardinality (max N assets) → Mixed-integer programming
\`\`\`

### Step-by-Step Protocol

#### 1. Data Preparation and Return Estimation

\`\`\`python
import numpy as np
import pandas as pd
from scipy.optimize import minimize

def prepare_portfolio_data(prices_df):
    """
    Prepare return statistics from price data.

    Parameters
    ----------
    prices_df : pd.DataFrame
        DataFrame with DatetimeIndex, columns = asset tickers, values = prices.

    Returns
    -------
    dict with returns, expected_returns, cov_matrix
    """
    # Log returns (more appropriate for portfolio math)
    log_returns = np.log(prices_df / prices_df.shift(1)).dropna()

    # Simple returns (for reporting)
    simple_returns = prices_df.pct_change().dropna()

    # Annualized expected returns (assuming daily data, 252 trading days)
    trading_days = 252
    mu = log_returns.mean() * trading_days

    # Annualized covariance matrix
    cov = log_returns.cov() * trading_days

    # Correlation matrix
    corr = log_returns.corr()

    print(f"Assets: {list(prices_df.columns)}")
    print(f"Period: {prices_df.index[0]} to {prices_df.index[-1]}")
    print(f"\\nAnnualized Expected Returns:")
    for asset, ret in mu.items():
        print(f"  {asset}: {ret:.2%}")
    print(f"\\nCorrelation Matrix:")
    print(corr.round(3))

    return {
        'log_returns': log_returns,
        'simple_returns': simple_returns,
        'mu': mu.values,
        'cov': cov.values,
        'assets': list(prices_df.columns),
        'corr': corr
    }
\`\`\`

#### 2. Mean-Variance Optimization (Markowitz)

**Key Formulas:**
- Portfolio return: E[Rp] = w'μ
- Portfolio variance: σ²p = w'Σw
- Sharpe ratio: SR = (E[Rp] - Rf) / σp

\`\`\`python
def portfolio_stats(weights, mu, cov, rf=0.0):
    """Calculate portfolio return, volatility, and Sharpe ratio."""
    ret = weights @ mu
    vol = np.sqrt(weights @ cov @ weights)
    sharpe = (ret - rf) / vol if vol > 0 else 0
    return ret, vol, sharpe

def max_sharpe_portfolio(mu, cov, rf=0.0, long_only=True, max_weight=1.0):
    """
    Find the maximum Sharpe ratio portfolio.

    Parameters
    ----------
    mu : array of expected returns
    cov : covariance matrix
    rf : risk-free rate (annualized)
    long_only : if True, no short selling
    max_weight : maximum weight per asset
    """
    n = len(mu)

    def neg_sharpe(w):
        ret, vol, sharpe = portfolio_stats(w, mu, cov, rf)
        return -sharpe

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]

    if long_only:
        bounds = [(0.0, max_weight)] * n
    else:
        bounds = [(-max_weight, max_weight)] * n

    # Multiple random starting points to avoid local optima
    best_result = None
    best_sharpe = -np.inf

    for _ in range(100):
        w0 = np.random.dirichlet(np.ones(n))
        result = minimize(neg_sharpe, w0, method='SLSQP',
                         bounds=bounds, constraints=constraints)
        if result.success and -result.fun > best_sharpe:
            best_sharpe = -result.fun
            best_result = result

    weights = best_result.x
    ret, vol, sharpe = portfolio_stats(weights, mu, cov, rf)

    print(f"=== Maximum Sharpe Portfolio ===")
    print(f"Expected Return: {ret:.2%}")
    print(f"Volatility:      {vol:.2%}")
    print(f"Sharpe Ratio:    {sharpe:.4f}")
    print(f"\\nWeights:")
    for i, w in enumerate(weights):
        if abs(w) > 0.001:
            print(f"  Asset {i}: {w:.4f} ({w:.1%})")

    return weights

def min_variance_portfolio(cov, long_only=True, max_weight=1.0):
    """Find the global minimum variance portfolio."""
    n = cov.shape[0]

    def portfolio_vol(w):
        return np.sqrt(w @ cov @ w)

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    bounds = [(0.0, max_weight)] * n if long_only else [(-max_weight, max_weight)] * n

    w0 = np.ones(n) / n
    result = minimize(portfolio_vol, w0, method='SLSQP',
                     bounds=bounds, constraints=constraints)

    return result.x
\`\`\`

#### 3. Efficient Frontier

\`\`\`python
def compute_efficient_frontier(mu, cov, rf=0.0, n_points=50,
                                long_only=True, max_weight=1.0):
    """
    Compute the efficient frontier by finding minimum variance
    portfolios for a range of target returns.
    """
    n = len(mu)

    # Find min and max achievable returns
    w_min_var = min_variance_portfolio(cov, long_only, max_weight)
    min_ret = w_min_var @ mu
    max_ret = np.max(mu) if long_only else np.sum(np.abs(mu)) * max_weight

    target_returns = np.linspace(min_ret, max_ret * 0.95, n_points)
    frontier_vol = []
    frontier_ret = []
    frontier_weights = []

    for target in target_returns:
        def portfolio_vol(w):
            return np.sqrt(w @ cov @ w)

        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0},
            {'type': 'eq', 'fun': lambda w, t=target: w @ mu - t}
        ]
        bounds = [(0.0, max_weight)] * n if long_only else [(-max_weight, max_weight)] * n

        w0 = np.ones(n) / n
        result = minimize(portfolio_vol, w0, method='SLSQP',
                         bounds=bounds, constraints=constraints)

        if result.success:
            frontier_vol.append(np.sqrt(result.x @ cov @ result.x))
            frontier_ret.append(result.x @ mu)
            frontier_weights.append(result.x)

    return np.array(frontier_ret), np.array(frontier_vol), np.array(frontier_weights)
\`\`\`

#### 4. Risk Parity

\`\`\`python
def risk_parity_portfolio(cov, risk_budget=None):
    """
    Risk Parity: each asset contributes equally to portfolio risk.

    Risk contribution of asset i: RC_i = w_i × (Σw)_i / σ_p
    Risk parity: RC_i = RC_j for all i, j

    Parameters
    ----------
    cov : covariance matrix
    risk_budget : target risk contribution per asset (default: equal)
    """
    n = cov.shape[0]
    if risk_budget is None:
        risk_budget = np.ones(n) / n

    def risk_parity_objective(w):
        vol = np.sqrt(w @ cov @ w)
        marginal_risk = cov @ w
        risk_contrib = w * marginal_risk / vol
        # Minimize deviation from target risk budget
        target_risk = vol * risk_budget
        return np.sum((risk_contrib - target_risk) ** 2)

    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}]
    bounds = [(0.01, None)] * n  # Positive weights

    w0 = np.ones(n) / n
    result = minimize(risk_parity_objective, w0, method='SLSQP',
                     bounds=bounds, constraints=constraints)

    weights = result.x
    vol = np.sqrt(weights @ cov @ weights)
    marginal_risk = cov @ weights
    risk_contrib = weights * marginal_risk / vol

    print("=== Risk Parity Portfolio ===")
    print(f"Portfolio Volatility: {vol:.2%}")
    print(f"\\n{'Asset':<8} {'Weight':>8} {'Risk Contrib':>14} {'% of Risk':>10}")
    for i in range(n):
        print(f"  {i:<6} {weights[i]:>8.4f} {risk_contrib[i]:>14.4f} {risk_contrib[i]/vol:>10.1%}")

    return weights
\`\`\`

#### 5. Portfolio Risk Metrics

\`\`\`python
def portfolio_risk_metrics(returns_series, rf_annual=0.0):
    """
    Comprehensive risk metrics for a portfolio return series.

    Parameters
    ----------
    returns_series : pd.Series of portfolio returns (daily)
    rf_annual : annual risk-free rate
    """
    rf_daily = (1 + rf_annual) ** (1/252) - 1
    excess = returns_series - rf_daily

    # Basic stats
    ann_return = returns_series.mean() * 252
    ann_vol = returns_series.std() * np.sqrt(252)
    sharpe = excess.mean() / excess.std() * np.sqrt(252) if excess.std() > 0 else 0

    # Sortino ratio (downside deviation only)
    downside = excess[excess < 0]
    downside_std = np.sqrt(np.mean(downside**2)) * np.sqrt(252)
    sortino = (ann_return - rf_annual) / downside_std if downside_std > 0 else 0

    # Maximum drawdown
    cumulative = (1 + returns_series).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    max_dd = drawdown.min()

    # Calmar ratio
    calmar = ann_return / abs(max_dd) if max_dd != 0 else 0

    # Value at Risk and CVaR (historical, 95%)
    var_95 = np.percentile(returns_series, 5)
    cvar_95 = returns_series[returns_series <= var_95].mean()

    print(f"=== Portfolio Risk Metrics ===")
    print(f"Annualized Return:    {ann_return:>10.2%}")
    print(f"Annualized Volatility:{ann_vol:>10.2%}")
    print(f"Sharpe Ratio:         {sharpe:>10.4f}")
    print(f"Sortino Ratio:        {sortino:>10.4f}")
    print(f"Max Drawdown:         {max_dd:>10.2%}")
    print(f"Calmar Ratio:         {calmar:>10.4f}")
    print(f"VaR (95%, daily):     {var_95:>10.4f}")
    print(f"CVaR (95%, daily):    {cvar_95:>10.4f}")

    return {
        'ann_return': ann_return, 'ann_vol': ann_vol,
        'sharpe': sharpe, 'sortino': sortino,
        'max_drawdown': max_dd, 'calmar': calmar,
        'var_95': var_95, 'cvar_95': cvar_95
    }
\`\`\`

### Common Pitfalls

1. **Estimation error amplification**: MVO is notoriously sensitive to expected return estimates. A small change in μ can flip allocations entirely. Consider:
   - Shrinkage estimators (Ledoit-Wolf for covariance)
   - Black-Litterman for expected returns
   - Resampled efficient frontier (Michaud)

2. **In-sample overfitting**: Optimized weights look great in backtests but fail out-of-sample. Always use rolling/expanding window backtest.

3. **Ignoring transaction costs**: Frequent rebalancing destroys returns through commissions and bid-ask spreads. Add turnover constraints.

4. **Concentration risk**: Unconstrained MVO often puts 80%+ in 1-2 assets. Always add max weight constraints (e.g., 25% per asset).

5. **Using short lookback periods**: Covariance estimated from 6 months of daily data is extremely noisy. Use at least 2-3 years, or exponentially-weighted covariance.

6. **Confusing correlation with diversification**: Two assets with 0.3 correlation still crash together in a crisis. Consider tail correlation separately.

7. **Not accounting for regime changes**: Correlations increase during market stress. Consider stress-testing with crisis-period covariance matrices.

8. **Ignoring the risk-free asset**: The tangency portfolio (max Sharpe) should be combined with the risk-free asset to reach any target return on the Capital Market Line.

### Quick Reference

| Method | Objective | Best For |
|--------|-----------|----------|
| Max Sharpe | Maximize return/risk | Active allocation |
| Min Variance | Minimize volatility | Conservative investors |
| Risk Parity | Equal risk contribution | Balanced exposure |
| Equal Weight | 1/N allocation | When estimation error is high |
| Inverse Vol | Weight by 1/σ | Simple risk-based approach |
| Black-Litterman | Blend views with equilibrium | Incorporating active views |
`,
  followUps: [
    "Optimize this portfolio for maximum Sharpe ratio",
    "Plot the efficient frontier for these assets",
    "Calculate risk parity weights for my portfolio",
    "Compute drawdown and risk metrics for this portfolio",
    "Backtest this allocation strategy over the past 5 years",
    "Apply Black-Litterman with my market views",
  ],
  pythonDeps: ["scipy", "numpy", "pandas", "matplotlib"],
};
