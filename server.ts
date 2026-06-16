import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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
      // Fetch from Yahoo Finance
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1d&range=1d`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance API responded with status ${response.status}`);
      }

      const data: any = await response.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        throw new Error("No chart result found in Yahoo Finance response");
      }

      const meta = result.meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose;

      if (price === undefined || prevClose === undefined) {
        throw new Error("Price data is missing from Yahoo response");
      }

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
      console.error(`Error fetching quote for ${cleanSymbol}:`, error.message);
      
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
      // Fetch VIX from Yahoo Finance
      const response = await fetch(
        "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d",
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Yahoo Finance API for VIX responded with status ${response.status}`);
      }

      const data: any = await response.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        throw new Error("No chart result found in VIX response");
      }

      const meta = result.meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose;

      if (price === undefined || prevClose === undefined) {
        throw new Error("Price data is missing from VIX response");
      }

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
      console.error("Error fetching VIX:", error.message);
      
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
