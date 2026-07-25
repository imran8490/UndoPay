/**
 * Mirrors RECLAIM_WINDOW in UndoPayEscrow.sol. Used as a fallback for
 * UI countdown initialization before the on-chain value loads.
 */
export const RECLAIM_WINDOW_SECONDS = 30;

/** Alias for RECLAIM_WINDOW_SECONDS, in case other code expects this name. */
export const RECLAIM_WINDOW = RECLAIM_WINDOW_SECONDS;

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Reclaimed",
  2: "Released",
};
