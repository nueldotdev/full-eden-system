import { normalizeRule } from "../utils/ruleAdapter";

export const ruleSample = {
  id: 1,
  rule_text: "Alert if a laptop appears in frame",
  created_at: "2026-09-27T13:56:20.828817+00:00",
  active: true,
  sub_conditions: [
    { lane: "action", condition: "a laptop appears in frame" },
  ],
};

export const mockRule = normalizeRule(ruleSample);