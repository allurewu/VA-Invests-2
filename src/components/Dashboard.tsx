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
import { InvestmentRecord, ValueAveragePlan, AppSettings, StockQuote, VixQuote } from "../types";
import { formatCurrency, formatPercent, getElapsedMonths, getTargetValueForMonth } from "../utils";

interface DashboardProps {
  records: InvestmentRecord[];
  plan: ValueAveragePlan | null;
  settings: AppSettings;
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
  vix: VixQuote | null;
  loadingQuotes: boolean;
  onRefreshQuotes: () => void;
  onQuickRecord: (prefills: { qqqmAmount: number; vooAmount: number }) => void;
  onNavigateToPlan: () => void;
}

const getVixInterpretation = (val: number) => {
  if (val < 10) {
    return {
      text: "极度乐观 / 变盘警惕",
      color: "text-emerald-600 bg-emerald-50",
      barColor: "bg-[#0f766e]",
      desc: "市场极其安定，注意波动率可能触底反弹带来的突发调整风险。"
    };
  } else if (val >= 10 && val < 15) {
    return {
      text: "乐观平静",
      color: "text-emerald-500 bg-emerald-50",
      barColor: "bg-[#115e59]",
      desc: "市场波动率较低，投资者持信心乐观。情绪稳健，是适合执行常规计划的良机。"
    };
  } else if (val >= 15 && val < 20) {
    return {
      text: "正常区间",
      color: "text-slate-650 bg-slate-100",
      barColor: "bg-[#194D43]",
      desc: "波动处于中枢常态，无极端情绪扰动。定投可安心推进，按权重布局。"
    };
  } else if (val >= 20 && val < 30) {
    return {
      text: "市场紧张",
      color: "text-amber-600 bg-amber-50",
      barColor: "bg-[#b45309]",
      desc: "多空分歧加剧，市场暗流涌动。可按VA定投建议适度加力买入筹码。"
    };
  } else if (val >= 30 && val < 40) {
    return {
      text: "明显恐慌",
      color: "text-orange-650 bg-orange-50",
      barColor: "bg-[#c2410c]",
      desc: "避险盘集中涌出，资产价格超跌。在VA价值平均指引下，此时定投买入溢价很高！"
    };
  } else {
    return {
      text: "极度恐慌",
      color: "text-rose-600 bg-rose-50 border border-rose-100",
      barColor: "bg-[#be123c]",
      desc: "黑天鹅极端风险事件肆虐。巴菲特式的黄金吸筹点，VA策略将建议加大定投倍率买入。"
    };
  }
};

export default function Dashboard({
  records,
  plan,
  settings,
  quotes,
  vix,
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

  // Individual accumulated gain
  const qqqmGain = qqqmValue - qqqmCost;
  const qqqmGainPercent = qqqmCost > 0 ? (qqqmGain / qqqmCost) * 100 : 0;

  const vooGain = vooValue - vooCost;
  const vooGainPercent = vooCost > 0 ? (vooGain / vooCost) * 100 : 0;

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
      {/* 5.4 Premium Financial Header */}
      <div className="flex justify-between items-center py-2.5 px-0 relative overflow-hidden select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tighter shrink-0">
            VA
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-800 tracking-tight leading-none">VA INVEST</span>
              <span className="inline-flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-normal mt-1 leading-none">价值平均算法定投系统</p>
          </div>
        </div>
        <div className="flex items-center">
          {loadingQuotes ? (
            <span className="text-slate-400 text-[10px] font-bold flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
              同步报价
            </span>
          ) : (
            <button
              onClick={onRefreshQuotes}
              disabled={loadingQuotes}
              id="refresh_rates_btn"
              className="px-3.5 py-1.5 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-500/30 transition-all rounded-full text-[10px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3 h-3 text-blue-500" />
              <span>智能刷新</span>
            </button>
          )}
        </div>
      </div>

      {/* 市场恐慌情绪指标 (VIX Fear Index) */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-3 transition-all duration-300 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">市场恐慌情绪指标</span>
          </div>
          {vix?.isFallback && (
            <span className="text-[8px] bg-slate-200/50 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
              静止离线
            </span>
          )}
        </div>

        {/* Big Score Header */}
        {vix ? (
          (() => {
            const vixValue = vix.price;
            const interpretation = getVixInterpretation(vixValue);
            
            return (
              <div className="space-y-3">
                {/* Numeric VIX Display */}
                <div className="flex justify-between items-baseline">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800 tracking-tighter font-mono leading-none">
                      {vixValue.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg leading-tight uppercase ${interpretation.color}`}>
                      {interpretation.text}
                    </span>
                  </div>
                  {vix.change !== 0 && (
                    <span className={`text-[10px] font-bold font-mono ${vix.change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {vix.change >= 0 ? "+" : ""}{vix.change.toFixed(2)} ({vix.changePercent >= 0 ? "▲" : "▼"}{Math.abs(vix.changePercent).toFixed(2)}%)
                    </span>
                  )}
                </div>

                {/* Progress Bar Gauge Slider exactly like prototype sketch */}
                <div className="space-y-1">
                  <div className="relative h-11 w-full bg-[#EBEBEB] rounded-2xl flex items-center px-1.5 border border-white">
                    {/* Filled bar up to VIX percentage */}
                    <div 
                      className="h-8 rounded-xl transition-all duration-700 ease-out flex items-center justify-end" 
                      style={{ 
                        width: `${Math.min(Math.max(vixValue - 1.5, 2), 97)}%`, 
                        backgroundColor: "#194D43"
                      }} 
                    />
                    {/* Vertical indicator slider cursor */}
                    <div className="w-1 h-6 bg-[#18181B] rounded-full transition-all duration-700 ease-out z-10 ml-1.5" />
                  </div>

                  {/* Ticks scale line below Progress Capsule */}
                  <div className="relative w-full px-2 mt-1.5 text-slate-400 font-mono text-[8.5px] font-bold select-none">
                    <div className="flex justify-between px-1 text-slate-300">
                      <span>|</span>
                      <span className="relative right-0.5">|</span>
                      <span>|</span>
                    </div>
                    <div className="flex justify-between mt-0.5 font-mono text-slate-500 pt-0 pr-0 pl-[4px]">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>


              </div>
            );
          })()
        ) : (
          <div className="py-4 text-center text-slate-300 text-xs font-semibold animate-pulse flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>恐慌指数行情同步中...</span>
          </div>
        )}
      </div>

      {/* 1.3 VA核心卡片 - Styled in striking solid color theme from design */}
      {!plan ? (
        <div className="rounded-2xl border border-dashed border-[#FFFFFF] bg-[#F3F3F3] p-4 text-center space-y-4 mb-4">
          <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">未激活 VA 投资计划</h3>
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
        <div className="rounded-2xl bg-blue-600 text-white p-4 mb-4 space-y-4 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[12px] leading-[16px] font-bold tracking-tight">
                定投周期 {currentMonthLabel}（{String(elapsedMonths).padStart(2, '0')}期）
              </div>
            </div>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-md font-semibold tracking-wide flex-shrink-0">
              智能差额核算
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/5">
              <p className="text-[9px] opacity-80 uppercase font-bold tracking-wider">当前资产</p>
              <p className="text-xs font-extrabold mt-1 font-mono">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl border border-[#FFFFFF]/10 border-white/5">
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

          <div className="bg-white/10 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/85 font-medium">建议本月投入金额:</span>
              {suggestedInvestment > 0 ? (
                <span className="font-mono font-extrabold text-white text-[12px] leading-[16px]">
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
              <div className="pt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="opacity-75 text-[9px] block mb-1">QQQM 比例：{settings.qqqmRatio}%</span>
                    <span className="font-mono font-extrabold text-white">应投：{formatCurrency(qqqmSuggest)}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="opacity-75 text-[9px] block mb-1">VOO 比例：{settings.vooRatio}%</span>
                    <span className="font-mono font-extrabold text-white">应投：{formatCurrency(vooSuggest)}</span>
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

      {/* ETF持仓明细 */}
      <div className="space-y-3 transition-all duration-300">
        <div className="flex justify-between items-center pb-0 px-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETF持仓明细</span>
          <span className="text-[9px] text-slate-400 font-bold font-mono">分配比例</span>
        </div>

        {/* 1.1 资产总览 - 2-Card Summary Grid moved under title */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: 总资产 */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between min-h-[105px]">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">总资产</div>
              <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono mt-1.5 tracking-tight break-all">
                {formatCurrency(totalAssets)}
              </div>
            </div>
            <div className={`text-[9px] sm:text-[10px] font-semibold flex items-center gap-0.5 leading-none mt-2 ${totalGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              <span>{totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)} ({totalGainPercent >= 0 ? "+" : ""}{totalGainPercent.toFixed(2)}%)</span>
            </div>
          </div>

          {/* Card 2: 总成本 */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 transition-all flex flex-col justify-between min-h-[105px]">
            <div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">总投入本金</div>
              <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono mt-1.5 tracking-tight break-all">
                {formatCurrency(totalInvested)}
              </div>
            </div>
            <div className={`text-[9px] sm:text-[10px] font-semibold flex items-center gap-0.5 leading-none mt-2 ${todayGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              <span>今日盈亏：{todayGain >= 0 ? "+" : ""}{formatCurrency(todayGain)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* QQQM Card */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 mb-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                <span className="text-xs font-black text-slate-800 font-sans tracking-tight">QQQM</span>
                <span className="text-[8px] bg-[#6366F1]/10 text-[#6366F1] px-1 py-0.2 rounded font-bold">
                  纳指100 ETF
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-600">
                {totalAssets > 0 ? ((qqqmValue / totalAssets) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-0.5">
              <div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">持仓市值</p>
                <p className="text-sm font-extrabold text-[#18181B] font-mono mt-1 tracking-tight">
                  {formatCurrency(qqqmValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">累计盈亏</p>
                <div className={`text-[10px] sm:text-xs font-extrabold font-mono mt-0.5 ${qqqmGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {qqqmGain >= 0 ? "+" : ""}{formatCurrency(qqqmGain)} ({qqqmGainPercent >= 0 ? "+" : ""}{qqqmGainPercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#EBEBEB] text-[9px] text-slate-550 font-bold font-mono">
              <div>
                <span className="text-slate-400 text-[7.5px] block leading-snug">持股数量</span>
                <span className="text-slate-700">{qqqmShares.toFixed(3)}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 text-[7.5px] block leading-snug">持仓均价</span>
                <span className="text-slate-700">{formatCurrency(qqqmAvgCost)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[7.5px] block leading-snug">当前市价</span>
                <span className="text-slate-700">{formatCurrency(qqqmPrice)}</span>
              </div>
            </div>
          </div>

          {/* VOO Card */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                <span className="text-xs font-black text-slate-800 font-sans tracking-tight">VOO</span>
                <span className="text-[8px] bg-[#0EA5E9]/10 text-[#0EA5E9] px-1 py-0.2 rounded font-bold">
                  标普500 ETF
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono text-slate-600">
                {totalAssets > 0 ? ((vooValue / totalAssets) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-0.5">
              <div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">持仓市值</p>
                <p className="text-sm font-extrabold text-[#18181B] font-mono mt-1 tracking-tight">
                  {formatCurrency(vooValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">累计盈亏</p>
                <div className={`text-[10px] sm:text-xs font-extrabold font-mono mt-0.5 ${vooGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {vooGain >= 0 ? "+" : ""}{formatCurrency(vooGain)} ({vooGainPercent >= 0 ? "+" : ""}{vooGainPercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-[#EBEBEB] text-[9px] text-slate-550 font-bold font-mono">
              <div>
                <span className="text-slate-400 text-[7.5px] block leading-snug">持股数量</span>
                <span className="text-slate-700">{vooShares.toFixed(3)}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 text-[7.5px] block leading-snug">持仓均价</span>
                <span className="text-slate-700">{formatCurrency(vooAvgCost)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[7.5px] block leading-snug">当前市价</span>
                <span className="text-slate-700">{formatCurrency(vooPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
