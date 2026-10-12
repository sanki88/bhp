"use client";

import { clientFetch } from "@/lib/client-fetch";
import StaffLogin from "@/_components/StaffLogin";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  MenuItem,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import BrandHeader from "@/_components/BrandHeader";
import QuestionsTab, { emptyQuestion } from "./QuestionsTab";
import VideoTab from "./VideoTab";
import VisitorsTab from "./VisitorsTab";
import UsersTab from "./UsersTab";
import { languages } from "@/lib/languages";

export default function AdminPanel({ initialData = null }) {
  const [authorized, setAuthorized] = useState(Boolean(initialData));
  const [activeTab, setActiveTab] = useState("questions");
  const [activeLanguage, setActiveLanguage] = useState("pl");
  const [questions, setQuestions] = useState(initialData?.questions || []);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoAudience, setVideoAudience] = useState("guest");
  const [videoTitle, setVideoTitle] = useState("");
  const [videos, setVideos] = useState(initialData?.videoStore.videos || []);
  const [activeVideos, setActiveVideos] = useState(initialData?.videoStore.active || {});
  const [uploading, setUploading] = useState(false);
  const [visitors, setVisitors] = useState(initialData?.visitors || []);
  const [visitorQuery, setVisitorQuery] = useState("");
  const [users, setUsers] = useState(initialData?.users || []);
  const [currentUserId, setCurrentUserId] = useState(initialData?.currentUserId || null);

  const questionCount = useMemo(() => questions.length, [questions]);
  const filteredVisitors = useMemo(() => {
    const phrase = visitorQuery.trim().toLowerCase();

    if (!phrase) {
      return visitors;
    }

    return visitors.filter((visitor) =>
      [
        visitor.firstName,
        visitor.lastName,
        visitor.company,
        visitor.phone,
        visitor.visitPurpose,
        visitor.blacklistReason,
      ]
        .join(" ")
        .toLowerCase()
        .includes(phrase),
    );
  }, [visitorQuery, visitors]);

  async function loadQuestions() {
    const response = await clientFetch(
      `/api/admin/questions?language=${activeLanguage}`,
      { cache: "no-store" },
    );
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);
    if (!response.ok) { setMessage({ severity: "error", text: data.error || "Nie udało się pobrać danych." }); return false; }
    setQuestions(data.questions || []);
  }

  async function loadVideos() {
    const response = await clientFetch("/api/admin/video", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);
    if (!response.ok) { setMessage({ severity: "error", text: data.error || "Nie udało się pobrać danych." }); return false; }
    setVideos(data.videos || []);
    setActiveVideos(data.active || {});
  }

  async function loadVisitors() {
    const response = await clientFetch("/api/visitors", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);
    if (!response.ok) { setMessage({ severity: "error", text: data.error || "Nie udało się pobrać danych." }); return false; }
    setVisitors(data.visitors || []);
  }

  async function loadUsers() {
    const response = await clientFetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) setAuthorized(false);
    if (!response.ok) { setMessage({ severity: "error", text: data.error || "Nie udało się pobrać użytkowników." }); return false; }
    setUsers(data.users || []); setCurrentUserId(data.currentUserId);
  }

  async function handleLogin() {
    const results = await Promise.all([loadQuestions(), loadVideos(), loadVisitors(), loadUsers()]);
    if (results.includes(false)) throw new Error("Nie udało się pobrać danych panelu.");
    setAuthorized(true);
  }
  async function logout() {
    try {
      const response = await clientFetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      setAuthorized(false);
      setVisitors([]); setQuestions([]); setVideos([]);
      setUsers([]); setCurrentUserId(null);
    } catch { setMessage({ severity: "error", text: "Nie udało się wylogować. Spróbuj ponownie." }); }
  }

  function updateQuestionText(value) {
    setQuestionForm((current) => ({ ...current, text: value }));
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

    const response = await clientFetch("/api/admin/questions", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...questionForm, language: activeLanguage }),
    });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);

    if (!response.ok) {
      setMessage({
        severity: "error",
        text: data.error || "Nie udalo sie zapisac pytania.",
      });
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
    if (!window.confirm(`Usunac pytanie: "${question.text}"?`)) {
      return;
    }

    const response = await clientFetch(
      `/api/admin/questions?id=${encodeURIComponent(question.id)}&language=${activeLanguage}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);

    if (!response.ok) {
      setMessage({
        severity: "error",
        text: data.error || "Nie udalo sie usunac pytania.",
      });
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
    formData.append("audience", videoAudience);
    formData.append("language", activeLanguage);
    formData.append("title", videoTitle);

    const response = await clientFetch("/api/admin/video", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);
    setUploading(false);

    if (!response.ok) {
      setMessage({
        severity: "error",
        text: data.error || "Nie udalo sie zapisac filmu.",
      });
      return;
    }

    setVideoFile(null);
    setVideoTitle("");
    event.target.reset();
    await loadVideos();
    setMessage({ severity: "success", text: "Film dodany i ustawiony jako aktywny." });
  }

  async function activateVideo(video) {
    const response = await clientFetch("/api/admin/video", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: video.id }),
    });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);

    if (!response.ok) {
      setMessage({ severity: "error", text: data.error || "Nie udalo sie ustawic filmu." });
      return;
    }

    await loadVideos();
    setMessage({ severity: "success", text: "Aktywny film zostal zmieniony." });
  }

  async function removeVideo(video) {
    if (!window.confirm(`Usunac film: "${video.title}"?`)) {
      return;
    }

    const response = await clientFetch(`/api/admin/video?id=${encodeURIComponent(video.id)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);

    if (!response.ok) {
      setMessage({ severity: "error", text: data.error || "Nie udalo sie usunac filmu." });
      return;
    }

    await loadVideos();
    setMessage({ severity: "success", text: "Film usuniety." });
  }

  async function toggleBlacklist(visitor) {
    const blacklisted = !visitor.blacklisted;
    const blacklistReason = blacklisted
      ? window.prompt("Powod dodania do black list:", visitor.blacklistReason || "") || ""
      : "";

    if (blacklisted && !blacklistReason.trim()) {
      return;
    }

    const response = await clientFetch("/api/visitors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: visitor.id, blacklisted, blacklistReason }),
    });
    const data = await response.json();
    if (response.status === 401) setAuthorized(false);

    if (!response.ok) {
      setMessage({
        severity: "error",
        text: data.error || "Nie udalo sie zaktualizowac black list.",
      });
      return;
    }

    await loadVisitors();
    setMessage({
      severity: "success",
      text: blacklisted ? "Osoba dodana do black list." : "Osoba usunieta z black list.",
    });
  }

  if (!authorized) return <StaffLogin panel="admin" onLogin={handleLogin} />;

  return (
    <Box component="main" className="guard-shell">
      <BrandHeader title="Administracja BHP" eyebrow="Panel administratora" subtitle="Zarządzaj szkoleniami, rejestrem i dostępem pracowników." actions={
        <Button variant="outlined" color="secondary" startIcon={<LogoutIcon />} onClick={logout}>Wyloguj</Button>
      } />

      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} aria-label="Sekcje administracji" sx={{ mb: 3, "& .MuiTab-root": { minWidth: 0, px: { xs: 0.75, sm: 2 }, fontSize: { xs: "0.75rem", sm: "0.875rem" }, flexGrow: { xs: 1, sm: 0 }, overflowWrap: "anywhere" } }}>
            <Tab label="Pytania" value="questions" />
            <Tab label="Filmy" value="video" />
            <Tab label="Rejestr" value="visitors" />
            <Tab label="Użytkownicy" value="users" />
          </Tabs>
          {(activeTab === "questions" || activeTab === "video") && <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2.5, alignItems: { xs: "stretch", sm: "center" } }}
          >
            <TextField
              select
              label="Język szkolenia"
              value={activeLanguage}
              onChange={async (event) => {
                const nextLanguage = event.target.value;
                setActiveLanguage(nextLanguage);
                setEditingId(null);
                setQuestionForm(emptyQuestion);
                const response = await clientFetch(
                  `/api/admin/questions?language=${nextLanguage}`,
                  { cache: "no-store" },
                );
                const data = await response.json();
                if (response.status === 401) setAuthorized(false);
                if (!response.ok) { setMessage({ severity: "error", text: data.error || "Nie udało się pobrać danych." }); return false; }
                setQuestions(data.questions || []);
              }}
              sx={{ width: { xs: "100%", sm: 240 } }}
            >
              {languages.map((language) => (
                <MenuItem key={language.code} value={language.code}>
                  {language.flag} {language.label}
                </MenuItem>
              ))}
            </TextField>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
              Pytania i aktywne filmy są oddzielne dla każdego języka.
            </Typography>
          </Stack>}


          {message && (
            <Alert severity={message.severity} sx={{ mb: 2.5 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {activeTab === "questions" && (
            <QuestionsTab
              questionCount={questionCount}
              activeLanguage={activeLanguage}
              questions={questions}
              questionForm={questionForm}
              editingId={editingId}
              updateQuestionText={updateQuestionText}
              updateOption={updateOption}
              setQuestionForm={setQuestionForm}
              saveQuestion={saveQuestion}
              editQuestion={editQuestion}
              removeQuestion={removeQuestion}
              resetQuestionForm={resetQuestionForm}
            />
          )}

          {activeTab === "video" && (
            <VideoTab
              videos={videos}
              activeVideos={activeVideos}
              activeLanguage={activeLanguage}
              videoAudience={videoAudience}
              videoTitle={videoTitle}
              videoFile={videoFile}
              uploading={uploading}
              setVideoAudience={setVideoAudience}
              setVideoTitle={setVideoTitle}
              setVideoFile={setVideoFile}
              uploadVideo={uploadVideo}
              activateVideo={activateVideo}
              removeVideo={removeVideo}
            />
          )}

          {activeTab === "visitors" && (
            <VisitorsTab
              visitors={filteredVisitors}
              visitorQuery={visitorQuery}
              setVisitorQuery={setVisitorQuery}
              loadVisitors={loadVisitors}
              toggleBlacklist={toggleBlacklist}
            />
          )}
          {activeTab === "users" && <UsersTab users={users} currentUserId={currentUserId} reloadUsers={loadUsers} onUnauthorized={() => setAuthorized(false)} />}
        </CardContent>
      </Card>
    </Box>
  );
}
