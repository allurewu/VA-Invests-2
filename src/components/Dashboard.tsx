import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Layers, 
  Coins, 
  CheckCircle, 
  ArrowUpRight, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { InvestmentRecord, ValueAveragePlan, AppSettings, StockQuote } from "../types";
import { formatCurrency, formatPercent, getElapsedMonths, getTargetValueForMonth } from "../utils";

interface DashboardProps {
  records: InvestmentRecord[];
  plan: ValueAveragePlan | null;
  settings: AppSettings;
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
  loadingQuotes: boolean;
  onRefreshQuotes: () => void;
  onQuickRecord: (prefills: { qqqmAmount: number; vooAmount: number }) => void;
  onNavigateToPlan: () => void;
}

export default function Dashboard({
  records,
  plan,
  settings,
  quotes,
  loadingQuotes,
  onRefreshQuotes,
  onQuickRecord,
  onNavigateToPlan,
}: DashboardProps) {
  // Calculations
  const qqqmRecords = records.filter(r => r.symbol === "QQQM");
  const vooRecords = records.filter(r => r.symbol === "VOO");

  const qqqmShares = qqqmRecords.reduce((sum, r) => sum + r.shares, 0);
  const qqqmCost = qqqmRecords.reduce((sum, r) => sum + r.amount, 0);
  const qqqmAvgCost = qqqmShares > 0 ? qqqmCost / qqqmShares : 0;

  const vooShares = vooRecords.reduce((sum, r) => sum + r.shares, 0);
  const vooCost = vooRecords.reduce((sum, r) => sum + r.amount, 0);
  const vooAvgCost = vooShares > 0 ? vooCost / vooShares : 0;

  const qqqmPrice = quotes.QQQM?.price ?? qqqmAvgCost ?? 0;
  const vooPrice = quotes.VOO?.price ?? vooAvgCost ?? 0;

  const qqqmValue = qqqmShares * qqqmPrice;
  const vooValue = vooShares * vooPrice;

  // Overview Stats
  const totalAssets = qqqmValue + vooValue;
  const totalInvested = qqqmCost + vooCost;
  const totalGain = totalAssets - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Daily gain
  const qqqmDailyGain = quotes.QQQM ? qqqmValue * (quotes.QQQM.changePercent / 100) : 0;
  const vooDailyGain = quotes.VOO ? vooValue * (quotes.VOO.changePercent / 100) : 0;
  const todayGain = qqqmDailyGain + vooDailyGain;

  // VA core calculation
  let elapsedMonths = 1;
  let targetValue = 0;
  let gap = 0;
  let suggestedInvestment = 0;
  let qqqmSuggest = 0;
  let vooSuggest = 0;
  let currentMonthLabel = "";

  if (plan) {
    elapsedMonths = getElapsedMonths(plan.startDate);
    targetValue = getTargetValueForMonth(elapsedMonths, plan.initialCapital, plan.monthlyGrowth);
    gap = targetValue - totalAssets;
    suggestedInvestment = gap > 0 ? gap : 0;

    // Ratios split
    const qqqmRatioDecimal = settings.qqqmRatio / 100;
    const vooRatioDecimal = settings.vooRatio / 100;

    qqqmSuggest = suggestedInvestment * qqqmRatioDecimal;
    vooSuggest = suggestedInvestment * vooRatioDecimal;

    // Calculate current month date label
    const planStart = new Date(plan.startDate + "T00:00:00");
    const labelDate = new Date(planStart);
    labelDate.setMonth(planStart.getMonth() + elapsedMonths - 1);
    currentMonthLabel = `${labelDate.getFullYear()}-${String(labelDate.getMonth() + 1).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-5 pb-24">
      {/* 5.4 Simple Header (Clean, minimalist brand display) */}
      <div className="flex justify-between items-center bg-[#F3F3F3] border border-[#FFFFFF] p-4 rounded-2xl">
        <div>
          <div className="text-xl font-extrabold text-blue-600 tracking-tight leading-none">
            VA INVEST
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 font-medium tracking-wide">VALUE AVERAGING SYSTEM</p>
        </div>
        <div className="flex items-center">
          {loadingQuotes ? (
            <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              同步中...
            </span>
          ) : (
            <button
              onClick={onRefreshQuotes}
              disabled={loadingQuotes}
              id="refresh_rates_btn"
              className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-500/35 transition rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>行情刷新</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.1 资产总览 - 2x2 Summary Grid in Clean Minimalist Styling */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card 1: 总资产 */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between h-[105px]">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">总资产 (Assets)</div>
            <div className="text-lg font-extrabold text-slate-800 font-mono mt-1.5 tracking-tight break-all">
              {formatCurrency(totalAssets)}
            </div>
          </div>
          <div className={`text-[10px] font-semibold flex items-center gap-0.5 leading-none mt-2 ${totalGainPercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            <span>{totalGainPercent >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%</span>
            <span className="text-slate-400">({totalGain >= 0 ? "+" : ""}${Math.round(totalGain)})</span>
          </div>
        </div>

        {/* Card 2: 总成本 */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between h-[105px]">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">总投入本金 (Cost)</div>
            <div className="text-lg font-extrabold text-slate-800 font-mono mt-1.5 tracking-tight break-all">
              {formatCurrency(totalInvested)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold leading-none mt-2">
            累计定投账目
          </div>
        </div>

        {/* Card 3: 累计盈亏 */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between h-[105px]">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">累计收益 (Profit)</div>
            <div className={`text-lg font-extrabold font-mono mt-1.5 tracking-tight break-all ${totalGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
            </div>
          </div>
          <div className={`text-[10px] font-bold leading-none mt-2 ${totalGain >= 0 ? "text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded" : "text-rose-50 bg-rose-50 px-1.5 py-0.5 rounded"}`}>
            {totalGainPercent >= 0 ? "盈余中" : "负增长"}
          </div>
        </div>

        {/* Card 4: 今日估算盈亏 */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between h-[105px]">
          <div>
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">今日亏盈 (Today)</div>
            <div className={`text-lg font-extrabold font-mono mt-1.5 tracking-tight break-all ${todayGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {todayGain >= 0 ? "+" : ""}{formatCurrency(todayGain)}
            </div>
          </div>
          <div className={`text-[10px] font-semibold leading-none mt-2 flex items-center gap-0.5 ${todayGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {todayGain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>估算完成</span>
          </div>
        </div>
      </div>

      {/* 1.3 VA核心卡片 - Styled in striking solid color theme from design */}
      {!plan ? (
        <div className="rounded-2xl border border-dashed border-[#FFFFFF] bg-[#F3F3F3] p-6 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">未激活 VA 投资计划</h3>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              Value Averaging 智能定投需要设定起始日与月内预定资本增长，才可进行定定制投测算、自平衡拆分。
            </p>
          </div>
          <button
            onClick={onNavigateToPlan}
            id="go_to_plan_config"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold rounded-xl transition duration-200 cursor-pointer"
          >
            立即配置 VA 定投计划
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-blue-600 text-white p-5 space-y-4 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div>
              <div className="text-sm font-extrabold tracking-tight">VA 核心计划：第 {elapsedMonths} 个月</div>
              <div className="text-[10px] opacity-80 mt-0.5 font-mono">（周期时点：{currentMonthLabel}）</div>
            </div>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-md font-semibold tracking-wide">
              智能差额核算
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
              <p className="text-[9px] opacity-80 uppercase font-bold tracking-wider">当前资产</p>
              <p className="text-xs font-extrabold mt-1 font-mono">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
              <p className="text-[9px] opacity-80 uppercase font-bold tracking-wider">目标市值</p>
              <p className="text-xs font-extrabold mt-1 font-mono">{formatCurrency(targetValue)}</p>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
              <p className="text-[9px] opacity-80 uppercase font-bold tracking-wider">当前差额</p>
              <p className="text-xs font-extrabold mt-1 font-mono">
                {gap > 0 ? `-$${Math.abs(gap).toFixed(2)}` : `+$${Math.abs(gap).toFixed(2)}`}
              </p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/85 font-medium">建议本月投入金额:</span>
              {suggestedInvestment > 0 ? (
                <span className="font-mono font-extrabold text-white text-lg">
                  {formatCurrency(suggestedInvestment)}
                </span>
              ) : (
                <span className="font-bold text-white bg-emerald-500/30 px-2 py-1 rounded-md text-[10px] flex items-center gap-1 border border-emerald-400/20">
                  <CheckCircle className="w-3 h-3" />
                  市值达标，本月无需定投
                </span>
              )}
            </div>

            {suggestedInvestment > 0 && (
              <div className="space-y-1.5 pt-2.5 border-t border-white/10">
                <p className="text-[9px] opacity-75 flex justify-between items-center">
                  <span>分配拆分方案:</span>
                  <span>QQQM {settings.qqqmRatio}% / VOO {settings.vooRatio}%</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="opacity-70 text-[9px] block mb-0.5">QQQM 计划买入</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(qqqmSuggest)}</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="opacity-70 text-[9px] block mb-0.5">VOO 计划买入</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(vooSuggest)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onQuickRecord({ qqqmAmount: qqqmSuggest, vooAmount: vooSuggest })}
            id="record_va_suggested_btn"
            disabled={suggestedInvestment <= 0}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
              suggestedInvestment > 0 
                ? "bg-white text-blue-600 hover:bg-slate-50 active:scale-[0.98]" 
                : "bg-white/15 text-white/40 cursor-not-allowed"
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-inherit" />
            <span>记录本次定投账目</span>
          </button>
        </div>
      )}

      {/* 1.2 ETF 持仓显示 - Clean light cards */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-1">ETF持仓明细 (Holdings)</h2>
        
        {/* QQQM Holding */}
        <div className="bg-[#F3F3F3] rounded-2xl border border-[#FFFFFF] p-4 space-y-3 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 font-sans">QQQM (纳斯达克100)</span>
              </div>
              <a 
                href="https://finance.yahoo.com/quote/QQQM" 
                target="_blank" 
                rel="no-referrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-1 font-medium"
              >
                <span>Yahoo Finance</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">实时股价</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100/50 text-xs block inline-block mt-1">
                {quotes.QQQM ? formatCurrency(quotes.QQQM.price) : (qqqmAvgCost > 0 ? formatCurrency(qqqmAvgCost) : "--")}
              </span>
              {quotes.QQQM && (
                <span className={`text-[10px] font-bold font-mono block mt-0.5 ${quotes.QQQM.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {quotes.QQQM.changePercent >= 0 ? "+" : ""}{quotes.QQQM.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-[9px] text-slate-400 font-medium">持仓份额</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{qqqmShares.toFixed(3)} 股</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-medium">持仓均价</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{formatCurrency(qqqmAvgCost)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-medium">预计盈亏</p>
              {qqqmShares > 0 ? (
                <div className="mt-0.5">
                  <span className={`text-xs font-bold font-mono block ${qqqmValue - qqqmCost >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {qqqmValue - qqqmCost >= 0 ? "+" : ""}{formatCurrency(qqqmValue - qqqmCost)}
                  </span>
                  <span className={`text-[9px] font-semibold font-mono block ${qqqmValue - qqqmCost >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {qqqmAvgCost > 0 ? formatPercent(((qqqmPrice - qqqmAvgCost) / qqqmAvgCost) * 100) : "0.00%"}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-300 mt-0.5 font-mono">--</p>
              )}
            </div>
          </div>
        </div>

        {/* VOO Holding */}
        <div className="bg-[#F3F3F3] rounded-2xl border border-[#FFFFFF] p-4 space-y-3 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 font-sans">VOO (标普500)</span>
              </div>
              <a 
                href="https://finance.yahoo.com/quote/VOO" 
                target="_blank" 
                rel="no-referrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-1 font-medium"
              >
                <span>Yahoo Finance</span>
                <ArrowUpRight className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">实时股价</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100/50 text-xs block inline-block mt-1">
                {quotes.VOO ? formatCurrency(quotes.VOO.price) : (vooAvgCost > 0 ? formatCurrency(vooAvgCost) : "--")}
              </span>
              {quotes.VOO && (
                <span className={`text-[10px] font-bold font-mono block mt-0.5 ${quotes.VOO.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {quotes.VOO.changePercent >= 0 ? "+" : ""}{quotes.VOO.changePercent.toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-[9px] text-slate-400 font-medium">持仓份额</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{vooShares.toFixed(3)} 股</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-medium">持仓均价</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 font-mono">{formatCurrency(vooAvgCost)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-medium">预计盈亏</p>
              {vooShares > 0 ? (
                <div className="mt-0.5">
                  <span className={`text-xs font-bold font-mono block ${vooValue - vooCost >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {vooValue - vooCost >= 0 ? "+" : ""}{formatCurrency(vooValue - vooCost)}
                  </span>
                  <span className={`text-[9px] font-semibold font-mono block ${vooValue - vooCost >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {vooAvgCost > 0 ? formatPercent(((vooPrice - vooAvgCost) / vooAvgCost) * 100) : "0.00%"}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-300 mt-0.5 font-mono">--</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
