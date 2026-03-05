// ─── Pre-written prompts for task cards ──────────────────────────────────────
export const PROMPTS = {
  experiment: `I just ran an A/B test on our signup flow and I have the results. Help me figure out whether the winning variant is actually better — or if the data is misleading me.

Start by asking me a few calibration questions about what I'm looking for, then analyze the data I've uploaded. Pay special attention to potential confounders and whether the result holds across segments.`,

  design: `I ran a pilot study for a workplace intervention and I want to understand if the results are real. The data looks promising on the surface, but I'm worried about bias in how the groups were formed.

Help me assess whether this is causal evidence or just correlation, and then help me design a proper randomized study based on what we've learned.`,

  explore: `Our key product metric has been trending in the wrong direction and I need to understand why. I have the data but I don't know where to start looking.

Help me explore this dataset systematically — segment the data, find the root cause, and tell me what's actually driving the change. Don't just describe the trend — find the story.`,
};
