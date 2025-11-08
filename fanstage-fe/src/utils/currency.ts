/**
 * Formats a numeric value as IDRX currency with thousand separators
 * @param value - The numeric value or string to format
 * @returns Formatted string like "1,000,000 IDRX"
 */
export const formatIDRX = (value: string | number): string => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${numeric.toLocaleString()} IDRX`;
};
