// NOTE: NO API KEY FROM THE REQUESTS COMING IN, ONLY KEY IS SUPERBASE
const { createClient } = require("@supabase/supabase-js");
const { generateSubConditions } = require("../ai-utils/aiSetup");

const dbAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const dbClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

const handleGetActiveRule = async (req, res) => {
  try {
    const { data, error } = await dbClient
      .from("rules")
      .select("*")
      .eq("active", true)
      .single();

    if (data.length < 1) return res.status(404).json({ message: "No active rule found" });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRule = async (req, res) => {
  const { rule } = req.body;

  if (!rule) {
    return res.status(400).json({ message: "Missing rule" });
  }

  try {
    const subConditions = await generateSubConditions(rule);
    const { data, error } = await dbAdmin
      .from("rules")
      .insert({
        rule_text,
        active: true,
        sub_conditions: JSON.parse(subConditions.output_text),
      })
      .select();


    if (error) throw error;

    return res.status(201).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {
  handleGetActiveRule,
  handlePostRule,
};