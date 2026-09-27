// NOTE: NO API KEY FROM THE REQUESTS COMING IN, ONLY KEY IS SUPERBASE
const { dbAdmin, dbClient } = require("../utils/supabase");
const { generateSubConditions } = require("../utils/aiSetup");


const handleGetActiveRule = async (req, res) => {
  try {
    const { data, error } = await dbClient
      .from("rules")
      .select("*")
      .eq("active", true)
      .single();

    if (!data) return res.status(404).json({ message: "No active rule found" });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRule = async (req, res) => {
  const { rule_text } = req.body;

  if (!rule_text) {
    return res.status(400).json({ message: "Missing rule text" });
  }

  try {
    const subConditions = await generateSubConditions(rule_text);

    const { error: deactivateError } = await dbAdmin
      .from("rules")
      .update({ active: false })
      .eq("active", true);

    if (deactivateError) throw deactivateError;

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
