"use client";

import Link from "next/link";
import { clientFetch } from "@/lib/client-fetch";
import StaffLogin from "@/_components/StaffLogin";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import BrandHeader from "@/_components/BrandHeader";
import GuardVisitorsTable from "./GuardVisitorsTable";

export default function GuardPanel({ initialVisitors = null }) {
  const [authorized, setAuthorized] = useState(Boolean(initialVisitors));
  const [visitors, setVisitors] = useState(initialVisitors || []);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function loadVisitors() {
    const response = await clientFetch("/api/visitors", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) { if (response.status === 401) setAuthorized(false); setError(data.error); return false; }
    setError("");
    setVisitors(data.visitors || []);
  }

  const filteredVisitors = useMemo(() => {
    const phrase = query.trim().toLowerCase();

    if (!phrase) {
      return visitors;
    }

    return visitors.filter((visitor) => {
      return [
        visitor.firstName,
        visitor.lastName,
        visitor.company,
        visitor.phone,
        visitor.visitPurpose,
      ]
        .join(" ")
        .toLowerCase()
        .includes(phrase);
    });
  }, [query, visitors]);

  async function handleLogin() {
    if (await loadVisitors() === false) throw new Error("Nie udało się pobrać rejestru.");
    setAuthorized(true);
  }
  async function logout() {
    const response = await clientFetch("/api/auth/logout", { method: "POST" });
    if (response.ok) { setAuthorized(false); setVisitors([]); }
    else setError("Nie udało się wylogować. Spróbuj ponownie.");
  }
  if (!authorized) return <StaffLogin panel="guard" onLogin={handleLogin} />;

  return (
    <Box component="main" className="guard-shell">
      <BrandHeader title="Zaliczone szkolenia" eyebrow="Panel ochrony" subtitle="Sprawdź szkolenie i uprawnienia osoby przed wejściem." actions={<>
        <Button component={Link} href="/" variant="outlined" color="secondary" startIcon={<BadgeIcon />}>Rejestracja</Button>
        <Button variant="outlined" color="secondary" onClick={logout}>Wyloguj</Button>
      </>} />

      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 2.5, justifyContent: "space-between" }}
          >
            <TextField
              label="Szukaj gościa"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nazwisko, firma, telefon..."
              fullWidth
              sx={{ maxWidth: { md: 560 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={loadVisitors}
            >
              Odśwież
            </Button>
          </Stack>

          <GuardVisitorsTable visitors={filteredVisitors} />

          {filteredVisitors.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Brak pasujących wpisów.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
