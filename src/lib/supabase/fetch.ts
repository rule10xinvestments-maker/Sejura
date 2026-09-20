export const SUPABASE_FETCH_TIMEOUT_MS = 2500;

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

export async function supabaseFetchWithTimeout(
  input: FetchInput,
  init: FetchInit = {},
  timeoutMs = SUPABASE_FETCH_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamSignal = init.signal;

  function abortFromUpstream() {
    controller.abort();
  }

  if (upstreamSignal?.aborted) {
    controller.abort();
  } else {
    upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
    upstreamSignal?.removeEventListener("abort", abortFromUpstream);
  }
}
