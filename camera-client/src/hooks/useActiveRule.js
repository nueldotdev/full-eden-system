import { useEffect, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";
const POLL_INTERVAL_MS = 5000;

export function useActiveRule() {
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastRuleIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRule = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rule/get_active_rule`);

        if (res.status === 404) {
          if (!cancelled) {
            setRule(null);
            setError("No active rule set");
            setLoading(false);
          }
          return;
        }

        if (!res.ok) throw new Error(`get_active_rule failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        // Only update state if the rule actually changed, so we don't
        // spam re-renders / restart the object gate every poll.
        if (data.id !== lastRuleIdRef.current) {
          lastRuleIdRef.current = data.id;
          setRule(normalizeRule(data));
        }
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("useActiveRule fetch error:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchRule();
    const interval = setInterval(fetchRule, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { rule, loading, error };
}

// Adapts the real Gemini-generated shape:
//   sub_conditions: [{ condition: "backpack", lane: "object" }, ...]
// into the { objectLane: { watchFor, minConfidence } } shape your
// gates already expect.
function normalizeRule(row) {
  const subConditions = row.sub_conditions || [];

  const watchFor = subConditions
    .filter((sc) => sc.lane === "object")
    .map((sc) => sc.condition);

  return {
    id: row.id,
    ruleText: row.rule_text,
    objectLane: {
      watchFor,
      minConfidence: 0.6, // not part of the AI schema — client-side default
    },
    // stash the other lanes too, in case Dev B needs identity/action conditions
    identityConditions: subConditions
      .filter((sc) => sc.lane === "identity")
      .map((sc) => sc.condition),
    actionConditions: subConditions
      .filter((sc) => sc.lane === "action")
      .map((sc) => sc.condition),
  };
}