import Stack from "@mui/material/Stack";
import { useState } from "react";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useI18n } from "../../hooks/I18n";
import Box from "@mui/material/Box";
import { useFavWords } from "../../hooks/FavWords";
import { useLookupHistory } from "../../hooks/LookupHistory";
import { useSetting } from "../../hooks/Setting";
import Button from "@mui/material/Button";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Alert from "@mui/material/Alert";
import { useConfirm } from "../../hooks/Confirm";
import DownloadButton from "./DownloadButton";
import UploadButton from "./UploadButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Checkbox from "@mui/material/Checkbox";
import { kissLog } from "../../libs/log";
import { isValidWord } from "../../libs/utils";
import DictCont from "../Selection/DictCont";
import SugCont from "../Selection/SugCont";
import { dictHandlers } from "../Selection/DictHandler";

function HistoryAccordion({ item, index, onSelect, isSelected, i18n }) {
  return (
    <Box>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ position: "relative" }}
        >
          <Checkbox
            checked={isSelected}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            sx={{ position: "absolute", left: 0, zIndex: 1 }}
          />
          <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 4, width: "calc(100% - 48px)" }}>
            <Typography variant="body2" sx={{ minWidth: 40 }}>
              {index + 1}.
            </Typography>
            <Typography sx={{ flex: 1 }} noWrap>
              {item.text}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {item.service || ""}
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {i18n("translated_text")}:
            </Typography>
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {item.translation || "-"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 1 }}>
              {new Date(item.timestamp).toLocaleString("zh-CN")}
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function FavoriteAccordion({ word, index, createdAt, timestamp, enDict, enSug, onSelect, isSelected }) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (e) => {
    e.stopPropagation();
    setExpanded((pre) => !pre);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return "";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const jumpToTime = (e) => {
    e.stopPropagation();
    if (timestamp) {
      window.postMessage(
        {
          type: "KISS_TRANSLATOR_JUMP_TO_TIME",
          time: timestamp,
        },
        "*"
      );
    }
  };

  return (
    <Box>
      <Accordion expanded={expanded} onChange={handleChange}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ position: "relative" }}>
          <Checkbox
            checked={isSelected}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(word);
            }}
            sx={{ position: "absolute", left: 0, zIndex: 1 }}
          />
          <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 4, width: "calc(100% - 48px)" }}>
            <Typography variant="body2" sx={{ minWidth: 40 }}>
              {index + 1}.
            </Typography>
            <Typography sx={{ flex: 1 }} noWrap>
              {word}
            </Typography>
            {timestamp && (
              <Button
                size="small"
                onClick={jumpToTime}
                sx={{
                  minWidth: "auto",
                  padding: "0 4px",
                  marginLeft: "10px",
                  fontSize: "0.9rem",
                  color: "#1e88e5",
                  textTransform: "none",
                }}
              >
                {formatTime(timestamp)}
              </Button>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {expanded && (
            <Stack spacing={2}>
              <DictCont text={word} enDict={enDict} />
              <SugCont text={word} enSug={enSug} />
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default function WordsPage() {
  const i18n = useI18n();
  const { favList, wordList, mergeWords, clearWords, toggleFav } = useFavWords();
  const { history, clearHistory, deleteHistoryItems } = useLookupHistory();
  const { setting } = useSetting();
  const confirm = useConfirm();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());

  const { enDict, enSug } = setting?.tranboxSetting || {};

  const filteredHistory = searchQuery
    ? history.filter(
        (item) =>
          item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.translation.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : history;

  const filteredFavList = searchQuery
    ? favList.filter(([word]) => word.toLowerCase().includes(searchQuery.toLowerCase()))
    : favList;

  const handleClearWords = async () => {
    const isConfirmed = await confirm({
      confirmText: i18n("confirm_title"),
      cancelText: i18n("cancel"),
    });
    if (isConfirmed) {
      clearWords();
    }
  };

  const handleClearHistory = async () => {
    const isConfirmed = await confirm({
      confirmText: i18n("confirm_title"),
      cancelText: i18n("cancel"),
    });
    if (isConfirmed) {
      clearHistory();
    }
  };

  const handleImportWords = (data) => {
    try {
      const newWords = data
        .split("\n")
        .map((line) => line.split(",")[0].trim())
        .filter(isValidWord);
      mergeWords(newWords);
    } catch (err) {
      kissLog("import words", err);
    }
  };

  // 导出为纯文本格式
  const handleExportTxt = async () => {
    // 获取完整的单词信息
    const fullWordData = [];

    // 由于选项页面无法直接访问 YouTube 字幕列表中的完整数据，
    // 我们只能导出已存储在收藏夹中的信息
    for (const [word, data] of favList) {
      fullWordData.push({
        word,
        phonetic: data.phonetic || "",
        definition: data.definition || "",
        examples: data.examples || [],
        timestamp: data.timestamp || null,
      });
    }

    const lines = [];
    lines.push("生词本导出文件");
    lines.push(`导出时间: ${new Date().toLocaleString("zh-CN")}`);
    lines.push("");

    fullWordData.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.word}`);

      // 清理音标，去除"US"标签和其他方括号，只保留音标本身，并用方括号包裹
      const cleanPhonetic = item.phonetic;
      if (cleanPhonetic) {
        lines.push(`   音标: [${cleanPhonetic}]`);
      }

      if (item.definition) {
        lines.push(`   释义: ${item.definition}`);
      }

      if (item.examples && item.examples.length > 0) {
        lines.push("   例句:");
        item.examples.slice(0, 2).forEach((example, exIndex) => {
          lines.push(`   ${exIndex + 1}. ${example.eng}`);
          if (example.chs) {
            lines.push(`      ${example.chs}`);
          }
        });
      }

      // 如果有时间戳，也导出时间信息
      if (item.timestamp) {
        const totalSeconds = Math.floor(item.timestamp / 1000);
        const videoLink = `https://www.youtube.com/watch?t=${totalSeconds}`;
        lines.push(`   视频链接: ${videoLink}`);
      }

      lines.push(""); // 空行分隔
    });

    return lines.join("\n");
  };

  // 导出为 CSV 格式
  const handleExportCsv = async () => {
    // 获取完整的单词信息（包括音标、释义、例句等）
    const fullWordData = [];

    // 由于选项页面无法直接访问 YouTube 字幕列表中的完整数据，
    // 我们只能导出已存储在收藏夹中的信息
    for (const [word, data] of favList) {
      fullWordData.push({
        word,
        phonetic: data.phonetic || "",
        definition: data.definition || "",
        examples: data.examples || [],
        timestamp: data.timestamp || null,
      });
    }

    // 创建包含多个例句列的表头
    const header =
      "Word,Phonetic,Definition,Example1,Translation1,Example2,Translation2,Video Link";
    const rows = fullWordData.map((item) => {
      // 转义特殊字符，特别是双引号
      const escapeCSVField = (field) => {
        if (!field) return '""';
        // 替换双引号为两个双引号，然后用双引号包围整个字段
        return `"${field.toString().replace(/"/g, '""')}"`;
      };

      // 清理音标，去除"US"标签和其他方括号，只保留音标本身，并用方括号包裹
      const cleanPhonetic = item.phonetic;
      const phonetic = cleanPhonetic ? `[${cleanPhonetic}]` : "";
      const definition = item.definition || "";

      // 获取前两个例句及其翻译
      let example1 = "";
      let translation1 = "";
      let example2 = "";
      let translation2 = "";

      if (item.examples && item.examples.length > 0) {
        example1 = item.examples[0].eng || "";
        translation1 = item.examples[0].chs || "";
      }

      if (item.examples && item.examples.length > 1) {
        example2 = item.examples[1].eng || "";
        translation2 = item.examples[1].chs || "";
      }

      // 创建YouTube链接
      let videoLink = "";
      if (item.timestamp) {
        // 由于在选项页面无法获取具体的视频ID，我们只能提供时间参数
        const totalSeconds = Math.floor(item.timestamp / 1000);
        videoLink = `https://www.youtube.com/watch?t=${totalSeconds}`;
      }

      return `${escapeCSVField(item.word)},${escapeCSVField(phonetic)},${escapeCSVField(definition)},${escapeCSVField(example1)},${escapeCSVField(translation1)},${escapeCSVField(example2)},${escapeCSVField(translation2)},${escapeCSVField(videoLink)}`;
    });

    // 创建CSV内容，添加说明行和表头
    const csvContent = [
      // 添加文件信息（在实际使用中，这应该是视频标题和链接）
      `"生词本导出文件",,,,,,,`,
      `,,,,,,,,`,
      // 表头
      header,
      // 数据行
      ...rows,
    ].join("\n");

    // 添加 BOM 头以支持 Excel 正确显示中文
    return "\uFEFF" + csvContent;
  };

  // 导出为 Markdown 格式
  const handleExportMd = async () => {
    // 获取完整的单词信息
    const fullWordData = [];

    // 由于选项页面无法直接访问 YouTube 字幕列表中的完整数据，
    // 我们只能导出已存储在收藏夹中的信息
    for (const [word, data] of favList) {
      fullWordData.push({
        word,
        phonetic: data.phonetic || "",
        definition: data.definition || "",
        examples: data.examples || [],
        timestamp: data.timestamp || null,
      });
    }

    const lines = [];
    lines.push("# 生词本导出文件");
    lines.push(`_导出时间: ${new Date().toLocaleString("zh-CN")}_`);
    lines.push("");

    fullWordData.forEach((item, index) => {
      lines.push(`${index + 1}. **${item.word}**`);

      // 清理音标，去除"US"标签和其他方括号，只保留音标本身，并用方括号包裹
      const cleanPhonetic = item.phonetic;
      if (cleanPhonetic) {
        lines.push(`   *音标 Phonetic:* [${cleanPhonetic}]`);
      }

      if (item.definition) {
        lines.push(`   *释义 Definition:* ${item.definition}`);
      }

      if (item.examples && item.examples.length > 0) {
        lines.push("   *例句 Examples:*");
        item.examples.slice(0, 2).forEach((example, exIndex) => {
          lines.push(`   ${exIndex + 1}. ${example.eng}`);
          if (example.chs) {
            lines.push(`      ${example.chs}`);
          }
        });
      }

      // 如果有时间戳，也导出时间信息
      if (item.timestamp) {
        const totalSeconds = Math.floor(item.timestamp / 1000);
        const videoLink = `https://www.youtube.com/watch?t=${totalSeconds}`;
        lines.push(
          `   *视频链接 Video Link:* [跳转到视频时间点](${videoLink})`
        );
      }

      lines.push(""); // 空行分隔
    });

    return lines.join("\n");
  };

  // 导出翻译
  const handleTranslation = async () => {
    const { enDict } = setting?.tranboxSetting;
    const dict = dictHandlers[enDict];
    if (!dict) return "";

    const tranList = [];
    for (const word of wordList) {
      try {
        const data = await dict.apiFn(word);
        const title = `## ${dict.reWord(data) || word}`;
        const tran = dict
          .toText(data)
          .map((line) => `- ${line}`)
          .join("\n");
        tranList.push([title, tran].join("\n"));
      } catch (err) {
        kissLog("export translation", err);
      }
    }

    return tranList.join("\n\n");
  };

  const handleExportHistory = async () => {
    const lines = [];
    lines.push("查词历史导出文件");
    lines.push(`导出时间: ${new Date().toLocaleString("zh-CN")}`);
    lines.push("");
    lines.push("原文,译文,翻译服务,时间");

    history.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleString("zh-CN");
      const escapedText = item.text.replace(/"/g, '""');
      const escapedTranslation = item.translation.replace(/"/g, '""');
      lines.push(`"${escapedText}","${escapedTranslation}","${item.service}","${date}"`);
    });

    return lines.join("\n");
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    const isConfirmed = await confirm({
      confirmText: i18n("confirm_title"),
      cancelText: i18n("cancel"),
    });

    if (isConfirmed) {
      if (tabValue === 0) {
        selectedItems.forEach((word) => {
          toggleFav(word);
        });
      } else {
        const itemsToDelete = history.filter((item) => selectedItems.has(item));
        deleteHistoryItems(itemsToDelete);
      }
      setSelectedItems(new Set());
    }
  };

  const handleSelectAll = () => {
    const currentList = tabValue === 0 ? filteredFavList : filteredHistory;
    const allIds = tabValue === 0
      ? currentList.map(([word]) => word)
      : currentList.map((item) => item);
    const allSelected = currentList.every(
      tabValue === 0
        ? ([word]) => selectedItems.has(word)
        : (item) => selectedItems.has(item)
    );

    setSelectedItems(allSelected ? new Set() : new Set(allIds));
  };

  const handleItemSelect = (item) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const selectedCount = selectedItems.size;

  return (
    <Box>
      <Stack spacing={3}>
        <Alert severity="info">
          {tabValue === 0 ? i18n("favorite_words_helper") : i18n("lookup_history_helper")}
        </Alert>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={i18n("favorite_words")} />
          <Tab label={i18n("lookup_history")} />
        </Tabs>

        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
        >
          <UploadButton
            text={i18n("import")}
            handleImport={tabValue === 0 ? handleImportWords : null}
            fileType={tabValue === 0 ? "text" : "json"}
            fileExts={tabValue === 0 ? [".txt", ".csv"] : [".json"]}
          />

          {tabValue === 0 && (
            <>
              {/* 导出为纯文本格式（单词列表） */}
              <DownloadButton
                handleData={() => wordList.join("\n")}
                text={i18n("export")}
                fileName={`kiss-words_${Date.now()}.txt`}
              />

              {/* 导出为 TXT 格式（包含音标、释义、例句等详细信息） */}
              <DownloadButton
                handleData={handleExportTxt}
                text={i18n("export") + " (TXT)"}
                fileName={`kiss-words_${Date.now()}.txt`}
              />

              {/* 导出为 CSV 格式 */}
              <DownloadButton
                handleData={handleExportCsv}
                text={i18n("export") + " (CSV)"}
                fileName={`kiss-words_${Date.now()}.csv`}
              />

              {/* 导出为 Markdown 格式 */}
              <DownloadButton
                handleData={handleExportMd}
                text={i18n("export") + " (MD)"}
                fileName={`kiss-words_${Date.now()}.md`}
              />

              {/* 导出翻译 */}
              <DownloadButton
                handleData={handleTranslation}
                text={i18n("export_translation")}
                fileName={`kiss-words_${Date.now()}.md`}
              />
            </>
          )}

          {tabValue === 1 && (
            <DownloadButton
              handleData={handleExportHistory}
              text={i18n("export")}
              fileName={`kiss-lookup-history_${Date.now()}.csv`}
            />
          )}

          <Button
            size="small"
            variant="outlined"
            onClick={tabValue === 0 ? handleClearWords : handleClearHistory}
            startIcon={<ClearAllIcon />}
          >
            {i18n("clear_all")}
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={handleSelectAll}
            disabled={selectedCount === 0}
          >
            {i18n("select_all")}
          </Button>

          {selectedCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleDeleteSelected}
              startIcon={<ClearAllIcon />}
            >
              {i18n("delete_selected")} ({selectedCount})
            </Button>
          )}
        </Stack>

        <TextField
          size="small"
          placeholder={i18n("search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box>
          {tabValue === 0 &&
            filteredFavList.length === 0 && (
              <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                {i18n("no_favorite_words")}
              </Typography>
            )}
          {tabValue === 1 &&
            filteredHistory.length === 0 && (
              <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>
                {searchQuery ? i18n("no_search_results") : i18n("no_lookup_history")}
              </Typography>
            )}

          {tabValue === 0 &&
            filteredFavList.map(([word, { createdAt, timestamp }], index) => (
              <FavoriteAccordion
                key={word}
                word={word}
                index={index}
                createdAt={createdAt}
                timestamp={timestamp}
                enDict={enDict}
                enSug={enSug}
                onSelect={handleItemSelect}
                isSelected={selectedItems.has(word)}
              />
            ))}

          {tabValue === 1 &&
            filteredHistory.map((item, index) => (
              <HistoryAccordion
                key={`${item.text}-${index}`}
                item={item}
                index={index}
                onSelect={handleItemSelect}
                isSelected={selectedItems.has(item)}
                i18n={i18n}
              />
            ))}
        </Box>
      </Stack>
    </Box>
  );
}
