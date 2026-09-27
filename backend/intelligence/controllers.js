const { generateSubConditions } = require("../ai-utils/aiSetup");

const handleAI = async (req, res) => {
  try {
    const rule = "Alert if someone is wearing a mask";
    const result = await generateSubConditions(rule);
    return res.status(200).json({ result: JSON.parse(result.output_text), rule });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  handleAI,
};
