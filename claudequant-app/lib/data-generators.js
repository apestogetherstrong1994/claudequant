// ─── Seeded PRNG + sample dataset generators ───────────────────────────────
const prng = (s) => {
  let seed = s;
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
};

// Dataset 1: A/B Test with Simpson's Paradox
// Story: Variant B appears to win overall (p~0.03), but it was disproportionately
// shown to desktop users (who convert more regardless). Within each platform,
// Variant A performs equally or better. Classic Simpson's paradox.
export const genExperiment = () => {
  const r = prng(42), d = [];
  const countries = ["US", "US", "US", "UK", "UK", "DE"];
  for (let i = 0; i < 50; i++) {
    const platform = r() < 0.5 ? "desktop" : "mobile";
    // Simpson's paradox: B is disproportionately assigned to desktop
    const variant = platform === "desktop"
      ? (r() < 0.70 ? "B" : "A")  // 70% of desktop gets B
      : (r() < 0.40 ? "B" : "A"); // 40% of mobile gets B
    // Desktop converts much more than mobile (regardless of variant)
    const baseRate = platform === "desktop" ? 0.35 : 0.15;
    // Within each platform, A is slightly better (or equal)
    const variantBoost = variant === "A" ? 0.02 : -0.01;
    const signedUp = r() < (baseRate + variantBoost) ? 1 : 0;
    const timeOnPage = Math.round(15 + r() * 90 + (signedUp ? 20 : 0) + (platform === "desktop" ? 10 : 0));
    d.push({
      User_ID: `U${String(i + 1).padStart(3, "0")}`,
      Variant: variant,
      Platform: platform,
      Signed_Up: signedUp,
      Time_on_Page: timeOnPage,
      Country: countries[Math.floor(r() * countries.length)],
    });
  }
  return d;
};

// Dataset 2: Wellness Pilot with Selection Bias
// Story: Treatment group shows lower post-stress, but groups weren't properly
// randomized — treatment had lower baseline stress (selection bias). Controlling
// for baseline, the effect shrinks but remains marginally significant.
export const genPilot = () => {
  const r = prng(17), d = [];
  const depts = ["Engineering", "Sales", "Operations"];
  for (let i = 0; i < 40; i++) {
    const group = i < 20 ? "treatment" : "control";
    const dept = depts[Math.floor(r() * depts.length)];
    // Selection bias: treatment group has lower baseline stress
    const baselineStress = group === "treatment"
      ? Math.max(1, Math.min(10, 5.5 + (r() - 0.5) * 4))
      : Math.max(1, Math.min(10, 6.5 + (r() - 0.5) * 4));
    // Treatment effect: 0.8 reduction for treatment, 0.3 for control (natural regression)
    const effect = group === "treatment" ? 0.8 : 0.3;
    const postStress = Math.max(1, Math.min(10, baselineStress - effect + (r() - 0.5) * 2.5));
    const sickBefore = Math.round(Math.max(0, Math.min(8, 3 + baselineStress * 0.3 + (r() - 0.5) * 3)));
    const sickAfter = Math.round(Math.max(0, Math.min(8, sickBefore - (group === "treatment" ? 0.5 : 0.1) + (r() - 0.5) * 2)));
    const engagement = Math.round(Math.max(10, Math.min(100, 55 - baselineStress * 3 + (group === "treatment" ? 8 : 0) + r() * 20)));
    d.push({
      Employee_ID: `E${String(i + 1).padStart(3, "0")}`,
      Group: group,
      Department: dept,
      Baseline_Stress: +baselineStress.toFixed(1),
      Post_Stress: +postStress.toFixed(1),
      Sick_Days_Before: sickBefore,
      Sick_Days_After: sickAfter,
      Engagement_Score: engagement,
    });
  }
  return d;
};

// Dataset 3: SaaS Retention with Cohort/Onboarding Effect
// Story: Overall retention is declining month-over-month. But it's entirely
// driven by a cohort effect — v2 onboarding (Mar/Apr) has much worse retention
// than v1 (Jan/Feb). The fix is to revert onboarding, not panic about churn.
export const genRetention = () => {
  const r = prng(31), d = [];
  const cohorts = ["Jan", "Feb", "Mar", "Apr"];
  for (let i = 0; i < 50; i++) {
    const cohortIdx = Math.floor(i / 12.5); // ~12-13 per cohort
    const cohort = cohorts[Math.min(cohortIdx, 3)];
    // Earlier cohorts get v1, later get v2 (with some overlap)
    const onboarding = (cohort === "Jan" || cohort === "Feb")
      ? (r() < 0.85 ? "v1" : "v2")
      : (r() < 0.15 ? "v1" : "v2");
    // v1 has much better retention than v2
    const day7Rate = onboarding === "v1" ? 0.78 : 0.55;
    const day30Rate = onboarding === "v1" ? 0.60 : 0.32;
    const day7 = r() < day7Rate ? 1 : 0;
    const day30 = day7 === 1 ? (r() < (day30Rate / day7Rate) ? 1 : 0) : 0;
    const featureAdoption = Math.round(Math.max(0, Math.min(5,
      (onboarding === "v1" ? 2.8 : 1.5) + (r() - 0.5) * 3
    )));
    const supportTickets = Math.round(Math.max(0, Math.min(3,
      (onboarding === "v2" ? 1.2 : 0.5) + (r() - 0.5) * 2
    )));
    d.push({
      User_ID: `U${String(i + 1).padStart(3, "0")}`,
      Signup_Cohort: cohort,
      Onboarding_Version: onboarding,
      Day_7_Active: day7,
      Day_30_Active: day30,
      Feature_Adoption: featureAdoption,
      Support_Tickets: supportTickets,
    });
  }
  return d;
};
