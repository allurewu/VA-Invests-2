import React, { useState, useRef } from "react";
import { 
  Sliders, 
  Database, 
  Download, 
  Upload, 
  Check, 
  Info, 
  Globe, 
  RefreshCw,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  Award
} from "lucide-react";
import { AppSettings, InvestmentRecord, ValueAveragePlan } from "../types";

interface SettingsProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => Promise<any>;
  onExportData: () => void;
  onImportData: (jsonData: string) => Promise<boolean>;
  onResetDatabase: () => Promise<void>;
}

export default function Settings({
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetDatabase,
}: SettingsProps) {
  // Ratio inputs
  const [qqqmRatio, setQqqmRatio] = useState<number>(settings.qqqmRatio);
  const [vooRatio, setVooRatio] = useState<number>(settings.vooRatio);
  const [provider, setProvider] = useState<string>(settings.provider);

  // Status triggers
  const [successText, setSuccessText] = useState("");
  const [errorText, setErrorText] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle QQQM ratio slider changes (auto-balance VOO to ensure sum is exactly 100)
  const handleQqqmChange = (val: number) => {
    setQqqmRatio(val);
    setVooRatio(100 - val);
  };

  // Handle VOO ratio slider changes
  const handleVooChange = (val: number) => {
    setVooRatio(val);
    setQqqmRatio(100 - val);
  };

  const handleSaveRatios = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessText("");
    setErrorText("");

    if (qqqmRatio + vooRatio !== 100) {
      setErrorText("定投占比两者之和必须为 100%");
      return;
    }

    try {
      await onSaveSettings({
        qqqmRatio,
        vooRatio,
        provider,
      });
      setSuccessText("配置修改成功！今后的定投建议拆分将自动按此比例核算。");
    } catch (err: any) {
      setErrorText("保存配置出错: " + err.message);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessText("");
    setErrorText("");

    try {
      await onSaveSettings({
        qqqmRatio,
        vooRatio,
        provider,
      });
      setSuccessText("行情数据接口更新成功！");
    } catch (err: any) {
      setErrorText("保存配置出错: " + err.message);
    }
  };

  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const success = await onImportData(content);
        if (success) {
          setSuccessText("数据包导入并重载成功！全部 VA 计划、配置和历史账目已完全恢复。");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setErrorText("导入文件失败，不符合 VA Invest 备份模型");
        }
      } catch (err: any) {
        setErrorText("解析备份包失败: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleClearDatabase = async () => {
    if (confirm("⚠️ 警告：这将永久删除此系统的所有买入记录和 VA 计划！！！此操作不可逆！是否继续？")) {
      await onResetDatabase();
      setSuccessText("系统本地数据库已全部恢复出厂初始状态。");
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">设置</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          管理投资策略、数据源、AI服务及应用配置
        </p>
      </div>

      {successText && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{successText}</span>
        </div>
      )}

      {errorText && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-505" />
          <span>{errorText}</span>
        </div>
      )}

      {/* 5.1 ETF配置 Allocation Ratio slider */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 mb-4 space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>定投资产权重占比</span>
        </h2>

        <form onSubmit={handleSaveRatios} className="space-y-5">
          <div className="space-y-4">
            {/* QQQM Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-600 font-bold font-mono">QQQM 计划定投占比</span>
                <span className="font-mono font-bold text-blue-600 text-xs bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100/55">
                  {qqqmRatio}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={qqqmRatio}
                onChange={(e) => handleQqqmChange(parseInt(e.target.value))}
                className="w-full accent-blue-600 bg-slate-100 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* VOO Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-600 font-bold font-mono">VOO 计划定投占比</span>
                <span className="font-mono font-bold text-sky-600 text-xs bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100/55">
                  {vooRatio}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={vooRatio}
                onChange={(e) => handleVooChange(parseInt(e.target.value))}
                className="w-full accent-sky-500 bg-slate-100 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            id="save_settings_btn"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            保存权重比
          </button>
        </form>
      </div>

      {/* 5.2 行情数据接口 */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 mb-4 space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>行情数据接口</span>
        </h2>

        <form onSubmit={handleSaveProvider} className="space-y-4">
          <div className="space-y-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition animate-none"
            >
              <option value="Yahoo Finance">Yahoo Finance (推荐实时自动获取)</option>
              <option value="Fallback Static Mode">离线模式（静态静止价）</option>
            </select>
          </div>

          <button
            type="submit"
            id="save_provider_btn"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            保存接口
          </button>
        </form>
      </div>

      {/* 5.3 数据管理 Backup / Import Export */}
      <div className="bg-[#F3F3F3] border border-[#FFFFFF] rounded-2xl p-4 mt-0 mr-0 mb-0 ml-0 space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>账包导入导出与安全</span>
        </h2>



        <div className="grid grid-cols-3 gap-2 pt-0">
          {/* Export button */}
          <button
            onClick={onExportData}
            id="export_json_btn"
            className="py-2.5 bg-slate-50 border border-slate-200 hover:border-blue-500/30 text-slate-600 hover:text-blue-600 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            备份数据
          </button>

          {/* Import file and button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={triggerImport}
            id="import_json_btn"
            className="py-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-500/30 text-slate-600 hover:text-indigo-600 rounded-xl transition text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#194D43]" />
            恢复数据
          </button>

          {/* Database drop/factory restore */}
          <button
            onClick={handleClearDatabase}
            id="clear_database_btn"
            className="py-2.5 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-rose-500" />
            出厂归零
          </button>
        </div>
      </div>
    </div>
  );
}
