import { useEffect, useRef, useState } from "react";
import { mockRule } from "../config/mockrule";
import { normalizeRule } from "../utils/ruleAdapter";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";
const POLL_INTERVAL_MS = 5000;

export function useActiveRule() {
  const [rule, setRule] = useState(mockRule);
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
            console.log("[useActiveRule] 404 No active rule from backend, using mockRule fallback");
            setRule(mockRule);
            setError(null);
            setLoading(false);
          }
          return;
        }

        if (!res.ok) throw new Error(`get_active_rule failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        if (data && data.id !== lastRuleIdRef.current) {
          console.log("[useActiveRule] ✅ Active rule received from backend:", data);
          lastRuleIdRef.current = data.id;
          const normalized = normalizeRule(data);
          console.log("[useActiveRule] Normalized objectLane:", normalized.objectLane);
          setRule(normalized);
        }
        setError(null);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.warn("[useActiveRule] Fetch error, using fallback rule:", err.message);
          setRule(mockRule);
          setError(null);
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

