import React from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { 
  TrendingUp, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  DollarSign, 
  Award, 
  Briefcase,
  AlertCircle
} from "lucide-react";
import { InvestmentRecord, ValueAveragePlan, StockQuote } from "../types";
import { formatCurrency, formatPercent, getElapsedMonths, getTargetValueForMonth, generatePlanMonths } from "../utils";

interface StatsProps {
  records: InvestmentRecord[];
  plan: ValueAveragePlan | null;
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
}

export default function Stats({ records, plan, quotes }: StatsProps) {
  // 1. Core Holdings calculations
  const qqqRecords = records.filter(r => r.symbol === "QQQM");
  const vooRecords = records.filter(r => r.symbol === "VOO");

  const qqqShares = qqqRecords.reduce((sum, r) => sum + r.shares, 0);
  const vooShares = vooRecords.reduce((sum, r) => sum + r.shares, 0);

  const qqqCost = qqqRecords.reduce((sum, r) => sum + r.amount, 0);
  const vooCost = vooRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalCost = qqqCost + vooCost;

  const qqqAvgCost = qqqShares > 0 ? qqqCost / qqqShares : 0;
  const vooAvgCost = vooShares > 0 ? vooCost / vooShares : 0;

  const qqqPrice = quotes.QQQM?.price ?? qqqAvgCost ?? 0;
  const vooPrice = quotes.VOO?.price ?? vooAvgCost ?? 0;

  const qqqValue = qqqShares * qqqPrice;
  const vooValue = vooShares * vooPrice;
  const totalAssets = qqqValue + vooValue;

  const totalGain = totalAssets - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // QQQM stats
  const qqqGain = qqqValue - qqqCost;
  const qqqGainPct = qqqCost > 0 ? (qqqGain / qqqCost) * 100 : 0;

  // VOO stats
  const vooGain = vooValue - vooCost;
  const vooGainPct = vooCost > 0 ? (vooGain / vooCost) * 100 : 0;

  // 4.1 Series Growth Curve Generation
  let chartData: any[] = [];
  let maxSingleMonthInvest = 0;
  let maxReturnMonth = "暂无";
  let maxReturnVal = -999999;

  if (plan) {
    const elapsedMonths = getElapsedMonths(plan.startDate);
    const monthsSeq = generatePlanMonths(plan.startDate, plan.endDate, plan.initialCapital, plan.monthlyGrowth);
    
    // We only plot months starting from month 1 (plan.startDate) up to the current active month
    const plottedMonths = monthsSeq.slice(0, Math.max(3, elapsedMonths + 3));

    // Map records to months to compute cumulative assets and costs over the timeline
    let runningSharesQQQ = 0;
    let runningSharesVOO = 0;
    let runningCost = 0;

      chartData = plottedMonths.map((m) => {
        const label = m.dateLabel; // "YYYY-MM"
        
        // Filter records that occurred in this specific month or earlier
        const recordsUpToMonth = records.filter((r) => {
          const rMonth = r.date.substring(0, 7);
          return rMonth <= label;
        });

        const monthSharesQQQ = recordsUpToMonth.filter(r => r.symbol === "QQQM").reduce((s, r) => s + r.shares, 0);
        const monthSharesVOO = recordsUpToMonth.filter(r => r.symbol === "VOO").reduce((s, r) => s + r.shares, 0);
        const monthCost = recordsUpToMonth.reduce((s, r) => s + r.amount, 0);

        // Estimate valuation at that month. We multiply shares by current price for current perspective, 
        // or by historical avg prices if we wanted historical, but standard and neatest is current value of those positions.
        const monthAssetValue = (monthSharesQQQ * qqqPrice) + (monthSharesVOO * vooPrice);

        return {
          name: label,
          "目标价值": parseFloat(m.targetValue.toFixed(2)),
          "累计投入": parseFloat(monthCost.toFixed(2)),
          "资产总值": parseFloat(monthAssetValue.toFixed(2)),
        };
      });

    // 4.2 Stats cards helper calculations
    // Max single month purchase
    const monthlyInputs: Record<string, number> = {};
    records.forEach(r => {
      const monthKey = r.date.substring(0, 7);
      monthlyInputs[monthKey] = (monthlyInputs[monthKey] || 0) + r.amount;
    });
    
    const monthlyValues = Object.values(monthlyInputs);
    maxSingleMonthInvest = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0;

    // Find maximum profit month (where assets exceeded target or cost by the highest amount)
    chartData.forEach(d => {
      const profit = d["资产总值"] - d["累计投入"];
      if (profit > maxReturnVal && d["累计投入"] > 0) {
        maxReturnVal = profit;
        maxReturnMonth = d.name;
      }
    });

    if (maxReturnVal <= 0) {
      maxReturnMonth = "尚未盈利";
    } else {
      maxReturnMonth = `${maxReturnMonth}，累计盈利 ${formatCurrency(maxReturnVal)}`;
    }
  }

  // 4.3 Pie allocation data
  const pieData = [
    { name: "QQQM", value: totalAssets > 0 ? parseFloat(qqqValue.toFixed(2)) : 50, color: "#6366f1" },
    { name: "VOO", value: totalAssets > 0 ? parseFloat(vooValue.toFixed(2)) : 50, color: "#0ea5e9" }
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">分析报告</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          平衡资产配比，一眼洞见财富增长轨迹
        </p>
      </div>

      {/* Warning if no plan configured */}
      {!plan && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-800 uppercase tracking-wider">尚未配置定投计划</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              定投计划设定后，此分折页面将全自动激活并渲染数据动态图。
            </p>
          </div>
        </div>
      )}

      {/* 4.1 三线资金对齐曲线 Chart Card */}
      {plan && chartData.length > 0 && (
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 mb-4 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              本利对比曲线
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              通过复合目标、实际累计投入与公允证券市值的叠加，清晰辨识当前处于“跑赢市场”还是“应该坚定加仓”节点。
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#EBEBEB",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: "#334155",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}
                  itemStyle={{
                    color: "#334155"
                  }}
                  labelStyle={{
                    fontWeight: "bold",
                    color: "#1e3a8a",
                    marginBottom: "4px"
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, ""]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32} 
                  iconType="circle" 
                  iconSize={6}
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }}
                />
                {/* 目标价值：紫线 */}
                <Line
                  type="monotone"
                  dataKey="目标价值"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                {/* 累计投入：蓝线 */}
                <Line
                  type="monotone"
                  dataKey="累计投入"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                {/* 实际资产：祖母绿 */}
                <Line
                  type="monotone"
                  dataKey="资产总值"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex justify-between leading-relaxed font-medium">
            <span>💡 <b>绿色代表实际资产公允估值</b>，<b>紫色代表预期目标</b>。当绿色低于紫色时，代表建议加仓，弥补持仓与计划总值的差额！</span>
          </div>
        </div>
      )}

      {/* 4.2 统计卡片 (Important KPI statistics) */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Cost */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">累计总成本</span>
          <span className="text-lg font-bold text-slate-800 font-mono block">{formatCurrency(totalCost)}</span>
          <span className="text-[10px] text-slate-400 font-medium block">已实际扣款的纯现金买入总本金</span>
        </div>

        {/* Total Profit Rate */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">投资总收益</span>
          <span className={`text-lg font-bold font-mono block ${totalGain >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
          </span>
          <span className={`text-[10px] font-bold font-mono block ${totalGain >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {formatPercent(totalGainPct)}
          </span>
        </div>

        {/* Max single-month investment */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">最大单月划拨额</span>
          <span className="text-base font-bold text-slate-800 font-mono block">
            {plan ? formatCurrency(maxSingleMonthInvest) : formatCurrency(0)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">单月合并加仓买入金额的波峰</span>
        </div>

        {/* Best Performance Month */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">超值盈利最佳收益点</span>
          <span className="text-xs font-bold text-slate-700 block truncate leading-5">
            {plan ? maxReturnMonth : "暂无"}
          </span>
          <span className="text-[10px] text-slate-400 font-medium block">持股市值跑赢成本最大月</span>
        </div>
      </div>

      {/* 4.3 ETF 资产配置以及收益来源 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie allocation */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <PieIcon className="w-4 h-4 text-blue-600" />
            ETF 持仓份额现市值占比
          </h3>

          <div className="flex items-center justify-between">
            <div className="h-32 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-1/2 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                  <span className="text-slate-600 font-mono font-bold">QQQM</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {totalAssets > 0 ? ((qqqValue / totalAssets) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
                  <span className="text-slate-600 font-mono font-bold">VOO</span>
                </div>
                <span className="font-mono font-bold text-slate-700">
                  {totalAssets > 0 ? ((vooValue / totalAssets) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
                账户市值：<br/>
                QQQM: {formatCurrency(qqqValue)}<br/>
                VOO: {formatCurrency(vooValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Yield Sources Breakdowns */}
        <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Award className="w-4 h-4 text-blue-600" />
            各标的单体盈利贡献
          </h3>

          <div className="space-y-3 text-xs">
            {/* QQQM */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 mb-2">
              <div className="flex justify-between font-bold">
                <span className="text-[#6366f1] font-mono">QQQM 纳斯达克100</span>
                <span className={qqqGain >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {qqqGain >= 0 ? "+" : ""}{formatCurrency(qqqGain)} ({qqqAvgCost > 0 ? formatPercent(qqqGainPct) : "0.00%"})
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-450 font-bold">
                <span>累计本金: {formatCurrency(qqqCost)}</span>
                <span>持股仓位: {qqqShares.toFixed(3)} 股</span>
              </div>
            </div>

            {/* VOO */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-[#0ea5e9] font-mono">VOO 标普500</span>
                <span className={vooGain >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  {vooGain >= 0 ? "+" : ""}{formatCurrency(vooGain)} ({vooAvgCost > 0 ? formatPercent(vooGainPct) : "0.00%"})
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-450 font-bold">
                <span>累计本金: {formatCurrency(vooCost)}</span>
                <span>持股仓位: {vooShares.toFixed(3)} 股</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
