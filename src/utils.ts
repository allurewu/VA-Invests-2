import { ValueAveragePlan } from "./types";

/**
 * Helper to format currency
 */
export function formatCurrency(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "$0.00";
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Helper to format percentages
 */
export function formatPercent(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0.00%";
  const formatted = num.toFixed(2);
  return num >= 0 ? `+${formatted}%` : `${formatted}%`;
}

/**
 * Calculates elapsed months (1-indexed) between startDate and targetDate
 */
export function getElapsedMonths(startDateStr: string, targetDate: Date = new Date()): number {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 1;

  const diffYears = targetDate.getFullYear() - start.getFullYear();
  const diffMonths = targetDate.getMonth() - start.getMonth();
  const index = diffYears * 12 + diffMonths + 1;
  
  return index < 1 ? 1 : index;
}

/**
 * Computes Target Value for a specific month (1-indexed)
 */
export function getTargetValueForMonth(
  monthIndex: number,
  initialCapital: number,
  monthlyGrowth: number
): number {
  if (monthIndex <= 1) return initialCapital;
  return initialCapital + (monthIndex - 1) * monthlyGrowth;
}

/**
 * Generates an array of months between two dates with plan details
 */
export interface VASeqMonth {
  index: number; // 1-indexed
  dateLabel: string; // "YYYY-MM"
  targetValue: number;
}

export function generatePlanMonths(
  startDateStr: string,
  endDateStr: string,
  initialCapital: number,
  monthlyGrowth: number
): VASeqMonth[] {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    // Fail-safe: generate 12 months from start date
    const fallbackStart = isNaN(start.getTime()) ? new Date() : start;
    const months: VASeqMonth[] = [];
    for (let i = 1; i <= 12; i++) {
      const d = new Date(fallbackStart);
      d.setMonth(fallbackStart.getMonth() + i - 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        index: i,
        dateLabel: label,
        targetValue: getTargetValueForMonth(i, initialCapital, monthlyGrowth)
      });
    }
    return months;
  }

  const months: VASeqMonth[] = [];
  const curr = new Date(start);
  let index = 1;

  // Maximum safe limit of 600 months (50 years) to avert memory exhaustion
  while (curr <= end && index <= 600) {
    const label = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      index,
      dateLabel: label,
      targetValue: getTargetValueForMonth(index, initialCapital, monthlyGrowth)
    });
    
    // Add 1 month
    curr.setMonth(curr.getMonth() + 1);
    index++;
  }

  return months;
}
