export type RecurringPrice = {
  currency: string | null;
  unit_amount: number | null;
  recurring: { interval: "month" | "year" | string; interval_count?: number | null } | null;
};

export type StripeSubscriptionItem = {
  quantity?: number | null;
  price: RecurringPrice;
};

export type StripeSubscriptionForMrr = {
  status: string;
  items: { data: StripeSubscriptionItem[] };
};

export type MrrAggregate = {
  currency: string;
  active_paid_subscription_count: number;
  normalized_monthly_recurring_amount_minor: number;
};

const monthlyDivisor = (price: RecurringPrice) => {
  const count = price.recurring?.interval_count ?? 1;
  if (!Number.isInteger(count) || count < 1) return null;
  if (price.recurring?.interval === "month") return count;
  if (price.recurring?.interval === "year") return count * 12;
  return null;
};

/** Aggregates active paid recurring subscriptions without retaining Stripe IDs. */
export const aggregateActiveSubscriptionMrr = (subscriptions: StripeSubscriptionForMrr[]): MrrAggregate[] => {
  const totals = new Map<string, MrrAggregate>();

  for (const subscription of subscriptions) {
    if (subscription.status !== "active") continue;
    const subscriptionTotals = new Map<string, number>();

    for (const item of subscription.items.data) {
      const divisor = monthlyDivisor(item.price);
      const unitAmount = item.price.unit_amount;
      const quantity = item.quantity ?? 1;
      const currency = item.price.currency?.toLowerCase();
      if (!divisor || !currency || !Number.isInteger(unitAmount) || unitAmount <= 0 || !Number.isInteger(quantity) || quantity < 1) continue;
      const monthlyAmount = Math.round((unitAmount * quantity) / divisor);
      if (monthlyAmount <= 0) continue;
      subscriptionTotals.set(currency, (subscriptionTotals.get(currency) ?? 0) + monthlyAmount);
    }

    if (subscriptionTotals.size === 0) continue;
    if (subscriptionTotals.size > 1) throw new Error("active_subscription_has_multiple_currencies");

    const [currency, normalizedMonthlyAmount] = [...subscriptionTotals.entries()][0];
    const aggregate = totals.get(currency) ?? {
      currency,
      active_paid_subscription_count: 0,
      normalized_monthly_recurring_amount_minor: 0,
    };
    aggregate.active_paid_subscription_count += 1;
    aggregate.normalized_monthly_recurring_amount_minor += normalizedMonthlyAmount;
    totals.set(currency, aggregate);
  }

  return [...totals.values()].sort((left, right) => left.currency.localeCompare(right.currency));
};

export const completedLondonBusinessDate = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const londonToday = `${value("year")}-${value("month")}-${value("day")}`;
  const londonMidnight = new Date(`${londonToday}T00:00:00.000Z`);
  londonMidnight.setUTCDate(londonMidnight.getUTCDate() - 1);
  return londonMidnight.toISOString().slice(0, 10);
};
