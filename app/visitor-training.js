"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SecurityIcon from "@mui/icons-material/Security";

const initialVisitor = {
  firstName: "",
  lastName: "",
  phone: "",
  company: "",
  visitPurpose: "",
};

const steps = ["Dane", "Film", "Quiz", "Wpis do bazy"];

const demoSlides = [
  "Poruszaj sie tylko wyznaczonymi ciagami komunikacyjnymi.",
  "Stosuj srodki ochrony osobistej wymagane w danej strefie.",
  "Nie dotykaj maszyn, instalacji ani materialow bez zgody opiekuna.",
  "W razie alarmu przerwij wizyte i kieruj sie do punktu zbiorki.",
  "Kazdy wypadek, uraz lub zagrozenie zglos natychmiast opiekunowi.",
];

export default function VisitorTraining() {
  const [step, setStep] = useState("form");
  const [visitor, setVisitor] = useState(initialVisitor);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [result, setResult] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const videoRef = useRef(null);
  const demoBoxRef = useRef(null);
  const demoTimer = useRef(null);

  const activeStep = { form: 0, video: 1, quiz: 2, success: 3 }[step];

  const visitorName = useMemo(() => {
    return `${visitor.firstName} ${visitor.lastName}`.trim() || "Gosciu";
  }, [visitor.firstName, visitor.lastName]);

  function updateVisitor(event) {
    const { name, value } = event.target;
    setVisitor((current) => ({ ...current, [name]: value }));
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    setStep("video");
  }

  async function startQuiz() {
    setLoadingQuiz(true);
    setAnswers({});
    setResult(null);

    const response = await fetch("/api/quiz", { cache: "no-store" });
    const data = await response.json();

    setQuiz(data.questions);
    setLoadingQuiz(false);
    setStep("quiz");
  }

  function startDemoTraining() {
    setDemoProgress(0);
    window.clearInterval(demoTimer.current);
    demoTimer.current = window.setInterval(() => {
      setDemoProgress((current) => {
        const next = Math.min(current + 2, 100);

        if (next === 100) {
          window.clearInterval(demoTimer.current);
        }

        return next;
      });
    }, 700);
  }

  async function openFullscreen() {
    const target = videoFailed ? demoBoxRef.current : videoRef.current;

    if (target?.requestFullscreen) {
      await target.requestFullscreen();
    }
  }

  async function submitQuiz(event) {
    event.preventDefault();

    const response = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor, answers }),
    });
    const data = await response.json();

    if (data.passed) {
      setResult(data);
      setStep("success");
      return;
    }

    setResult(data);
  }

  function resetFlow() {
    setVisitor(initialVisitor);
    setAnswers({});
    setQuiz([]);
    setResult(null);
    setStep("form");
  }

  return (
    <Box component="main" className="app-shell">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Box>
          <Chip
            icon={<SecurityIcon />}
            label="BHP dla gosci zakladu"
            color="secondary"
            variant="outlined"
            sx={{ mb: 1.5, fontWeight: 800 }}
          />
          <Typography
            variant="h2"
            component="h1"
            sx={{ fontWeight: 900, letterSpacing: 0 }}
          >
            BHP Guests
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            flex: 1,
            mt: { xs: 2, md: 0 },
          }}
        >
          <Button
            component={Link}
            href="/ochrona"
            variant="outlined"
            color="secondary"
            startIcon={<BadgeIcon />}
            size="small"
            sx={{ px: 1.5 }}
          >
            Panel ochrony
          </Button>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {step === "form" && (
            <Card component="form" onSubmit={handleFormSubmit} elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading eyebrow="Krok 1" title="Dane goscia" />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Imie"
                      name="firstName"
                      value={visitor.firstName}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nazwisko"
                      name="lastName"
                      value={visitor.lastName}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nr telefonu"
                      name="phone"
                      value={visitor.phone}
                      onChange={updateVisitor}
                      type="tel"
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Nazwa firmy"
                      name="company"
                      value={visitor.company}
                      onChange={updateVisitor}
                      required
                      fullWidth
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Cel przyjazdu"
                      name="visitPurpose"
                      value={visitor.visitPurpose}
                      onChange={updateVisitor}
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder="Np. serwis, dostawa, spotkanie"
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<PlayCircleIcon />}
                  sx={{ mt: 3 }}
                >
                  Rozpocznij szkolenie
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "video" && (
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading eyebrow="Krok 2" title="Film szkoleniowy" />

                {!videoFailed ? (
                  <Box
                    component="video"
                    ref={videoRef}
                    className="training-video"
                    src="/szkolenie-bhp.mp4"
                    controls={false}
                    autoPlay
                    playsInline
                    onEnded={startQuiz}
                    onError={() => {
                      setVideoFailed(true);
                      startDemoTraining();
                    }}
                  />
                ) : (
                  <Box
                    ref={demoBoxRef}
                    className="demo-video"
                    role="img"
                    aria-label="Demonstracyjne szkolenie BHP"
                  >
                    <Typography className="demo-frame" component="div">
                      {
                        demoSlides[
                          Math.min(
                            Math.floor(demoProgress / 20),
                            demoSlides.length - 1,
                          )
                        ]
                      }
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={demoProgress}
                      color="primary"
                    />
                    <Typography>
                      {demoProgress < 100
                        ? "Trwa szkolenie..."
                        : "Szkolenie zakonczone."}
                    </Typography>
                  </Box>
                )}

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
                    Pelny ekran
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="button"
                    onClick={startQuiz}
                    disabled={!videoFailed || demoProgress < 100 || loadingQuiz}
                    startIcon={<FactCheckIcon />}
                  >
                    {loadingQuiz ? "Losowanie pytan..." : "Przejdz do quizu"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {step === "quiz" && (
            <Card component="form" onSubmit={submitQuiz} elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow="Krok 3"
                  title="Quiz BHP"
                  subtitle="Aby zostac dopisanym do bazy, odpowiedz poprawnie na 5 pytan."
                />

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
                          sx={{ color: "text.primary", fontWeight: 900, mb: 1 }}
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

                {result && !result.passed && (
                  <Alert severity="warning" sx={{ mt: 2.5 }}>
                    Wynik: {result.score}/5. Quiz trzeba zaliczyc bezblednie.
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<FactCheckIcon />}
                  sx={{ mt: 3 }}
                >
                  Sprawdz odpowiedzi
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "success" && (
            <Card elevation={0}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  eyebrow="Gotowe"
                  title={`${visitorName}, szkolenie zostalo zaliczone`}
                  subtitle="Dane zostaly zapisane w bazie. Ochrona zobaczy wpis w panelu wejsc."
                />
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
                      minWidth: 260,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: 900 }}
                    >
                      Nr przepustki
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {result?.visitor?.passNumber}
                    </Typography>
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      minWidth: 260,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ fontWeight: 900 }}
                    >
                      Wazna do
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {formatDate(result?.visitor?.expiresAt)}
                    </Typography>
                  </Paper>
                </Stack>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RestartAltIcon />}
                  onClick={resetFlow}
                >
                  Zarejestruj kolejnego goscia
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
        sx={{ fontWeight: 900 }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: 900, lineHeight: 1.1 }}
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

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}
