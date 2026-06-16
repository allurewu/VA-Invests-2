import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Prevent browser caching in preview environments to ensure updates are visible immediately
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Robust CNBC fallback for live stock quotes
  async function fetchCNBCFallback(symbol: string): Promise<{ price: number; prevClose: number }> {
    let cnbcSymbol = symbol;
    if (symbol === "%5EVIX" || symbol === "^VIX") {
      cnbcSymbol = ".VIX";
    }

    const url = `https://quote.cnbc.com/quote-html-webservice/quote.htm?symbols=${cnbcSymbol}&output=json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`CNBC responded with status ${response.status}`);
    }

    const data: any = await response.json();
    const quote = data?.QuickQuoteResult?.QuickQuote;
    
    const item = Array.isArray(quote) 
      ? quote.find((q: any) => q.symbol === cnbcSymbol)
      : (quote?.symbol === cnbcSymbol ? quote : null);

    if (!item) {
      throw new Error(`No quote found in CNBC response for ${cnbcSymbol}`);
    }

    const price = parseFloat(item.last);
    const change = parseFloat(item.change || "0");
    const prevClose = price - change;

    if (isNaN(price) || isNaN(prevClose)) {
      throw new Error("Invalid pricing information in CNBC response");
    }

    return { price, prevClose };
  }

  // Robust chart fetching with AbortController timeout and URL failover running in parallel
  async function fetchChartWithFallback(symbol: string): Promise<{ price: number; prevClose: number }> {
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`
    ];

    const fetchWithTimeout = async (url: string): Promise<{ price: number; prevClose: number }> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // Robust 6-second timeout per attempt

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "Origin": "https://finance.yahoo.com",
            "Referer": "https://finance.yahoo.com/"
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Yahoo Finance responded with status ${response.status}`);
        }

        const data: any = await response.json();
        const result = data?.chart?.result?.[0];
        if (!result) {
          throw new Error("No chart result found");
        }

        const meta = result.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;

        if (price === undefined || prevClose === undefined) {
          throw new Error("Price metadata missing in Yahoo response");
        }

        return { price, prevClose };
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      // Race both query1 and query2 concurrently - whichever returns first wins!
      return await Promise.any(urls.map(url => fetchWithTimeout(url)));
    } catch (err: any) {
      console.warn(`Parallel Yahoo fetch failed for ${symbol}:`, err.message || err, "Attempting CNBC live fallback...");
      try {
        return await fetchCNBCFallback(symbol);
      } catch (fallbackErr: any) {
        console.error(`CNBC fallback also failed for ${symbol}:`, fallbackErr.message || fallbackErr);
        throw new Error(`Failed to fetch ${symbol} from all endpoints (Yahoo 429 and CNBC failed)`);
      }
    }
  }

  // API Route: Get real-time stock quote from Yahoo Finance
  app.get("/api/debug-fetch", async (req, res) => {
    const symbol = (req.query.symbol as string || "VOO").toUpperCase().trim();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
        }
      });
      const text = await response.text();
      return res.json({
        status: response.status,
        statusText: response.statusText,
        url,
        headers: Object.fromEntries(response.headers.entries()),
        bodySnippet: text.substring(0, 1000)
      });
    } catch (err: any) {
      return res.json({
        error: err.message || err,
        stack: err.stack,
        url
      });
    }
  });

  // API Route: Get real-time stock quote from Yahoo Finance
  app.get("/api/quote", async (req, res) => {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    const cleanSymbol = symbol.toUpperCase().trim();
    if (cleanSymbol !== "QQQM" && cleanSymbol !== "VOO") {
      return res.status(400).json({ error: "Only QQQM and VOO are supported" });
    }

    try {
      const { price, prevClose } = await fetchChartWithFallback(cleanSymbol);
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      return res.json({
        symbol: cleanSymbol,
        price,
        prevClose,
        change,
        changePercent,
        timestamp: Date.now(),
        isFallback: false,
      });
    } catch (error: any) {
      console.error(`Error fetching quote for ${cleanSymbol}, triggering safety fallback:`, error.message || error);
      
      // Fallback prices in case Yahoo is blocked or rate-limited
      let basePrice = 224.5;
      let randPercent = (Math.random() - 0.5) * 0.4; // tiny random fluctuation
      if (cleanSymbol === "VOO") {
        basePrice = 542.8;
      }
      
      const price = basePrice * (1 + randPercent / 100);
      const prevClose = basePrice;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      return res.json({
        symbol: cleanSymbol,
        price: parseFloat(price.toFixed(3)),
        prevClose: parseFloat(prevClose.toFixed(3)),
        change: parseFloat(change.toFixed(3)),
        changePercent: parseFloat(changePercent.toFixed(3)),
        timestamp: Date.now(),
        isFallback: true,
        error: error.message,
      });
    }
  });

  // API Route: Get real-time VIX Volatility Index (Fear Index) from Yahoo Finance
  app.get("/api/vix", async (req, res) => {
    try {
      const { price, prevClose } = await fetchChartWithFallback("%5EVIX");
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      return res.json({
        price: parseFloat(price.toFixed(2)),
        prevClose: parseFloat(prevClose.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        timestamp: Date.now(),
        isFallback: false,
      });
    } catch (error: any) {
      console.error("Error fetching VIX, triggering safety fallback:", error.message || error);
      
      // Dynamic VIX fallback in safe ranges
      const basePrice = 14.85 + (Math.random() - 0.5) * 0.4;
      const price = parseFloat(basePrice.toFixed(2));
      const prevClose = parseFloat((price - (Math.random() - 0.4) * 0.5).toFixed(2));
      const change = parseFloat((price - prevClose).toFixed(2));
      const changePercent = parseFloat(((change / prevClose) * 100).toFixed(2));

      return res.json({
        price,
        prevClose,
        change,
        changePercent,
        timestamp: Date.now(),
        isFallback: true,
        error: error.message,
      });
    }
  });

  // Serve static assets in production, or use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VA Invest Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting VA Invest server:", err);
});
