import { InvestmentRecord, ValueAveragePlan, AppSettings } from "../types";

const DB_NAME = "VA_INVEST_DB";
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store 1: Records of user trades
      if (!db.objectStoreNames.contains("records")) {
        const recordStore = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
        recordStore.createIndex("symbol", "symbol", { unique: false });
        recordStore.createIndex("date", "date", { unique: false });
      }

      // Store 2: Plan configurations
      if (!db.objectStoreNames.contains("plan")) {
        db.createObjectStore("plan", { keyPath: "key" });
      }

      // Store 3: Settings configurations
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
  });
}

// Help methods for Records
export async function getAllRecords(): Promise<InvestmentRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("records", "readonly");
      const store = transaction.objectStore("records");
      const request = store.getAll();

      request.onsuccess = () => {
        const data = request.result as InvestmentRecord[];
        // Sort records by date descending by default (most recent first)
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(data);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error in getAllRecords:", error);
    return [];
  }
}

export async function addRecord(record: InvestmentRecord): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("records", "readwrite");
    const store = transaction.objectStore("records");
    // Ensure id is omit on ADD if it's undefined
    const cleanRecord = { ...record };
    if (cleanRecord.id === undefined) {
      delete cleanRecord.id;
    }
    const request = store.add(cleanRecord);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecord(record: InvestmentRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("records", "readwrite");
    const store = transaction.objectStore("records");
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteRecord(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("records", "readwrite");
    const store = transaction.objectStore("records");
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Help methods for Plan configuration
export async function getPlan(): Promise<ValueAveragePlan | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("plan", "readonly");
      const store = transaction.objectStore("plan");
      const request = store.get("profile");

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error in getPlan:", error);
    return null;
  }
}

export async function savePlan(plan: ValueAveragePlan): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("plan", "readwrite");
    const store = transaction.objectStore("plan");
    const request = store.put({ key: "profile", data: plan });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Help methods for Settings configuration
export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("settings", "readonly");
      const store = transaction.objectStore("settings");
      const request = store.get("config");

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          // Default settings
          resolve({ qqqmRatio: 70, vooRatio: 30, provider: "Yahoo Finance" });
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("IndexedDB error in getSettings, returning defaults:", error);
    return { qqqmRatio: 70, vooRatio: 30, provider: "Yahoo Finance" };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("settings", "readwrite");
    const store = transaction.objectStore("settings");
    const request = store.put({ key: "config", data: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
