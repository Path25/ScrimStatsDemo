export function collectorEntitled(input: {
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionPeriodEnd?: string | null;
  subscriptionPastDueStartedAt?: string | null;
}, now = Date.now()) {
  if (!['pro', 'elite'].includes(input.subscriptionTier)) return false;
  if (['active', 'trialing'].includes(input.subscriptionStatus)) return true;
  if (input.subscriptionStatus === 'past_due') {
    const started = Date.parse(input.subscriptionPastDueStartedAt ?? '');
    return Number.isFinite(started) && started + 7 * 24 * 60 * 60_000 > now;
  }
  const periodEnd = Date.parse(input.subscriptionPeriodEnd ?? '');
  return Number.isFinite(periodEnd) && periodEnd > now;
}

export function collectorGraceEndsAt(startedAt?: string | null) {
  const started = Date.parse(startedAt ?? '');
  return Number.isFinite(started) ? new Date(started + 7 * 24 * 60 * 60_000) : null;
}
