import { STOKEY_WORD_HISTORY, KV_WORD_HISTORY_KEY } from "../config";
import { useCallback, useMemo } from "react";
import { useStorage } from "./Storage";
import { debounceSyncMeta } from "../libs/storage";
import { useSetting } from "./Setting";

const DEFAULT_WORD_HISTORY = [];

export function useWordHistory() {
  const { data: wordHistory, save: saveHistory } = useStorage(
    STOKEY_WORD_HISTORY,
    DEFAULT_WORD_HISTORY,
    KV_WORD_HISTORY_KEY
  );

  const { setting } = useSetting();
  const { wordHistoryEnabled = true, wordHistoryMaxCount = 1000 } =
    setting || {};

  const save = useCallback(
    (objOrFn) => {
      saveHistory(objOrFn);
      debounceSyncMeta(KV_WORD_HISTORY_KEY);
    },
    [saveHistory]
  );

  const addToHistory = useCallback(
    (word) => {
      if (!wordHistoryEnabled) return;
      if (!word || typeof word !== "string") return;

      const normalizedWord = word.trim();
      if (!normalizedWord) return;

      save((prev) => {
        const history = Array.isArray(prev) ? [...prev] : [];

        // Remove existing entry (case-insensitive deduplication)
        const existingIndex = history.findIndex(
          (item) => item.word.toLowerCase() === normalizedWord.toLowerCase()
        );

        if (existingIndex !== -1) {
          history.splice(existingIndex, 1);
        }

        // Add new entry at the beginning
        history.unshift({
          word: normalizedWord,
          createdAt: Date.now(),
        });

        // Limit history count
        if (history.length > wordHistoryMaxCount) {
          history.splice(wordHistoryMaxCount);
        }

        return history;
      });
    },
    [save, wordHistoryEnabled, wordHistoryMaxCount]
  );

  const removeFromHistory = useCallback(
    (wordsToRemove) => {
      const wordsArray = Array.isArray(wordsToRemove)
        ? wordsToRemove
        : [wordsToRemove];
      const wordsLower = wordsArray.map((w) => w.toLowerCase());

      save((prev) => {
        const history = Array.isArray(prev) ? [...prev] : [];
        return history.filter(
          (item) => !wordsLower.includes(item.word.toLowerCase())
        );
      });
    },
    [save]
  );

  const clearHistory = useCallback(() => {
    save([]);
  }, [save]);

  const historyList = useMemo(
    () => (Array.isArray(wordHistory) ? wordHistory : []),
    [wordHistory]
  );

  const wordList = useMemo(
    () => historyList.map((item) => item.word),
    [historyList]
  );

  return {
    wordHistory: historyList,
    wordList,
    addToHistory,
    removeFromHistory,
    clearHistory,
    wordHistoryEnabled,
  };
}
