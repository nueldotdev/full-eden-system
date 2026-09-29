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
const syncRoutes = require("./sync/routes");

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

app.post("/evaluate_frame", async (req, res) => {
  const { base64Image, identityContext } = req.body;

  // Camera gets a bare ack immediately — it doesn't wait on Gate 3's verdict
  res.sendStatus(200);

  try {
    const activeRule = getCurrentActiveRule(); // however you're holding this in memory

    if (!activeRule) return;

    const interaction = await evaluateFrame(
      activeRule.rule_text,
      identityContext ?? "No identity condition in this rule",
      base64Image
    );

    const result = JSON.parse(interaction.output_text);

    if (result.match) {
      await postEvent({
        ruleId: activeRule.id,
        ruleText: activeRule.rule_text,
        reason: result.reason,
        base64Image,
      });
    }
  } catch (err) {
    console.error("evaluate_frame failed:", err);
    // swallow it — camera already got its ack, no one's waiting on this
  }
});

app.use("/api/rule", ruleRoutes);
app.use("/api/ai", intelligenceRoutes);
app.use("/api/people", peopleRoutes);
app.use('/api/sync', syncRoutes);

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
