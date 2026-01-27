import { STOKEY_WORD_HISTORY, KV_WORD_HISTORY_KEY } from "../config";
import { useCallback, useMemo, useRef, useEffect } from "react";
import { useStorage } from "./Storage";
import { debounceSyncMeta } from "../libs/storage";
import { useSetting } from "./Setting";

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
  const { data: wordHistory, save: saveHistory, isLoading } = useStorage(
    STOKEY_WORD_HISTORY,
    DEFAULT_WORD_HISTORY,
    KV_WORD_HISTORY_KEY
  );

  const { setting } = useSetting();
  const { wordHistoryEnabled = true, wordHistoryMaxCount = 1000 } =
    setting || {};

  // Queue words to add while storage is loading
  const pendingWordsRef = useRef([]);

  const save = useCallback(
    (objOrFn) => {
      saveHistory(objOrFn);
      debounceSyncMeta(KV_WORD_HISTORY_KEY);
    },
    [saveHistory]
  );

  // Process pending words once storage is loaded
  useEffect(() => {
    if (!isLoading && pendingWordsRef.current.length > 0) {
      const wordsToAdd = [...pendingWordsRef.current];
      pendingWordsRef.current = [];

      save((prev) => addWordsToHistory(prev, wordsToAdd, wordHistoryMaxCount));
    }
  }, [isLoading, save, wordHistoryMaxCount]);

  const addToHistory = useCallback(
    (word) => {
      if (!wordHistoryEnabled) return;
      if (!word || typeof word !== "string") return;

      const normalizedWord = word.trim();
      if (!normalizedWord) return;

      // If still loading, queue the word to be added later
      if (isLoading) {
        if (!pendingWordsRef.current.includes(normalizedWord)) {
          pendingWordsRef.current.push(normalizedWord);
        }
        return;
      }

      save((prev) =>
        addWordsToHistory(prev, [normalizedWord], wordHistoryMaxCount)
      );
    },
    [save, wordHistoryEnabled, wordHistoryMaxCount, isLoading]
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
