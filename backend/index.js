const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
);

const ruleRoutes = require("./rules/routes");
const intelligenceRoutes = require("./intelligence/routes");
const peopleRoutes = require("./people/routes")

const app = express();
const port = 4001;

app.use(express.json());
app.use(cors());

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use("/api/rule", ruleRoutes);
app.use("/api/ai", intelligenceRoutes);
app.use("/api/people", peopleRoutes);

app.listen(port, async () => {
  try {
    const { error } = await supabase.from("rules").select("*").limit(1);
    if (error) {
      console.error("❌ Failed to connect to Supabase:", error.message);
      return;
    }
    console.log("✅ Connected to Supabase successfully");
    console.log(`Example app listening on port http://localhost:${port}`);
  } catch (err) {
    console.error("❌ Error connecting to Supabase:", err.message);
  }
});
