import { useEffect, useState } from "react";
import {
  getPublicBusinessRules,
  normalizePublicBusinessRules,
} from "../services/public/businessRulesService.js";

/** Module-level cache so homepage sections share one public-rules fetch. */
let cache = null;
let inflight = null;

async function loadRules() {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = getPublicBusinessRules()
    .then((rules) => {
      cache = rules;
      return rules;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * PRICE-01 / LEGAL-01 / SUPPORT-01 — shared public business-rules consumer.
 */
export default function usePublicBusinessRules() {
  const [rules, setRules] = useState(() => cache);
  const [loading, setLoading] = useState(() => !cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    loadRules()
      .then((next) => {
        if (!cancelled) {
          setRules(next);
          setError(null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || "Failed to load business rules");
          setRules(normalizePublicBusinessRules({}));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rules, loading, error, fromApi: Boolean(rules?.fromApi) };
}
