"use client";
import { useState } from "react";
import Link from "next/link";
import BrandHeader from "./BrandHeader";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Alert, Box, Button, Card, CardContent, Stack, TextField } from "@mui/material";
export default function StaffLogin({ panel, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, panel }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPassword("");
      await onLogin();
    } catch (error) { setError(error.message || "Nie udało się zalogować."); }
    finally { setBusy(false); }
  }
  return <Box component="main" className="app-shell"><Card component="form" onSubmit={submit} elevation={0} sx={{ maxWidth: 520, mx: "auto", mt: { xs: 0, sm: 5 } }}><CardContent sx={{ p: { xs: 2.5, sm: 4 }, "& .brand-heading": { flexDirection: "column", alignItems: "flex-start", gap: 2.5 } }}>
    <BrandHeader title={panel === "admin" ? "Logowanie pracownika BHP" : "Logowanie ochrony"} eyebrow="Dostęp pracowników" subtitle="Zaloguj się przy użyciu swojego konta." />
    <Stack spacing={2}>
      <TextField label="Login" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
      <TextField label="Hasło" autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" disabled={busy}>{busy ? "Logowanie…" : "Zaloguj"}</Button>
      <Button component={Link} href="/" color="secondary" startIcon={<ArrowBackIcon />}>Wróć do rejestracji</Button>
    </Stack>
  </CardContent></Card></Box>;
}
