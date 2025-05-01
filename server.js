import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const PORT = process.env.PORT || 8888;
const NOUS_API_KEY = process.env.NOUS_API_KEY;

if (!NOUS_API_KEY) {
  console.error("❌ NOUS_API_KEY is not set in the environment.");
  process.exit(1);
}

const app = express();

// Serve static assets from current directory (index.html, etc.)
app.use(express.static("."));
app.use(express.json({ limit: "2mb" }));

// Proxy endpoint for Nous Research API
app.post("/nous/chat/completions", async (req, res) => {
  try {
    const upstream = await fetch(
      "https://inference-api.nousresearch.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NOUS_API_KEY}`,
        },
        body: JSON.stringify(req.body),
      }
    );

    // Forward status and headers (except hop-by-hop headers)
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return; // let Express handle encoding
      res.setHeader(key, value);
    });

    // Stream the body back to client
    upstream.body.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
