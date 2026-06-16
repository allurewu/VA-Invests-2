import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle,
  Clock, 
  Map, 
  Save, 
  ChevronRight, 
  ListOrdered,
  AlertCircle
} from "lucide-react";
import { ValueAveragePlan, AppSettings, InvestmentRecord, StockQuote } from "../types";
import { formatCurrency, getElapsedMonths, getTargetValueForMonth, generatePlanMonths } from "../utils";

interface PlanProps {
  plan: ValueAveragePlan | null;
  settings: AppSettings;
  records: InvestmentRecord[];
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
  onSavePlan: (plan: ValueAveragePlan) => Promise<any>;
}

export default function Plan({
  plan,
  settings,
  records,
  quotes,
  onSavePlan,
}: PlanProps) {
  // Helper to get actual current month’s first day in YYYY-MM-DD format
  const getDefaultStartDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  };

  const getDefaultEndDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear() + 30;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  };

  // Plan setup hook form state
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [initialCapital, setInitialCapital] = useState("500");
  const [monthlyGrowth, setMonthlyGrowth] = useState("500");

  // Show status triggers
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [showEntireMonths, setShowEntireMonths] = useState(false);

  // Sync state if plan already exists
  useEffect(() => {
    if (plan) {
      setStartDate(plan.startDate);
      setEndDate(plan.endDate);
      setInitialCapital(plan.initialCapital.toString());
      setMonthlyGrowth(plan.monthlyGrowth.toString());
    }
  }, [plan]);

  // Calculations
  const qqqRecords = records.filter(r => r.symbol === "QQQM");
  const vooRecords = records.filter(r => r.symbol === "VOO");

  const qqqShares = qqqRecords.reduce((sum, r) => sum + r.shares, 0);
  const vooShares = vooRecords.reduce((sum, r) => sum + r.shares, 0);

  const qqqCost = qqqRecords.reduce((sum, r) => sum + r.amount, 0);
  const vooCost = vooRecords.reduce((sum, r) => sum + r.amount, 0);
  const qqqAvgCost = qqqShares > 0 ? qqqCost / qqqShares : 0;
  const vooAvgCost = vooShares > 0 ? vooCost / vooShares : 0;

  const qqqPrice = quotes.QQQM?.price ?? qqqAvgCost ?? 0;
  const vooPrice = quotes.VOO?.price ?? vooAvgCost ?? 0;

  const currentPortfolioValue = (qqqShares * qqqPrice) + (vooShares * vooPrice);

  // Handle Plan submission
  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessText("");
    setErrorText("");

    const initial = parseFloat(initialCapital);
    const growth = parseFloat(monthlyGrowth);

    if (isNaN(initial) || initial <= 0) {
      setErrorText("初始本金必须是大于 0 的数值");
      return;
    }
    if (isNaN(growth) || growth <= 0) {
      setErrorText("月目标增长金额必须是大于 0 的数值");
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      setErrorText("结束日期必须大于起始日期");
      return;
    }

    const payload: ValueAveragePlan = {
      startDate,
      endDate,
      initialCapital: initial,
      monthlyGrowth: growth,
    };

    try {
      await onSavePlan(payload);
      setSuccessText("VA计划大纲已确认并保存成功！系统已重构对应的月份序列和目标价值。");
    } catch (err: any) {
      setErrorText("保存VA规则发生错误: " + err.message);
    }
  };

  // Generate sequence months
  const monthsArray = plan
    ? generatePlanMonths(plan.startDate, plan.endDate, plan.initialCapital, plan.monthlyGrowth)
    : [];

  const currentMonthIdx = plan ? getElapsedMonths(plan.startDate) : 1;
  const currentMonthTargetValue = plan 
    ? getTargetValueForMonth(currentMonthIdx, plan.initialCapital, plan.monthlyGrowth)
    : 0;

  const currentMonthGap = currentMonthTargetValue - currentPortfolioValue;
  const currentMonthSuggest = currentMonthGap > 0 ? currentMonthGap : 0;

  // Split建议
  const qqqSuggest = currentMonthSuggest * (settings.qqqmRatio / 100);
  const vooSuggest = currentMonthSuggest * (settings.vooRatio / 100);

  // Paginate months array or slice to save CPU
  const itemsBeforeActive = 2;
  const itemsAfterActive = 3;
  const activeIdxOffset = monthsArray.findIndex(m => m.index === currentMonthIdx);

  const slicedMonths = showEntireMonths 
    ? monthsArray 
    : (activeIdxOffset !== -1 
        ? monthsArray.slice(
            Math.max(0, activeIdxOffset - itemsBeforeActive),
            Math.min(monthsArray.length, activeIdxOffset + 1 + itemsAfterActive)
          )
        : monthsArray.slice(0, 5)
      );

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">价值计划</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium font-sans">
          让您的资产总额每月按固定金额平稳增长
        </p>
      </div>

      {/* 3.1 计划配置 Form */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wider">
          <Map className="w-4 h-4 text-blue-600" />
          <span>VA规则参数配置</span>
        </h2>

        {successText && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>{successText}</span>
          </div>
        )}

        {errorText && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmitPlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                起始月份
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                截止月份
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Initial Capital */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                第1个月初始目标市值
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="例如: 500"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>

            {/* Monthly target growth */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                后续月目标递增额
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="例如: 500"
                value={monthlyGrowth}
                onChange={(e) => setMonthlyGrowth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            id="confirm_save_plan_btn"
            className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            更新或确认 VA 规则计划书
          </button>
        </form>
      </div>

      {/* 3.2 当前定投执行状态高亮 Card */}
      {plan && (
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-1">当前月份执行状态</h2>
          
          <div className="bg-gradient-to-r from-blue-50/60 to-slate-100/60 border border-blue-100 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center bg-[#F3F3F3] p-2.5 rounded-xl border border-[#FFFFFF]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span className="text-xs font-bold text-blue-800">当前活跃：计划第 {currentMonthIdx} 个月</span>
              </div>
              <span className="text-[9px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                当前定投月
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div className="bg-[#F3F3F3] p-3 rounded-xl border border-[#FFFFFF]">
                <span className="text-[10px] text-slate-400 block font-bold">本月拟定目标总市值</span>
                <span className="text-base font-bold font-mono text-slate-850 block mt-1">{formatCurrency(currentMonthTargetValue)}</span>
              </div>
              <div className="bg-[#F3F3F3] p-3 rounded-xl border border-[#FFFFFF]">
                <span className="text-[10px] text-slate-400 block font-bold">目前持仓组合公允价值</span>
                <span className="text-base font-bold font-mono text-slate-850 block mt-1">{formatCurrency(currentPortfolioValue)}</span>
              </div>
            </div>

            <div className="p-4 bg-[#F3F3F3] rounded-xl border border-[#FFFFFF] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-bold">本期拟定加投总额:</span>
                {currentMonthSuggest > 0 ? (
                  <span className="font-mono text-orange-600 font-extrabold text-sm bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-lg animate-pulse">
                    {formatCurrency(currentMonthSuggest)}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    本期无需投入 (行情表现优异!)
                  </span>
                )}
              </div>

              {currentMonthSuggest > 0 && (
                <div className="space-y-2 pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 flex justify-between items-center font-bold">
                    <span>各标的拟平衡分配额:</span>
                    <span>QQQM {settings.qqqmRatio}% | VOO {settings.vooRatio}%</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-bold mb-0.5">QQQM 拟购</span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(qqqSuggest)}</span>
                    </div>
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 text-[10px] block font-bold mb-0.5">VOO 拟购</span>
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(vooSuggest)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sliced sequence Month list */}
          <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-blue-600" />
                长期里程碑序列
              </span>
              <button
                onClick={() => setShowEntireMonths(!showEntireMonths)}
                className="text-[10px] text-blue-600 font-bold uppercase hover:underline cursor-pointer"
              >
                {showEntireMonths ? "精简显示" : "显示完整 360 月大表"}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {slicedMonths.map((m) => {
                const isActive = m.index === currentMonthIdx;
                return (
                  <div 
                    key={m.index}
                    className={`p-3 rounded-xl border flex justify-between items-center transition ${
                      isActive 
                        ? "bg-blue-50/50 border-blue-300" 
                        : "bg-slate-50/30 border-slate-200/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center font-mono border ${
                        isActive 
                          ? "bg-blue-600 text-white border-blue-750" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        M{m.index}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 font-mono">{m.dateLabel}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {isActive ? "✨ 正在执行的活动定投月" : `月定投里程碑`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">目标市值 milestone</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{formatCurrency(m.targetValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!showEntireMonths && monthsArray.length > slicedMonths.length && (
              <p className="text-[9px] text-slate-400 text-center font-medium mt-1">
                已自动隐藏其余非核心月份。开启大表可查阅完整的财富递增模拟曲线。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
