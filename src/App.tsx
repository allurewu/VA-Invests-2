import React, { useState, useEffect } from "react";
import { 
  RefreshCw,
  TrendingUp,
  Download,
  Upload,
  Layers,
  Coins
} from "lucide-react";
import { 
  getAllRecords, 
  getPlan, 
  getSettings, 
  addRecord, 
  updateRecord, 
  deleteRecord, 
  savePlan, 
  saveSettings 
} from "./lib/db";
import { InvestmentRecord, ValueAveragePlan, AppSettings, StockQuote, VixQuote } from "./types";
import Dashboard from "./components/Dashboard";
import Records from "./components/Records";
import Plan from "./components/Plan";
import Stats from "./components/Stats";
import Settings from "./components/Settings";

// Custom Navigation Icons (SVG implementations matching Iconly Light)
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Home"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    fill="none"
    {...props}
  >
    <g id="Iconly/Light/Home" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
      <g id="Home" transform="translate(2.500000, 2.000000)" stroke="currentColor" strokeWidth="2">
        <path d="M6.65721519,18.7714023 L6.65721519,15.70467 C6.65719744,14.9246392 7.29311743,14.2908272 8.08101266,14.2855921 L10.9670886,14.2855921 C11.7587434,14.2855921 12.4005063,14.9209349 12.4005063,15.70467 L12.4005063,15.70467 L12.4005063,18.7809263 C12.4003226,19.4432001 12.9342557,19.984478 13.603038,20 L15.5270886,20 C17.4451246,20 19,18.4606794 19,16.5618312 L19,16.5618312 L19,7.8378351 C18.9897577,7.09082692 18.6354747,6.38934919 18.0379747,5.93303245 L11.4577215,0.685301154 C10.3049347,-0.228433718 8.66620456,-0.228433718 7.51341772,0.685301154 L0.962025316,5.94255646 C0.362258604,6.39702249 0.00738668938,7.09966612 0,7.84735911 L0,16.5618312 C0,18.4606794 1.55487539,20 3.47291139,20 L5.39696203,20 C6.08235439,20 6.63797468,19.4499381 6.63797468,18.7714023 L6.63797468,18.7714023"></path>
      </g>
    </g>
  </svg>
);

const PaperIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Paper"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    fill="none"
    {...props}
  >
    <g id="Iconly/Light/Paper" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
      <g id="Paper" transform="translate(3.500000, 2.000000)" stroke="currentColor" strokeWidth="2">
        <path d="M11.2378,0.761771171 L4.5848,0.761771171 C2.5048,0.7538 0.7998,2.4118 0.7508,4.4908 L0.7508,15.2038 C0.7048,17.3168 2.3798,19.0678 4.4928,19.1148 C4.5238,19.1148 4.5538,19.1158 4.5848,19.1148 L12.5738,19.1148 C14.6678,19.0298 16.3178,17.2998 16.3029015,15.2038 L16.3029015,6.0378 L11.2378,0.761771171 Z" id="Stroke-1"></path>
        <path d="M10.9751,0.75 L10.9751,3.659 C10.9751,5.079 12.1231,6.23 13.5431,6.234 L16.2981,6.234" id="Stroke-3"></path>
        <line x1="10.7881" y1="13.3585" x2="5.3881" y2="13.3585" id="Stroke-5"></line>
        <line x1="8.7432" y1="9.606" x2="5.3872" y2="9.606" id="Stroke-7"></line>
      </g>
    </g>
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Calendar"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g id="Iconly/Light-Outline/Calendar" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd">
      <g id="Calendar" transform="translate(2.000000, 1.000000)" fill="currentColor">
        <path d="M13.7935,-6.03961325e-14 C14.2075,-6.03961325e-14 14.5435,0.336 14.5435,0.75 L14.54396,1.59781054 C16.0040654,1.69791596 17.2167254,2.19804662 18.075,3.0581 C19.012,3.9991 19.505,5.3521 19.5000377,6.9751 L19.5000377,16.0981 C19.5000377,19.4301 17.384,21.5001 13.979,21.5001 L5.521,21.5001 C2.116,21.5001 0,19.4011 0,16.0221 L0,6.9731 C0,3.83029205 1.88705568,1.8129398 4.96468634,1.59815387 L4.9653,0.75 C4.9653,0.336 5.3013,-6.03961325e-14 5.7153,-6.03961325e-14 C6.1293,-6.03961325e-14 6.4653,0.336 6.4653,0.75 L6.465,1.579 L13.043,1.579 L13.0435,0.75 C13.0435,0.336 13.3795,-6.03961325e-14 13.7935,-6.03961325e-14 Z M18,8.904 L1.5,8.904 L1.5,16.0221 C1.5,18.5881 2.928,20.0001 5.521,20.0001 L13.979,20.0001 C16.572,20.0001 18.0000357,18.6141 18.0000357,16.0981 L18,8.904 Z M14.2012,15.1963 C14.6152,15.1963 14.9512,15.5323 14.9512,15.9463 C14.9512,16.3603 14.6152,16.6963 14.2012,16.6963 C13.7872,16.6963 13.4472,16.3603 13.4472,15.9463 C13.4472,15.5323 13.7782,15.1963 14.1922,15.1963 L14.2012,15.1963 Z M9.7637,15.1963 C10.1777,15.1963 10.5137,15.5323 10.5137,15.9463 C10.5137,16.3603 10.1777,16.6963 9.7637,16.6963 C9.3497,16.6963 9.0097,16.3603 9.0097,15.9463 C9.0097,15.5323 9.3407,15.1963 9.7547,15.1963 L9.7637,15.1963 Z M5.3169,15.1963 C5.7309,15.1963 6.0669,15.5323 6.0669,15.9463 C6.0669,16.3603 5.7309,16.6963 5.3169,16.6963 C4.9029,16.6963 4.5619,16.3603 4.5619,15.9463 C4.5619,15.5323 4.8939,15.1963 5.3079,15.1963 L5.3169,15.1963 Z M14.2012,11.3096 C14.6152,11.3096 14.9512,11.6456 14.9512,12.0596 C14.9512,12.4736 14.6152,12.8096 14.2012,12.8096 C13.7872,12.8096 13.4472,12.4736 13.4472,12.0596 C13.4472,11.6456 13.7782,11.3096 14.1922,11.3096 L14.2012,11.3096 Z M9.7637,11.3096 C10.1777,11.3096 10.5137,11.6456 10.5137,12.0596 C10.5137,12.4736 10.1777,12.8096 9.7637,12.8096 C9.3497,12.8096 9.0097,12.4736 9.0097,12.0596 C9.0097,11.6456 9.3407,11.3096 9.7547,11.3096 L9.7637,11.3096 Z M5.3169,11.3096 C5.7309,11.3096 6.0669,11.6456 6.0669,12.0596 C6.0669,12.4736 5.7309,12.8096 5.3169,12.8096 C4.9029,12.8096 4.5619,12.4736 4.5619,12.0596 C4.5619,11.6456 4.8939,11.3096 5.3079,11.3096 L5.3169,11.3096 Z M13.043,3.079 L6.465,3.079 L6.4653,4.041 C6.4653,4.455 6.1293,4.791 5.7153,4.791 C5.3013,4.791 4.9653,4.455 4.9653,4.041 L4.96476779,3.10170243 C2.72453716,3.2898928 1.5,4.64785567 1.5,6.9731 L1.5,7.404 L18,7.404 L18.0000357,6.9731 C18.004,5.7381 17.672,4.7781 17.013,4.1181 C16.4345144,3.53790796 15.5888563,3.19140086 14.5443509,3.10218199 L14.5435,4.041 C14.5435,4.455 14.2075,4.791 13.7935,4.791 C13.3795,4.791 13.0435,4.455 13.0435,4.041 L13.043,3.079 Z" id="Combined-Shape"></path>
      </g>
    </g>
  </svg>
);

const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Activity"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    fill="none"
    {...props}
  >
    <g id="Iconly/Light/Activity" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
      <g id="Activity" transform="translate(2.000000, 1.500000)" stroke="currentColor" strokeWidth="2">
        <polyline id="Path_33966" points="5.24485128 13.2814646 8.23798631 9.39130439 11.652174 12.0732266 14.5812358 8.29290622"></polyline>
        <circle id="Ellipse_741" cx="17.9954234" cy="2.70022885" r="1.92219681"></circle>
        <path d="M12.9244852,1.62013731 L5.6567506,1.62013731 C2.64530894,1.62013731 0.778032041,3.75286043 0.778032041,6.76430209 L0.778032041,14.846682 C0.778032041,17.8581237 2.60869567,19.9816935 5.6567506,19.9816935 L14.2608696,19.9816935 C17.2723113,19.9816935 19.1395882,17.8581237 19.1395882,14.846682 L19.1395882,7.80778036" id="Path"></path>
      </g>
    </g>
  </svg>
);

const SettingIconComp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    id="Setting"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    fill="none"
    {...props}
  >
    <g id="Iconly/Light/Setting" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
      <g id="Setting" transform="translate(2.500000, 1.500000)" stroke="currentColor" strokeWidth="1.5">
        <path d="M18.3066362,6.12356982 L17.6842106,5.04347829 C17.1576365,4.12955711 15.9906873,3.8142761 15.0755149,4.33867279 L15.0755149,4.33867279 C14.6398815,4.59529992 14.1200613,4.66810845 13.6306859,4.54104256 C13.1413105,4.41397667 12.7225749,4.09747295 12.4668193,3.66132725 C12.3022855,3.38410472 12.2138742,3.06835005 12.2105264,2.74599544 L12.2105264,2.74599544 C12.2253694,2.22917739 12.030389,1.72835784 11.6700024,1.3576252 C11.3096158,0.986892553 10.814514,0.777818938 10.2974829,0.778031878 L9.04347831,0.778031878 C8.53694532,0.778031878 8.05129106,0.97987004 7.69397811,1.33890085 C7.33666515,1.69793166 7.13715288,2.18454839 7.13958814,2.69107553 L7.13958814,2.69107553 C7.12457503,3.73688099 6.27245786,4.57676682 5.22654465,4.57665906 C4.90419003,4.57331126 4.58843537,4.48489995 4.31121284,4.32036615 L4.31121284,4.32036615 C3.39604054,3.79596946 2.22909131,4.11125048 1.70251717,5.02517165 L1.03432495,6.12356982 C0.508388616,7.03634945 0.819378585,8.20256183 1.72997713,8.73226549 L1.72997713,8.73226549 C2.32188101,9.07399614 2.68650982,9.70554694 2.68650982,10.3890161 C2.68650982,11.0724852 2.32188101,11.704036 1.72997713,12.0457667 L1.72997713,12.0457667 C0.820534984,12.5718952 0.509205679,13.7352837 1.03432495,14.645309 L1.03432495,14.645309 L1.6659039,15.7345539 C1.9126252,16.1797378 2.3265816,16.5082503 2.81617164,16.6473969 C3.30576167,16.7865435 3.83061824,16.7248517 4.27459956,16.4759726 L4.27459956,16.4759726 C4.71105863,16.2212969 5.23116727,16.1515203 5.71931837,16.2821523 C6.20746948,16.4127843 6.62321383,16.7330005 6.87414191,17.1716248 C7.03867571,17.4488473 7.12708702,17.764602 7.13043482,18.0869566 L7.13043482,18.0869566 C7.13043482,19.1435014 7.98693356,20.0000001 9.04347831,20.0000001 L10.2974829,20.0000001 C11.3504633,20.0000001 12.2054882,19.1490783 12.2105264,18.0961099 L12.2105264,18.0961099 C12.2080776,17.5879925 12.4088433,17.0999783 12.7681408,16.7406809 C13.1274382,16.3813834 13.6154524,16.1806176 14.1235699,16.1830664 C14.4451523,16.1916732 14.7596081,16.2797208 15.0389017,16.4393593 L15.0389017,16.4393593 C15.9516813,16.9652957 17.1178937,16.6543057 17.6475973,15.7437072 L17.6475973,15.7437072 L18.3066362,14.645309 C18.5617324,14.2074528 18.6317479,13.6859659 18.5011783,13.1963297 C18.3706086,12.7066935 18.0502282,12.2893121 17.6109841,12.0366133 L17.6109841,12.0366133 C17.17174,11.7839145 16.8513595,11.3665332 16.7207899,10.876897 C16.5902202,10.3872608 16.6602358,9.86577384 16.9153319,9.42791767 C17.0812195,9.13829096 17.3213574,8.89815312 17.6109841,8.73226549 L17.6109841,8.73226549 C18.5161253,8.20284891 18.8263873,7.04344892 18.3066362,6.13272314 L18.3066362,6.13272314 L18.3066362,6.12356982 Z" id="Path_33946"></path>
        <circle id="Ellipse_737" cx="9.67505726" cy="10.3890161" r="2.63615562"></circle>
      </g>
    </g>
  </svg>
);

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "records" | "plan" | "stats" | "settings">("dashboard");

  // Shared Data States
  const [records, setRecords] = useState<InvestmentRecord[]>([]);
  const [plan, setPlan] = useState<ValueAveragePlan | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ qqqmRatio: 70, vooRatio: 30, provider: "Yahoo Finance" });
  const [quotes, setQuotes] = useState<Record<"QQQM" | "VOO", StockQuote | null>>({
    QQQM: {
      symbol: "QQQM",
      price: 224.50,
      prevClose: 224.00,
      change: 0.5,
      changePercent: 0.22,
      timestamp: Date.now(),
      isFallback: true
    },
    VOO: {
      symbol: "VOO",
      price: 542.80,
      prevClose: 544.10,
      change: -1.3,
      changePercent: -0.24,
      timestamp: Date.now(),
      isFallback: true
    }
  });
  const [vix, setVix] = useState<VixQuote | null>({
    price: 15.42,
    prevClose: 15.60,
    change: -0.18,
    changePercent: -1.15,
    timestamp: Date.now(),
    isFallback: true
  });
  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(false);
  
  // Transition / Prefills state from dashboard click to record screen
  const [prefills, setPrefills] = useState<{ qqqmAmount: number; vooAmount: number } | null>(null);

  // Initial Load from IndexedDB
  const loadData = async () => {
    try {
      const recs = await getAllRecords();
      const pl = await getPlan();
      const sett = await getSettings();
      
      setRecords(recs);
      setPlan(pl);
      setSettings(sett);
    } catch (e) {
      console.error("Failed to load initial data from IndexedDB", e);
    }
  };

  // Fetch Quotes helper (calls Express API router proxy)
  const fetchQuotes = async () => {
    if (settings.provider === "Fallback Static Mode") {
      // Simulate prices when requested offline or in static model
      setQuotes({
        QQQM: {
          symbol: "QQQM",
          price: 224.50,
          prevClose: 224.00,
          change: 0.5,
          changePercent: 0.22,
          timestamp: Date.now(),
          isFallback: true
        },
        VOO: {
          symbol: "VOO",
          price: 542.80,
          prevClose: 544.10,
          change: -1.3,
          changePercent: -0.24,
          timestamp: Date.now(),
          isFallback: true
        }
      });
      setVix({
        price: 15.42,
        prevClose: 15.60,
        change: -0.18,
        changePercent: -1.15,
        timestamp: Date.now(),
        isFallback: true
      });
      return;
    }

    const fetchWithTimeout = async (url: string, timeoutMs: number = 1500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        return null;
      }
    };

    setLoadingQuotes(true);
    try {
      const [resQQQM, resVOO, resVix] = await Promise.all([
        fetchWithTimeout("/api/quote?symbol=QQQM", 1500),
        fetchWithTimeout("/api/quote?symbol=VOO", 1500),
        fetchWithTimeout("/api/vix", 1500)
      ]);

      const dataQQQM = (resQQQM && resQQQM.ok) ? await resQQQM.json().catch(() => null) : null;
      const dataVOO = (resVOO && resVOO.ok) ? await resVOO.json().catch(() => null) : null;
      const dataVix = (resVix && resVix.ok) ? await resVix.json().catch(() => null) : null;

      const fallbackQQQM: StockQuote = {
        symbol: "QQQM",
        price: 224.50,
        prevClose: 224.00,
        change: 0.5,
        changePercent: 0.22,
        timestamp: Date.now(),
        isFallback: true
      };

      const fallbackVOO: StockQuote = {
        symbol: "VOO",
        price: 542.80,
        prevClose: 544.10,
        change: -1.3,
        changePercent: -0.24,
        timestamp: Date.now(),
        isFallback: true
      };

      const fallbackVix: VixQuote = {
        price: 15.42,
        prevClose: 15.60,
        change: -0.18,
        changePercent: -1.15,
        timestamp: Date.now(),
        isFallback: true
      };

      setQuotes({
        QQQM: dataQQQM || fallbackQQQM,
        VOO: dataVOO || fallbackVOO
      });
      setVix(dataVix || fallbackVix);
    } catch (err) {
      console.error("Error fetching live rates from Express Quote API", err);
      
      const fallbackQQQM: StockQuote = {
        symbol: "QQQM",
        price: 224.50,
        prevClose: 224.00,
        change: 0.5,
        changePercent: 0.22,
        timestamp: Date.now(),
        isFallback: true
      };

      const fallbackVOO: StockQuote = {
        symbol: "VOO",
        price: 542.80,
        prevClose: 544.10,
        change: -1.3,
        changePercent: -0.24,
        timestamp: Date.now(),
        isFallback: true
      };

      const fallbackVix: VixQuote = {
        price: 15.42,
        prevClose: 15.60,
        change: -0.18,
        changePercent: -1.15,
        timestamp: Date.now(),
        isFallback: true
      };

      setQuotes(prev => ({
        QQQM: prev.QQQM || fallbackQQQM,
        VOO: prev.VOO || fallbackVOO
      }));
      setVix(prev => prev || fallbackVix);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch live prices whenever provider settings or initial load happens
  useEffect(() => {
    fetchQuotes();
    // Auto refresh every 5 mins
    const interval = setInterval(fetchQuotes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.provider]);

  // Operations: Records
  const handleAddRecord = async (newRecord: InvestmentRecord) => {
    await addRecord(newRecord);
    await loadData();
  };

  const handleUpdateRecord = async (updatedRecord: InvestmentRecord) => {
    await updateRecord(updatedRecord);
    await loadData();
  };

  const handleDeleteRecord = async (id: number) => {
    await deleteRecord(id);
    await loadData();
  };

  // Operations: Plan
  const handleSavePlan = async (newPlan: ValueAveragePlan) => {
    await savePlan(newPlan);
    await loadData();
  };

  // Operations: Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    await saveSettings(newSettings);
    // Explicitly update local settings immediately so dependencies reload
    setSettings(newSettings);
    await loadData();
  };

  // Operations: Data management export / import
  const handleExportData = () => {
    const backup = {
      app: "VA Invest",
      version: "1.0.0",
      timestamp: Date.now(),
      plan,
      settings,
      records
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `va_invest_backup_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (jsonData: string): Promise<boolean> => {
    try {
      const backup = JSON.parse(jsonData);
      if (backup.app !== "VA Invest") {
        return false;
      }

      // Restore Plan
      if (backup.plan) {
        await savePlan(backup.plan);
      }

      // Restore Settings
      if (backup.settings) {
        await saveSettings(backup.settings);
      }

      // Restore Records
      if (backup.records && Array.isArray(backup.records)) {
        // Clear existing records first
        const currentRecords = await getAllRecords();
        for (const r of currentRecords) {
          if (r.id !== undefined) {
             await deleteRecord(r.id);
          }
        }

        // Add imported records
        for (const r of backup.records) {
          await addRecord(r);
        }
      }

      await loadData();
      return true;
    } catch (err) {
      console.error("Failed to parse or restore backup bundle", err);
      return false;
    }
  };

  const handleResetDatabase = async () => {
    // Drop all entries
    const currentRecords = await getAllRecords();
    for (const r of currentRecords) {
      if (r.id !== undefined) {
        await deleteRecord(r.id);
      }
    }
    
    // Clear Plan
    const db = await indexedDB.open("VA_INVEST_DB");
    db.onsuccess = () => {
      const d = db.result;
      const t = d.transaction(["plan", "settings"], "readwrite");
      t.objectStore("plan").clear();
      t.objectStore("settings").clear();
    };

    // Delay slight loading and rebuild
    setTimeout(async () => {
      setPlan(null);
      setSettings({ qqqmRatio: 70, vooRatio: 30, provider: "Yahoo Finance" });
      setRecords([]);
      await loadData();
    }, 500);
  };

  // Seamless Quick records trigger
  const handleQuickRecord = (suggestedRatios: { qqqmAmount: number; vooAmount: number }) => {
    setPrefills(suggestedRatios);
    setActiveTab("records");
  };

  return (
    <div className="min-h-screen bg-[#EBEBEB] text-slate-800 flex flex-col font-sans select-none antialiased">
      {/* Main viewport Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] z-10 overflow-x-hidden">
        {activeTab === "dashboard" && (
          <Dashboard
            records={records}
            plan={plan}
            settings={settings}
            quotes={quotes}
            vix={vix}
            loadingQuotes={loadingQuotes}
            onRefreshQuotes={fetchQuotes}
            onQuickRecord={handleQuickRecord}
            onNavigateToPlan={() => setActiveTab("plan")}
          />
        )}

        {activeTab === "records" && (
          <Records
            records={records}
            quotes={quotes}
            prefills={prefills}
            onClearPrefills={() => setPrefills(null)}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === "plan" && (
          <Plan
            plan={plan}
            settings={settings}
            records={records}
            quotes={quotes}
            onSavePlan={handleSavePlan}
          />
        )}

        {activeTab === "stats" && (
          <Stats
            records={records}
            plan={plan}
            quotes={quotes}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* 5 Bottom Tabs Navigation (Pinned responsive mobile bar) */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#F3F3F3]/90 backdrop-blur-xl border-t border-[#FFFFFF] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 max-w-md mx-auto rounded-t-3xl">
        <div className="flex justify-around items-center">
          {/* Tab 1: 首页 */}
          <button
            onClick={() => setActiveTab("dashboard")}
            id="tab_home_btn"
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "dashboard" ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <HomeIcon className="w-4.5 h-4.5" />
            <span className="text-[10px]">首页</span>
          </button>

          {/* Tab 2: 记录 */}
          <button
            onClick={() => setActiveTab("records")}
            id="tab_records_btn"
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "records" ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {prefills && (
              <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
            )}
            <PaperIcon className="w-4.5 h-4.5" />
            <span className="text-[10px]">定投记录</span>
          </button>

          {/* Tab 3: VA 计划 */}
          <button
            onClick={() => setActiveTab("plan")}
            id="tab_plan_btn"
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "plan" ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5" />
            <span className="text-[10px]">VA计划</span>
          </button>

          {/* Tab 4: 统计 */}
          <button
            onClick={() => setActiveTab("stats")}
            id="tab_stats_btn"
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "stats" ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ActivityIcon className="w-4.5 h-4.5" />
            <span className="text-[10px]">数据分析</span>
          </button>

          {/* Tab 5: 设置 */}
          <button
            onClick={() => setActiveTab("settings")}
            id="tab_settings_btn"
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "settings" ? "text-blue-600 bg-blue-50 font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <SettingIconComp className="w-4.5 h-4.5" />
            <span className="text-[10px]">设置</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
