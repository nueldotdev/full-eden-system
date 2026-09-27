const { GoogleGenAI } = require("@google/genai");

const Gemini = new GoogleGenAI({});

const generateSubConditions = (ruleText) => {
  return Gemini.interactions.create({
    model: "gemini-3.8-flash",
    input: `Classify this security rule into sub-conditions. Each sub-condition
must be a self-cxontained, independently-checkable clause — do not split a
single clause into separate words (e.g. "wearing a mask" is one condition,
not "wearing" and "mask" separately).

Lanes:
- "identity": references a specific enrolled person
- "object": a bare object or entity, no modifier
- "action": anything with a modifier (color, carrying, wearing, a state, a
  relationship between two things)

Rule: "${ruleText}"`,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            condition: { type: "string" },
            lane: { type: "string", enum: ["identity", "object", "action"] },
          },
          required: ["condition", "lane"],
        },
      },
    },
  });
};

module.exports = {
  Gemini,
  generateSubConditions,
};
