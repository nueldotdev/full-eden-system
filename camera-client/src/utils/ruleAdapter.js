export function normalizeRule(row) {
  if (!row) return null;

  const subConditions = Array.isArray(row.sub_conditions)
    ? row.sub_conditions
    : [];
  const watchFor = subConditions
    .map((condition) => condition?.condition)
    .filter((condition) => typeof condition === "string" && condition.trim());

  if (watchFor.length === 0 && row.rule_text) {
    watchFor.push(row.rule_text);
  }

  return {
    id: row.id,
    objectLane: {
      watchFor: watchFor.length > 0 ? watchFor : ["person"],
      minConfidence: 0.6,
    },
  };
}