export type SubscriptionPlan = "free" | "pro" | "elite";

const planRank: Record<SubscriptionPlan, number> = { free: 0, pro: 1, elite: 2 };

export function planIncludes(current: SubscriptionPlan, minimum: SubscriptionPlan) {
  return planRank[current] >= planRank[minimum];
}

export const planNames: Record<SubscriptionPlan, string> = {
  free: "Free",
  pro: "Pro",
  elite: "Elite",
};
