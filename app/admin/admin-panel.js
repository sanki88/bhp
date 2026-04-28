"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import SaveIcon from "@mui/icons-material/Save";
import SecurityIcon from "@mui/icons-material/Security";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const emptyQuestion = {
  id: "",
  text: "",
  correctOptionId: "a",
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
};

export default function AdminPanel() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const questionCount = useMemo(() => questions.length, [questions]);

  async function loadQuestions() {
    const response = await fetch("/api/admin/questions", { cache: "no-store" });
    const data = await response.json();
    setQuestions(data.questions);
  }

  function handleLogin(event) {
    event.preventDefault();

    if (login === "admin" && password === "1234") {
      setAuthorized(true);
      setLoginError(false);
      loadQuestions();
      return;
    }

    setLoginError(true);
  }

  function logout() {
    setAuthorized(false);
    setLogin("");
    setPassword("");
  }

  function updateQuestionText(value) {
    setQuestionForm((current) => ({
      ...current,
      text: value,
    }));
  }

  function updateOption(optionId, value) {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === optionId ? { ...option, text: value } : option,
      ),
    }));
  }

  function editQuestion(question) {
    setEditingId(question.id);
    setQuestionForm({
      ...question,
      options: question.options.map((option) => ({ ...option })),
    });
    setMessage(null);
  }

  function resetQuestionForm() {
    setEditingId(null);
    setQuestionForm(emptyQuestion);
  }

  async function saveQuestion(event) {
    event.preventDefault();

    const response = await fetch("/api/admin/questions", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(questionForm),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage({ severity: "error", text: data.error || "Nie udalo sie zapisac pytania." });
      return;
    }

    await loadQuestions();
    resetQuestionForm();
    setMessage({
      severity: "success",
      text: editingId ? "Pytanie zaktualizowane." : "Pytanie dodane do puli.",
    });
  }

  async function removeQuestion(question) {
    const confirmed = window.confirm(`Usunac pytanie: "${question.text}"?`);

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/questions?id=${encodeURIComponent(question.id)}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage({ severity: "error", text: data.error || "Nie udalo sie usunac pytania." });
      return;
    }

    await loadQuestions();
    if (editingId === question.id) {
      resetQuestionForm();
    }
    setMessage({ severity: "success", text: "Pytanie usuniete." });
  }

  async function uploadVideo(event) {
    event.preventDefault();

    if (!videoFile) {
      setMessage({ severity: "warning", text: "Wybierz plik wideo." });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("video", videoFile);

    const response = await fetch("/api/admin/video", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);

    if (!response.ok) {
      setMessage({ severity: "error", text: data.error || "Nie udalo sie zapisac filmu." });
      return;
    }

    setVideoFile(null);
    event.target.reset();
    setMessage({ severity: "success", text: "Film zostal podmieniony." });
  }

  if (!authorized) {
    return (
      <Box component="main" className="app-shell">
        <Card component="form" onSubmit={handleLogin} elevation={0} sx={{ maxWidth: 520, mx: "auto", mt: 10 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Chip icon={<SecurityIcon />} label="Admin BHP" color="secondary" variant="outlined" sx={{ mb: 2 }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 1 }}>
              Logowanie pracownika BHP
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Dostep tylko dla upowaznionych pracownikow.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Login" value={login} onChange={(event) => setLogin(event.target.value)} required autoFocus />
              <TextField label="Haslo" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
              {loginError && <Alert severity="error">Nieprawidlowy login lub haslo.</Alert>}
              <Button type="submit" variant="contained" color="primary" size="large">
                Zaloguj
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box component="main" className="guard-shell">
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 3 }}>
        <Box>
          <Chip icon={<SecurityIcon />} label="Panel admina" color="secondary" variant="outlined" sx={{ mb: 1.5 }} />
          <Typography variant="h2" component="h1" sx={{ fontWeight: 900 }}>
            Administracja BHP
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
          <Button variant="outlined" color="secondary" size="small" startIcon={<LogoutIcon />} onClick={logout}>
            Wyloguj
          </Button>
        </Box>
      </Stack>

      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
            <Tab label="Pytania" value="questions" />
            <Tab label="Film" value="video" />
          </Tabs>

          {message && (
            <Alert severity={message.severity} sx={{ mb: 2.5 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {activeTab === "questions" && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Paper component="form" onSubmit={saveQuestion} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      {editingId ? "Edycja pytania" : "Nowe pytanie"}
                    </Typography>
                    {editingId && (
                      <Button size="small" onClick={resetQuestionForm}>
                        Anuluj
                      </Button>
                    )}
                  </Stack>

                  <Stack spacing={2}>
                    <TextField
                      label="Tresc pytania"
                      value={questionForm.text}
                      onChange={(event) => updateQuestionText(event.target.value)}
                      required
                      multiline
                      minRows={3}
                      fullWidth
                    />

                    <FormControl>
                      <FormLabel sx={{ fontWeight: 900, color: "text.primary", mb: 1 }}>
                        Odpowiedzi i poprawna opcja
                      </FormLabel>
                      <RadioGroup
                        value={questionForm.correctOptionId}
                        onChange={(event) =>
                          setQuestionForm((current) => ({
                            ...current,
                            correctOptionId: event.target.value,
                          }))
                        }
                      >
                        {questionForm.options.map((option) => (
                          <Stack direction="row" spacing={1.5} alignItems="center" key={option.id} sx={{ mb: 1.5 }}>
                            <FormControlLabel value={option.id} control={<Radio color="primary" />} label={option.id.toUpperCase()} />
                            <TextField
                              label={`Odpowiedz ${option.id.toUpperCase()}`}
                              value={option.text}
                              onChange={(event) => updateOption(option.id, event.target.value)}
                              required
                              fullWidth
                            />
                          </Stack>
                        ))}
                      </RadioGroup>
                    </FormControl>

                    <Button type="submit" variant="contained" color="primary" startIcon={editingId ? <SaveIcon /> : <AddIcon />}>
                      {editingId ? "Zapisz zmiany" : "Dodaj pytanie"}
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 7 }}>
                <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                      Pula pytan
                    </Typography>
                    <Chip label={`${questionCount} pytan`} color="secondary" variant="outlined" />
                  </Stack>

                  <Stack spacing={2}>
                    {questions.map((question, index) => (
                      <Paper key={question.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
                          <Box>
                            <Typography sx={{ fontWeight: 900, mb: 1 }}>
                              {index + 1}. {question.text}
                            </Typography>
                            <Stack spacing={0.75}>
                              {question.options.map((option) => (
                                <Typography key={option.id} variant="body2" color={option.id === question.correctOptionId ? "primary.main" : "text.secondary"}>
                                  {option.id.toUpperCase()}. {option.text}
                                  {option.id === question.correctOptionId ? " - poprawna" : ""}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1} alignSelf={{ xs: "flex-start", sm: "flex-start" }}>
                            <Button size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} onClick={() => editQuestion(question)}>
                              Edytuj
                            </Button>
                            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => removeQuestion(question)}>
                              Usun
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === "video" && (
            <Paper component="form" onSubmit={uploadVideo} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", maxWidth: 820 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                Podmiana filmu szkoleniowego
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Nowy plik zostanie zapisany lokalnie jako public/szkolenie-bhp.mp4.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Button variant="outlined" color="secondary" component="label" startIcon={<UploadFileIcon />} sx={{ alignSelf: "flex-start" }}>
                  Wybierz film
                  <input
                    hidden
                    type="file"
                    accept="video/*"
                    onChange={(event) => setVideoFile(event.target.files?.[0] || null)}
                  />
                </Button>
                <Typography color="text.secondary">
                  {videoFile ? `Wybrany plik: ${videoFile.name}` : "Nie wybrano pliku."}
                </Typography>
                {uploading && <LinearProgress color="primary" />}
                <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={uploading}>
                  Zapisz film
                </Button>
              </Stack>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
