export interface QuotaWindow {
  usedPercent: number;
  remainingPercent: number;
  windowDurationMins: number | null;
  resetsAt: string | null;
}

export interface QuotaSnapshot {
  limitId: string;
  limitName: string;
  planType: string;
  reachedType: string | null;
  credits: unknown;
  primary: QuotaWindow | null;
  secondary: QuotaWindow | null;
  remainingPercent: number | null;
  usedPercent: number | null;
  resetsAt: string | null;
  fetchedAt: string;
}
