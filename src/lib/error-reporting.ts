export function createSupportReference() {
  return `WEB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export function reportClientError(error: Error) {
  const reference = createSupportReference();
  const payload = {
    reference,
    name: error.name,
    message: error.message.slice(0, 500),
    path: window.location.pathname,
    release: __SCRIMSTATS_RELEASE__,
  };
  if (import.meta.env.PROD) {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json", "x-correlation-id": reference },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined);
  } else {
    console.error("[client-error]", payload, error);
  }
  return reference;
}
