/**
 * withTimeout — bound a promise by a deadline, clearing the timer either way.
 *
 * Supports R2.3 (lifecycle method timeouts) and R4.1 (short health timeout). The
 * underlying work may still settle later — a promise cannot be cancelled — but
 * the caller stops waiting and the module transitions to FAILED. The timer is
 * unref'd so a pending timeout never keeps the process alive, and always
 * cleared so no handle leaks (supports R2.4's "no leaked timers").
 */

export async function withTimeout<T>(
  work: Promise<T>,
  ms: number,
  onTimeout: () => Error,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(onTimeout()), ms);
    timer.unref?.();
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
