/**
 * Stable error codes for the Model Router (MODULE_CONTRACT.md R7.5).
 *
 * Callers and tests branch on these without parsing prose. Kernel-level codes
 * (UNKNOWN_CAPABILITY, TIMEOUT) come from KernelErrorCode and are reused as-is.
 */
export const ModelRouterErrorCode = {
  /** Request payload failed the capability's preconditions. */
  BAD_REQUEST: "MODEL_ROUTER_BAD_REQUEST",
  /** No configured provider can serve the request. */
  NO_PROVIDER: "MODEL_ROUTER_NO_PROVIDER",
  /** Every attempted provider failed. */
  PROVIDER_FAILED: "MODEL_ROUTER_PROVIDER_FAILED",
} as const;

export type ModelRouterErrorCode =
  (typeof ModelRouterErrorCode)[keyof typeof ModelRouterErrorCode];
