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

const evaluateFrame = (ruleText, identityContext, base64Image) => {
  return Gemini.interactions.create({
    model: "gemini-3.8-flash",
    input: [
      {
        type: "text",
        text: `Rule: ${ruleText}
Identity context: ${identityContext}

Does this image satisfy the rule? Respond with a verdict and a short reason.`,
      },
      {
        type: "image",
        data: base64Image,
        mime_type: "image/jpeg",
      },
    ],
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: {
          match: { type: "boolean" },
          reason: { type: "string" },
        },
        required: ["match", "reason"],
      },
    },
  });
};

module.exports = {
  Gemini,
  generateSubConditions,
  evaluateFrame,
};
