export function normalizePairingCode(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidPairingCode(value: string) {
  return /^[A-Za-z0-9_-]{4,64}$/.test(value);
}
