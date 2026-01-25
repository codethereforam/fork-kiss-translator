import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { useI18n } from "../../hooks/I18n";
import { useEffect, useState, useMemo, useCallback } from "react";
import { apiTranslate } from "../../apis";
import CopyBtn from "./CopyBtn";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useLookupHistory } from "../../hooks/LookupHistory";
import { kissLog } from "../../libs/log";

export default function TranCont({
  text,
  fromLang,
  toLang,
  apiSlug,
  transApis,
  simpleStyle = false,
}) {
  const i18n = useI18n();
  const [trText, setTrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addHistory } = useLookupHistory();

  const apiSetting = useMemo(
    () => transApis.find((api) => api.apiSlug === apiSlug),
    [transApis, apiSlug]
  );

  const handleTranslationComplete = useCallback(
    (sourceText, translatedText, serviceName) => {
      if (sourceText && translatedText) {
        try {
          addHistory(sourceText, translatedText, serviceName);
        } catch (err) {
          kissLog("trancont: add history error", err);
        }
      }
    },
    [addHistory]
  );

  useEffect(() => {
    if (!text?.trim() || !apiSetting) {
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setTrText("");
        setError("");

        const { trText } = await apiTranslate({
          text,
          fromLang,
          toLang,
          apiSetting,
        });

        setTrText(trText);
        handleTranslationComplete(text, trText, apiSetting.apiName);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [text, fromLang, toLang, apiSetting, handleTranslationComplete]);

  if (simpleStyle) {
    return (
      <Box>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : loading ? (
          <CircularProgress size={16} />
        ) : (
          <Typography style={{ whiteSpace: "pre-line" }}>{trText}</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <TextField
        size="small"
        label={`${i18n("translated_text")} - ${apiSetting.apiName}`}
        // disabled
        fullWidth
        multiline
        value={trText}
        helperText={error}
        InputProps={{
          startAdornment: loading ? <CircularProgress size={16} /> : null,
          endAdornment: (
            <Stack
              direction="row"
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
              }}
            >
              <CopyBtn text={trText} title={i18n("copy")} />
            </Stack>
          ),
        }}
      />
    </Box>
  );
}
