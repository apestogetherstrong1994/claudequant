// ─── Pre-written prompts for task cards ──────────────────────────────────────
export const PROMPTS = {
  trade: `Help me build and analyze a quantitative trading strategy for [US equities / ETFs / crypto / prediction markets / a specific sector or ticker]. I want to move beyond intuition and use data to find edges in the market.

First, ask me:
- What I'm trying to achieve (generate alpha, hedge a position, build a passive portfolio, backtest an idea I already have, or explore from scratch)
- My time horizon (intraday, swing trading, weeks/months, or long-term investing)
- Whether I have my own data to upload or want you to pull live market data
- My experience level with quantitative finance (so you can calibrate how much to explain)

Then, depending on my answers, start by either:
- Fetching recent price data for the tickers I'm interested in and running an initial statistical profile (returns distribution, volatility, correlations, momentum signals)
- Analyzing the CSV I upload with the same rigor

When backtesting any strategy, always show me: cumulative returns vs. benchmark, Sharpe ratio, max drawdown, win rate, and number of trades. Flag any signs of overfitting or lookahead bias. If the strategy looks too good, tell me why I should be skeptical.

If I don't have a specific idea yet, suggest 2-3 well-known quantitative strategies (e.g., momentum, mean reversion, pairs trading) and help me evaluate which might work for my situation.`,

  experiment: `Help me rigorously analyze experimental data from [a research study / clinical trial / A/B test / lab experiment / field study / survey]. I have results and I want to know what they actually mean — statistically and practically.

First, ask me:
- What hypothesis I was testing (or whether this is exploratory)
- The experimental design (randomized, paired, repeated measures, factorial, observational, etc.)
- What my outcome variable(s) and predictor variable(s) are
- Whether I have my data ready to upload or need help structuring it
- My comfort level with statistics (so you know whether to explain concepts like p-values and effect sizes or skip to the results)

Then start with a data quality check:
- Sample size per group
- Missing data (how much, any patterns)
- Distribution of key variables (normality, outliers, skew)
- Whether the groups were balanced at baseline

Choose statistical tests that match my design — don't default to a t-test if the data calls for something else. Explain *why* you chose each test in one sentence. Always report effect sizes alongside p-values, and tell me whether the result is practically meaningful, not just statistically significant.

If I ran multiple comparisons, flag it and apply appropriate corrections. If my sample is small, use exact or nonparametric methods and be honest about what the data can and can't tell us.

End with a plain-language summary I could put in a paper or present to a non-technical stakeholder.`,

  design: `Help me design a rigorous experiment to test [a product hypothesis / a scientific theory / a business decision / a treatment effect / a policy intervention / specify]. I have an idea about what might be true and I want to design a study that will actually give me a clear answer.

First, ask me:
- What my hypothesis is, in plain language (you'll help me sharpen it into something testable)
- The domain (product/tech, biomedical, social science, business, physical science, or other)
- What constraints I'm working with (budget, timeline, sample availability, ethical considerations)
- Whether I need to convince a specific audience with the results (investors, a journal, an IRB, a leadership team)
- My comfort level with experimental design and statistics (so you know how much to explain along the way)

Then help me build the experiment step by step:
1. Sharpen the hypothesis into a precise, falsifiable statement with a clearly defined primary outcome
2. Recommend an experimental design (RCT, quasi-experiment, factorial, crossover, etc.) and explain why it fits my situation
3. Identify the key confounders and how we'll control for them
4. Run a power analysis to determine the sample size I'll need — show me how the required n changes under different assumptions about effect size
5. Lay out the analysis plan I should pre-commit to before collecting any data

Be honest if my hypothesis is vague, my sample is too small, or my design has fatal flaws. I'd rather fix it now than after I've collected the data. If a full experiment isn't feasible, suggest a lighter-weight alternative (pilot study, natural experiment, observational analysis with appropriate caveats).`,

  weather: `Help me analyze and forecast weather patterns for [a specific city / region / event date / agricultural season / travel dates / specify]. I want to go beyond checking a weather app and actually understand what the data says about what's coming.

First, ask me:
- What I'm trying to plan for (outdoor event, travel, agricultural decisions, energy forecasting, pure curiosity, or something else)
- The location(s) and time horizon I care about (next 48 hours, next week, seasonal outlook, or historical patterns)
- Whether I have my own weather data to upload or want you to pull historical and forecast data
- How precise I need the answer to be (a general sense vs. specific probability thresholds, e.g., "less than 20% chance of rain")
- My comfort level with data science and statistics (so you know whether to walk through the methodology or just give me the results)

Then, depending on what I need:
- For short-term forecasts: pull recent weather data, show me the trend, and give me a probabilistic forecast with confidence intervals — not just "it will be 72°F" but "70-75°F with 85% confidence, with a 30% chance of afternoon precipitation"
- For historical analysis: fetch past data for my location and help me find seasonal patterns, anomalies, or long-term trends (e.g., "Is it actually raining more in October than it used to?")
- For event planning: combine historical base rates with recent trends to give me a data-driven risk assessment for my specific date and location

If a relevant prediction market exists (e.g., "hottest month on record," "hurricane landfall"), pull that data too and show me how crowd-sourced probabilities compare with the statistical model.

Be honest about the limits of weather forecasting — accuracy drops fast beyond 7-10 days. If I'm asking about something too far out, tell me what we *can* say and what's just noise.`,
};
