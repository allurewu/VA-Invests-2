import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Tag, 
  DollarSign, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Plus, 
  Zap,
  Info,
  Sliders,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import { InvestmentRecord, StockQuote } from "../types";
import { formatCurrency } from "../utils";

interface RecordsProps {
  records: InvestmentRecord[];
  quotes: Record<"QQQM" | "VOO", StockQuote | null>;
  prefills: { qqqmAmount: number; vooAmount: number } | null;
  onClearPrefills: () => void;
  onAddRecord: (record: InvestmentRecord) => Promise<any>;
  onUpdateRecord: (record: InvestmentRecord) => Promise<any>;
  onDeleteRecord: (id: number) => Promise<any>;
}

export default function Records({
  records,
  quotes,
  prefills,
  onClearPrefills,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}: RecordsProps) {
  // Tabs for Filtering History
  const [filterTab, setFilterTab] = useState<"ALL" | "QQQM" | "VOO">("ALL");

  // Input Form State
  const [date, setDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [symbol, setSymbol] = useState<"QQQM" | "VOO">("QQQM");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [shares, setShares] = useState<string>("");
  const [isManualShares, setIsManualShares] = useState<boolean>(false);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Notice/Status triggers
  const [errorText, setErrorText] = useState<string>("");
  const [successText, setSuccessText] = useState<string>("");

  // Populate actual Yahoo prices when symbol or quotes change
  const applyLivePrice = () => {
    const livePrice = quotes[symbol]?.price;
    if (livePrice) {
      setPrice(livePrice.toFixed(3));
      setErrorText("");
    } else {
      setErrorText(`暂无 ${symbol} 实时价格，请手动输入或重试刷新`);
    }
  };

  // Autocalculate shares: shares = amount / price
  useEffect(() => {
    if (!isManualShares) {
      const p = parseFloat(price);
      const a = parseFloat(amount);
      if (p > 0 && a > 0) {
        setShares((a / p).toFixed(3));
      } else {
        setShares("");
      }
    }
  }, [price, amount, isManualShares]);

  // Handle direct preset from Prefills (Dashboard VA button)
  const applyPrefill = (targetSymbol: "QQQM" | "VOO", targetAmount: number) => {
    setSymbol(targetSymbol);
    setAmount(targetAmount.toFixed(2));
    const livePrice = quotes[targetSymbol]?.price;
    if (livePrice) {
      setPrice(livePrice.toFixed(3));
    } else {
      setPrice("");
    }
    setIsManualShares(false);
  };

  const handleBulkPrefillRecord = async () => {
    if (!prefills) return;
    try {
      let loggedCount = 0;
      
      // Add QQQM if amount > 0
      if (prefills.qqqmAmount > 0) {
        const qPrice = quotes.QQQM?.price || 224.5;
        const qShares = prefills.qqqmAmount / qPrice;
        await onAddRecord({
          date,
          symbol: "QQQM",
          price: qPrice,
          amount: prefills.qqqmAmount,
          shares: qShares
        });
        loggedCount++;
      }

      // Add VOO if amount > 0
      if (prefills.vooAmount > 0) {
        const vPrice = quotes.VOO?.price || 542.8;
        const vShares = prefills.vooAmount / vPrice;
        await onAddRecord({
          date,
          symbol: "VOO",
          price: vPrice,
          amount: prefills.vooAmount,
          shares: vShares
        });
        loggedCount++;
      }

      setSuccessText(`成功一键记录本月定投：${loggedCount} 个标的已自动入账！`);
      onClearPrefills();
      
      // Clear inputs
      setAmount("");
      setPrice("");
      setShares("");
    } catch (err: any) {
      setErrorText("一键登记定投失败：" + err.message);
    }
  };

  // Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    const p = parseFloat(price);
    const a = parseFloat(amount);
    const s = parseFloat(shares);

    if (isNaN(p) || p <= 0) {
      setErrorText("请输入有效的买入股价");
      return;
    }
    if (isNaN(a) || a <= 0) {
      setErrorText("请输入有效的投入金额");
      return;
    }
    if (isNaN(s) || s <= 0) {
      setErrorText("请输入或换算有效的买入股数");
      return;
    }

    const payload: InvestmentRecord = {
      date,
      symbol,
      price: p,
      amount: a,
      shares: s
    };

    try {
      if (editingId !== null) {
        // Update
        await onUpdateRecord({ ...payload, id: editingId });
        setSuccessText("记录修改成功");
        setEditingId(null);
      } else {
        // Add
        await onAddRecord(payload);
        setSuccessText("记录添加成功");
      }

      // Reset form
      setAmount("");
      setPrice("");
      setShares("");
      setIsManualShares(false);
    } catch (err: any) {
      setErrorText("保存记录出错: " + err.message);
    }
  };

  const startEdit = (record: InvestmentRecord) => {
    if (!record.id) return;
    setEditingId(record.id);
    setDate(record.date);
    setSymbol(record.symbol);
    setPrice(record.price.toString());
    setAmount(record.amount.toString());
    setShares(record.shares.toString());
    setIsManualShares(true);
    setErrorText("");
    setSuccessText("");
    
    // Scroll to form smoothly
    const formEl = document.getElementById("record0_form_top");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setPrice("");
    setShares("");
    setIsManualShares(false);
    setErrorText("");
  };

  const filteredRecords = records.filter(r => {
    if (filterTab === "ALL") return true;
    return r.symbol === filterTab;
  });

  return (
    <div className="space-y-5 pb-24">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">定投记账</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">登记或拆分历史买入明细，自平衡仓位成本核算</p>
      </div>

      {/* VA Suggestions banner - Clean banner */}
      {prefills && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600/10" />
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide">已载入 VA 建议定投数据</h3>
            </div>
            <button 
              onClick={onClearPrefills}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            系统已自动拆分：本月建议定投 
            {prefills.qqqmAmount > 0 && <span className="font-mono font-bold text-blue-600"> QQQM {formatCurrency(prefills.qqqmAmount)}</span>}
            {prefills.qqqmAmount > 0 && prefills.vooAmount > 0 && " 和 "}
            {prefills.vooAmount > 0 && <span className="font-mono font-bold text-blue-600"> VOO {formatCurrency(prefills.vooAmount)}</span>}。
          </p>

          <div className="flex gap-2 text-xs">
            <button
              onClick={handleBulkPrefillRecord}
              className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              一键快速记账
            </button>
            <div className="flex gap-1.5">
              {prefills.qqqmAmount > 0 && (
                <button
                  onClick={() => applyPrefill("QQQM", prefills.qqqmAmount)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg hover:border-blue-500/30 transition cursor-pointer text-[11px] font-bold"
                >
                  试填 QQQM
                </button>
              )}
              {prefills.vooAmount > 0 && (
                <button
                  onClick={() => applyPrefill("VOO", prefills.vooAmount)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-lg hover:border-blue-500/30 transition cursor-pointer text-[11px] font-bold"
                >
                  试填 VOO
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 2.1 添加记录 Form Card */}
      <div id="record0_form_top" className="bg-[#F3F3F3] rounded-2xl border border-[#FFFFFF] p-5 space-y-4 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {editingId !== null ? `编辑买入记录 - ID ${editingId}` : "登记买入量"}
          </span>
          <span className="text-[10px] text-slate-400 font-bold font-mono">IndexedDB沙箱</span>
        </div>

        {errorText && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successText}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-500" />
                买入日期
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Target ETF Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-blue-500" />
                选择标的
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSymbol("QQQM")}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    symbol === "QQQM"
                      ? "bg-blue-50 border-blue-600 text-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                  }`}
                >
                  QQQM
                </button>
                <button
                  type="button"
                  onClick={() => setSymbol("VOO")}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    symbol === "VOO"
                      ? "bg-blue-50 border-blue-600 text-blue-600"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800"
                  }`}
                >
                  VOO
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 投入金额 */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-blue-500" />
                投入金额
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="例如: 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>

            {/* 买入股价 */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-blue-500" />
                  买入价格
                </span>
                <button
                  type="button"
                  onClick={applyLivePrice}
                  className="text-[10px] text-blue-600 font-bold uppercase hover:underline cursor-pointer"
                >
                  录入实时价
                </button>
              </label>
              <input
                type="number"
                step="0.001"
                required
                placeholder="例如: 220.150"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>

          {/* Shares automatic calculation / manual override */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-500" />
                买入股数
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  id="manual_share_toggle"
                  checked={isManualShares}
                  onChange={(e) => setIsManualShares(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="manual_share_toggle" className="text-[10px] text-slate-400 font-bold cursor-pointer selection:bg-transparent">
                  手动微调股数
                </label>
              </div>
            </div>
            <input
              type="number"
              step="0.001"
              required
              disabled={!isManualShares}
              placeholder={isManualShares ? "手工录入精准股数量" : "根据上述投资额和市价自动精确换算..."}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-mono transition ${
                isManualShares 
                  ? "bg-white border-blue-500 text-slate-800" 
                  : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              id="save_record_btn"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition duration-150 active:scale-[0.98] cursor-pointer"
            >
              {editingId !== null ? "保存记录修改" : "确认该笔入账"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2.2 历史记录列表 Container */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">投资明细档案</h2>
          <span className="text-[10px] text-slate-400 font-bold font-mono">共 {records.length} 笔明细</span>
        </div>

        {/* Filters Tabs QQQM / VOO / ALL */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === "ALL" 
                ? "bg-white text-slate-850" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilterTab("QQQM")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === "QQQM" 
                ? "bg-white text-slate-850" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            QQQM
          </button>
          <button
            onClick={() => setFilterTab("VOO")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterTab === "VOO" 
                ? "bg-white text-slate-850" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            VOO
          </button>
        </div>

        {/* History items */}
        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#FFFFFF] bg-[#F3F3F3] w-full p-8 text-center text-slate-400 text-xs font-medium">
            暂无此过滤条件下的投资账目。请在上方登记开始首笔记录。
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((r) => {
              const livePrice = quotes[r.symbol]?.price;
              const assetReturn = livePrice ? (livePrice - r.price) * r.shares : 0;
              const returnPct = livePrice ? ((livePrice - r.price) / r.price) * 100 : 0;

              return (
                <div 
                  key={r.id} 
                  className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 flex justify-between items-center transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide font-mono ${
                        r.symbol === "QQQM" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-sky-50 text-sky-600 border border-sky-100"
                      }`}>
                        {r.symbol}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold font-mono">{r.date}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <div>
                        <span>投入额: </span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(r.amount)}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <div>
                        <span>成交均价: </span>
                        <span className="font-mono text-slate-800">${r.price.toFixed(3)}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-bold font-mono">
                      成交份额: <span className="text-slate-600 font-extrabold">{r.shares.toFixed(3)} 股</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Live unrealized return estimate for this single lot */}
                    {livePrice && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">此单即时估盈</span>
                        <span className={`text-[10px] font-mono font-bold ${assetReturn >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {assetReturn >= 0 ? "+" : ""}{assetReturn.toFixed(2)} ({returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%)
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-1.5 bg-slate-50 border border-slate-250 hover:border-blue-500/30 text-slate-500 hover:text-blue-600 rounded-lg transition cursor-pointer"
                        title="编辑"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (r.id && confirm("确认要永久删除这笔定投买入明细吗？")) {
                            onDeleteRecord(r.id);
                          }
                        }}
                        className="p-1.5 bg-slate-50 border border-slate-250 hover:border-rose-500/30 text-slate-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
