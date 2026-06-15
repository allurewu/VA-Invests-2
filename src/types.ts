export interface InvestmentRecord {
  id?: number;
  date: string; // YYYY-MM-DD
  symbol: "QQQM" | "VOO";
  price: number;
  amount: number;
  shares: number;
}

export interface ValueAveragePlan {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  initialCapital: number;
  monthlyGrowth: number;
}

export interface AppSettings {
  qqqmRatio: number; // e.g., 70 for 70%
  vooRatio: number;  // e.g., 30 for 30%
  provider: string;  // "Yahoo Finance" or other
}

export interface StockQuote {
  symbol: "QQQM" | "VOO";
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
  isFallback: boolean;
}
