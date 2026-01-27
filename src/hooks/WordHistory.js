import { STOKEY_WORD_HISTORY, KV_WORD_HISTORY_KEY } from "../config";
import { useCallback, useMemo } from "react";
import { useStorage } from "./Storage";
import { storage, debounceSyncMeta } from "../libs/storage";
import { useSetting } from "./Setting";
import { kissLog } from "../libs/log";

const DEFAULT_WORD_HISTORY = [];

// Helper function to add words to history array
function addWordsToHistory(history, wordsToAdd, maxCount) {
  let result = Array.isArray(history) ? [...history] : [];

  for (const normalizedWord of wordsToAdd) {
    // Remove existing entry (case-insensitive deduplication)
    const existingIndex = result.findIndex(
      (item) => item.word.toLowerCase() === normalizedWord.toLowerCase()
    );

    if (existingIndex !== -1) {
      result.splice(existingIndex, 1);
    }

    // Add new entry at the beginning
    result.unshift({
      word: normalizedWord,
      createdAt: Date.now(),
    });
  }

  // Limit history count
  if (result.length > maxCount) {
    result.splice(maxCount);
  }

  return result;
}

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

  // Directly save to storage to avoid race conditions with component lifecycle
  const addToHistory = useCallback(
    async (word) => {
      if (!wordHistoryEnabled) return;
      if (!word || typeof word !== "string") return;

      const normalizedWord = word.trim();
      if (!normalizedWord) return;

      try {
        // Read current history directly from storage
        const currentHistory =
          (await storage.getObj(STOKEY_WORD_HISTORY)) || [];

        // Add word to history
        const newHistory = addWordsToHistory(
          currentHistory,
          [normalizedWord],
          wordHistoryMaxCount
        );

        // Write directly to storage
        await storage.setObj(STOKEY_WORD_HISTORY, newHistory);

        // Trigger sync metadata update
        debounceSyncMeta(KV_WORD_HISTORY_KEY);
      } catch (err) {
        kissLog("addToHistory direct storage failed, using fallback", err);
        // Fallback: try to save via React state
        save((prev) =>
          addWordsToHistory(prev, [normalizedWord], wordHistoryMaxCount)
        );
      }
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
