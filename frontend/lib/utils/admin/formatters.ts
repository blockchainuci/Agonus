// Formatting utilities for admin console

/**
 * Format number as currency (USD)
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Format crypto asset amount
 */
export function formatAsset(asset: string, amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  // Different precision for different assets
  let decimals = 8; // Default for most crypto
  if (asset === "USD") decimals = 2;
  else if (asset === "BTC") decimals = 8;
  else if (asset === "ETH" || asset === "SOL") decimals = 4;

  return `${num.toFixed(decimals)} ${asset}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format date/time for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format date only
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(dateString);
}

/**
 * Format duration between two dates
 */
export function formatDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  return `${Math.floor(days / 30)} months`;
}

/**
 * Format portfolio breakdown
 */
export function formatPortfolio(portfolio: Record<string, number>): string {
  return Object.entries(portfolio)
    .map(([asset, amount]) => formatAsset(asset, amount))
    .join(", ");
}

/**
 * Calculate and format gain/loss
 * NOTE: Requires starting_balance - using hardcoded $100k for now
 */
export function formatGainLoss(currentValue: string | number): {
  amount: string;
  percent: string;
  isProfit: boolean;
} {
  // TODO: Get starting_balance from backend
  const STARTING_BALANCE = 100000;

  const current = typeof currentValue === "string" ? parseFloat(currentValue) : currentValue;
  const gain = current - STARTING_BALANCE;
  const gainPercent = (gain / STARTING_BALANCE) * 100;

  return {
    amount: formatCurrency(Math.abs(gain)),
    percent: `${gainPercent >= 0 ? "+" : "-"}${Math.abs(gainPercent).toFixed(2)}%`,
    isProfit: gain >= 0,
  };
}

/**
 * Format trade description
 */
export function formatTradeDescription(
  action: string,
  amount: string,
  asset: string,
  price: string
): string {
  if (action === "hold") return "Held position";

  const actionText = action === "buy" ? "Bought" : "Sold";
  const formattedAmount = formatAsset(asset, amount);
  const formattedPrice = formatCurrency(price);

  return `${actionText} ${formattedAmount} at ${formattedPrice}`;
}
