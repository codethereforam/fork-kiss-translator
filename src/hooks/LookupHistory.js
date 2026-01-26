import { STOKEY_LOOKUP_HISTORY, STOKEY_SETTING } from "../config";
import { useCallback, useMemo } from "react";
import { useStorage } from "./Storage";
import { storage } from "../libs/storage";

const MAX_HISTORY_ITEMS = 100000;

const DEFAULT_LOOKUP_HISTORY = [];

export function useLookupHistory() {
  const { data: history, save: saveHistory } = useStorage(
    STOKEY_LOOKUP_HISTORY,
    DEFAULT_LOOKUP_HISTORY
  );

  const addHistory = useCallback(
    async (sourceText, targetText, service = "") => {
      if (!sourceText || !sourceText.trim()) {
        return;
      }

      const setting = await storage.getObj(STOKEY_SETTING);
      const lookupHistoryConfig = setting?.lookupHistory || {};

      if (!lookupHistoryConfig.enabled) {
        return;
      }

      const maxCount = parseInt(lookupHistoryConfig.maxCount) || MAX_HISTORY_ITEMS;

      const entry = {
        text: sourceText.trim(),
        translation: targetText || "",
        service,
        timestamp: Date.now(),
      };

      const currentHistory = (await storage.getObj(STOKEY_LOOKUP_HISTORY)) || [];
      const filtered = currentHistory.filter(
        (item) => item.text.toLowerCase() !== entry.text.toLowerCase()
      );
      const newHistory = [entry, ...filtered].slice(0, maxCount);
      await storage.setObj(STOKEY_LOOKUP_HISTORY, newHistory);
    },
    []
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  const deleteHistoryItems = useCallback(
    (itemsToDelete) => {
      saveHistory((prev = []) => prev.filter((item) => !itemsToDelete.includes(item)));
    },
    [saveHistory]
  );

  const sortedHistory = useMemo(
    () => (history || []).sort((a, b) => b.timestamp - a.timestamp),
    [history]
  );

  return { history: sortedHistory, addHistory, clearHistory, deleteHistoryItems };
}
