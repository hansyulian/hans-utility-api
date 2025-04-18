const express = require("express");

// List of symbols to query against USDT
const symbols = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "BNB",
  "DOGE",
  "SUI",
  "AVAX",
  "ADA",
];

// Binance API endpoint for ticker prices
const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/price";

async function fetchPrices() {
  try {
    const response = await fetch(BINANCE_API_URL);
    const data = await response.json();
    const btcUsdt = data.find((item) => item.symbol === "BTCUSDT");
    const btcPrice = parseFloat(btcUsdt.price);
    // Map the response data into the desired format
    const prices = symbols.reduce((acc, symbol) => {
      const pair = symbol + "USDT";
      const priceData = data.find((item) => item.symbol === pair);
      1;
      if (priceData) {
        const price = parseFloat(priceData.price);
        const satoshiLabel =
          symbol === "BTC"
            ? ""
            : ` : ${((price * 100_000_000) / btcPrice).toFixed(2)}s`;
        acc[symbol] = `${price}${satoshiLabel}`;
      }
      return acc;
    }, {});
    prices.now = new Date().toISOString();
    console.log(prices);
    return prices;
  } catch (error) {
    console.error("Error fetching Binance prices:", error);
  }
}

const app = express();
const port = process.env.PORT || 7589;

// Middleware to set CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Endpoint to serve Binance prices
app.get("/peek-binance", async (req, res) => {
  try {
    const prices = await fetchPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});
// Endpoint to serve USD price
app.get("/usd-price", async (req, res) => {
  try {
    const response = await fetch(
      "https://www.bca.co.id/api/sitecore/currencies/RefreshKurs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "dsid={83966849-FC44-4A3E-97D0-8F96D7388B22}",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const usdData = data.KursRates.find((item) => item.CurrencyCode === "USD");
    if (!usdData) {
      next(new Error("USD currency data not found"));
    }
    const eRate = usdData.Rates[0]; // e-Rate is at index 0
    const eRateAverage = (eRate.SellRate + eRate.BuyRate) / 2;

    console.log("USD e-Rate average:", eRateAverage);
    res.json({
      bca: eRateAverage,
    });
  } catch (error) {
    console.error("Error fetching USD price:", error);
    res.status(500).json({ error: "Failed to fetch USD price" });
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
