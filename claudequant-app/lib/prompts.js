// ─── Auto-send prompts for task cards ────────────────────────────────────────
// These are sent automatically when the user clicks a scenario card.
// They prime Claude to ask familiarity questions first, then give a
// calibrated initial assessment of the dataset.
export const PROMPTS = {
  experiment: `I just loaded data from an A/B test we ran on our signup flow. I'd like your help figuring out whether the result is real or if something might be off with the data.

Before you dive in, ask me a couple of quick questions to calibrate — especially about my familiarity with statistics and what I'm hoping to learn. Then give me your initial assessment of the dataset: what stands out, whether the sample size is sufficient for meaningful conclusions, any red flags I should know about, and what the right first steps would be.`,

  design: `I just loaded data from a pilot study we ran for a workplace wellness program. I want to understand whether the intervention actually worked or if we're seeing something misleading.

Before you start analyzing, ask me a couple of quick questions so you can calibrate your explanation to my level — especially my comfort with statistics and causal inference. Then walk me through your initial read of the data: what looks promising, what looks concerning, whether the sample and study design are strong enough to draw conclusions, and what we should investigate further.`,

  explore: `I just loaded our product retention data and something seems off — the numbers have been trending in the wrong direction and leadership is concerned. I need to figure out what's actually driving the decline.

Before you start, ask me a couple of quick questions to understand my background and what I'm looking for. Then give me your initial take on the data: what patterns you see, whether the sample gives us enough to work with, any obvious hypotheses worth testing, and where you'd dig first.`,
};
