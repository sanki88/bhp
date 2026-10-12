"use client";

import BrandHeader from "@/_components/BrandHeader";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { normalizeLanguage } from "@/lib/languages";
import { getUiCopy } from "@/lib/ui-copy";
import { isValidPhone, PHONE_PATTERN } from "@/lib/phone.mjs";
import "flag-icons/css/flag-icons.min.css";

const initialVisitor = {
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  visitPurpose: "",
  visitorType: "guest",
};

export default function VisitorTraining({
  audience = "guest",
  language = "pl",
}) {
  const activeLanguage = normalizeLanguage(language);
  const copy = getUiCopy(activeLanguage);
  const text = copy.training;
  const [step, setStep] = useState("form");
  const [visitor, setVisitor] = useState(() => ({
    ...initialVisitor,
    visitorType: audience,
  }));
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [result, setResult] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [attemptId, setAttemptId] = useState("");
  const videoRef = useRef(null);

  const activeStep = { form: 0, video: 1, quiz: 2, success: 3 }[step];
  const isSubcontractor = audience === "subcontractor";
  const audienceKey = isSubcontractor ? "subcontractor" : "guest";
  const audienceLabel = text.audience[audienceKey];
  const visitorName =
    `${visitor.firstName} ${visitor.lastName}`.trim() || text.visitorFallback;
  const phoneError = visitor.phone !== "" && !isValidPhone(visitor.phone);

  useEffect(() => {
    fetch(`/api/video?audience=${audience}&language=${activeLanguage}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => setActiveVideo(data.activeVideo))
      .catch(() => setActiveVideo(null));
  }, [audience, activeLanguage]);

  function updateVisitor(event) {
    const { name, value } = event.target;
    if (name === "phone") event.target.setCustomValidity(value && !isValidPhone(value) ? text.form.phoneError : "");
    setVisitor((current) => ({ ...current, [name]: value }));
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (!isValidPhone(visitor.phone)) { setError(text.form.phoneError); return; }
    if (!activeVideo) { setError(text.video.unavailable); return; }
    setError("");
    setStep("video");
  }

  async function startQuiz() {
    setLoadingQuiz(true); setAnswers({}); setResult(null); setError("");
    try {
      const response = await fetch(`/api/quiz?language=${activeLanguage}&audience=${audience}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuiz(data.questions); setAttemptId(data.attemptId); setStep("quiz");
    } catch (error) { setError(error.message || text.video.unavailable); }
    finally { setLoadingQuiz(false); }
  }

  async function openFullscreen() {
    const target = videoRef.current;

    if (target?.requestFullscreen) {
      await target.requestFullscreen();
    }
  }

  async function submitQuiz(event) {
    event.preventDefault(); setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/quiz", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor: { ...visitor, visitorType: audience }, language: activeLanguage, answers, attemptId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      if (data.passed) setStep("success");
    } catch (error) { setError(error.message || text.video.unavailable); }
    finally { setSubmitting(false); }
  }

  function resetFlow() {
    setVisitor({ ...initialVisitor, visitorType: audience });
    setAnswers({});
    setQuiz([]);
    setResult(null);
    setStep("form");
    setVideoFailed(false);
    setVideoEnded(false);
    setAttemptId("");
    setError("");
  }

  return (
    <Box component="main" className="app-shell" lang={activeLanguage}>
      <BrandHeader
        title={text.pageTitle[audienceKey]}
        eyebrow={text.chip({ audienceLabel })}
        subtitle={text.languageVersion({ languageLabel: copy.languageName })}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper className="training-progress" elevation={0} sx={{ p: 1, border: "1px solid", borderColor: "divider" }}>
            <ol className="progress-steps" aria-label={text.progressLabel}>
              {text.steps.map((label, index) => (
                <li key={label} className={`progress-step${index === activeStep ? " is-active" : index < activeStep ? " is-complete" : ""}`} aria-current={index === activeStep ? "step" : undefined}>
                  <span className="step-number" aria-hidden="true">{index < activeStep ? "✓" : index + 1}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {step === "form" && (
            <Card component="form" onSubmit={handleFormSubmit} elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow={text.form.eyebrow}
                  title={text.form.title[audienceKey]}
                />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={text.form.firstName}
                      name="firstName"
                      value={visitor.firstName}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={text.form.lastName}
                      name="lastName"
                      value={visitor.lastName}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={text.form.phone}
                      name="phone"
                      value={visitor.phone}
                      onChange={updateVisitor}
                      type="tel"
                      autoComplete="tel"
                      error={phoneError}
                      helperText={phoneError ? text.form.phoneError : text.form.phoneHint}
                      onInvalid={(event) => event.target.setCustomValidity(text.form.phoneError)}
                      slotProps={{ htmlInput: { inputMode: "tel", pattern: PHONE_PATTERN, maxLength: 160 } }}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={text.form.company}
                      name="company"
                      value={visitor.company}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label={text.form.visitPurpose}
                      name="visitPurpose"
                      value={visitor.visitPurpose}
                      onChange={updateVisitor}
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder={text.form.visitPurposePlaceholder}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PlayCircleIcon />}
                  sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}
                >
                  {text.form.submit}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "video" && (
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow={text.video.eyebrow}
                  title={text.video.title}
                />

                {!videoFailed && activeVideo ? (
                  <Box component="video" ref={videoRef} className="training-video"
                    src={activeVideo.url} controls autoPlay playsInline
                    onEnded={() => { setVideoEnded(true); startQuiz(); }}
                    onError={() => { setVideoFailed(true); setError(text.video.unavailable); }}
                  />
                ) : <Alert severity="error">{text.video.unavailable}</Alert>}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FullscreenIcon />}
                    onClick={openFullscreen}
                  >
                    {text.video.fullscreen}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="button"
                    onClick={startQuiz}
                    disabled={!videoEnded || videoFailed || loadingQuiz}
                    startIcon={<FactCheckIcon />}
                  >
                    {loadingQuiz ? text.video.loadingQuiz : text.video.goToQuiz}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {step === "quiz" && (
            <Card component="form" onSubmit={submitQuiz} elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow={text.quiz.eyebrow}
                  title={text.quiz.title}
                  subtitle={text.quiz.subtitle}
                />

                {quiz.length < 5 ? (
                  <Alert severity="warning">
                    {text.quiz.notEnoughQuestions}
                  </Alert>
                ) : (
                  <Stack spacing={2.5}>
                    {quiz.map((question, index) => (
                      <Paper
                        key={question.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <FormControl required fullWidth>
                          <FormLabel
                            sx={{
                              color: "text.primary",
                              fontWeight: 700,
                              mb: 1,
                            }}
                          >
                            {index + 1}. {question.text}
                          </FormLabel>
                          <RadioGroup
                            name={question.id}
                            value={answers[question.id] || ""}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: event.target.value,
                              }))
                            }
                          >
                            {question.options.map((option) => (
                              <FormControlLabel
                                key={option.id}
                                value={option.id}
                                control={<Radio color="primary" />}
                                label={option.text}
                              />
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </Paper>
                    ))}
                  </Stack>
                )}

                {result && !result.passed && (
                  <Alert severity="warning" sx={{ mt: 2.5 }}>
                    {text.quiz.result({ score: result.score })}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<FactCheckIcon />}
                  sx={{ mt: 3 }}
                  disabled={quiz.length < 5 || submitting || Object.keys(answers).length !== 5}
                >
                  {text.quiz.submit}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow={text.success.eyebrow}
                  title={text.success.title({ visitorName })}
                  subtitle={text.success.subtitle}
                />
                {result?.visitor?.blacklisted && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {text.success.blacklist({
                      reason:
                        result.visitor.blacklistReason || text.success.noReason,
                    })}
                  </Alert>
                )}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      minWidth: 0, width: { xs: "100%", sm: 260 },
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: 700 }}
                    >
                      {text.success.validUntil}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatDate(result?.visitor?.expiresAt, copy.locale)}
                    </Typography>
                  </Paper>
                </Stack>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RestartAltIcon />}
                  onClick={resetFlow}
                >
                  {text.success.reset}
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        color="primary.main"
        sx={{ fontWeight: 700 }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: 700, lineHeight: 1.25 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function formatDate(value, locale) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString(locale);
}
