"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LoginIcon from "@mui/icons-material/Login";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";

const passValidityDays = 183;

export default function GuardPanel() {
  const [pin, setPin] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [query, setQuery] = useState("");
  const [pinError, setPinError] = useState(false);

  async function loadVisitors() {
    const response = await fetch("/api/visitors", { cache: "no-store" });
    const data = await response.json();
    setVisitors(data.visitors);
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
        visitor.passNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(phrase);
    });
  }, [query, visitors]);

  if (!authorized) {
    return (
      <Box component="main" className="guard-shell">
        <Card
          component="form"
          elevation={0}
          className="pin-panel"
          onSubmit={handlePinSubmit}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Chip
            icon={<SecurityIcon />}
            label="Panel ochrony"
              color="secondary"
              variant="outlined"
              sx={{ mb: 2, fontWeight: 800 }}
            />
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: 900, mb: 3 }}
            >
              Dostep do listy zaliczonych gosci
            </Typography>
            <TextField
              label="PIN"
              value={pin}
              onChange={(event) => {
                setPin(event.target.value);
                setPinError(false);
              }}
              inputMode="numeric"
              type="password"
              autoFocus
              required
              fullWidth
              error={pinError}
              helperText={
                pinError ? "Nieprawidlowy PIN." : "Wpisz PIN ochrony."
              }
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<LoginIcon />}
            >
              Otworz panel
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box component="main" className="guard-shell">
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
            label="Panel ochrony"
            color="secondary"
            variant="outlined"
            sx={{ mb: 1.5, fontWeight: 800 }}
          />
          <Typography variant="h2" component="h1" sx={{ fontWeight: 900 }}>
            Zaliczone szkolenie
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            color="secondary"
            startIcon={<BadgeIcon />}
            size="small"
            sx={{ px: 1.5 }}
          >
            Rejestracja
          </Button>
        </Box>
      </Stack>

      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            sx={{ mb: 2.5 }}
          >
            <TextField
              label="Szukaj goscia"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nazwisko, firma, telefon..."
              fullWidth
              sx={{ maxWidth: { md: 680 } }}
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
              Odswiez
            </Button>
          </Stack>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              maxWidth: "100%",
              overflowX: "auto",
            }}
          >
            <Table aria-label="Zaliczone szkolenia" sx={{ minWidth: 1480 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 220 }}>Gosc</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>Firma</TableCell>
                  <TableCell sx={{ minWidth: 360 }}>Cel</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Telefon</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Data szkolenia</TableCell>
                  <TableCell sx={{ minWidth: 190 }}>Przepustka</TableCell>
                  <TableCell sx={{ minWidth: 260 }}>Waznosc</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVisitors.map((visitor) => {
                  const validity = getValidity(visitor);

                  return (
                    <TableRow key={visitor.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>
                          {visitor.firstName} {visitor.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>{visitor.company}</TableCell>
                      <TableCell>
                        <Typography sx={{ maxWidth: 460, whiteSpace: "normal" }}>
                          {visitor.visitPurpose}
                        </Typography>
                      </TableCell>
                      <TableCell>{visitor.phone}</TableCell>
                      <TableCell>
                        {formatDateTime(visitor.completedAt)}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 900 }}>
                          {visitor.passNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Stack spacing={0.75}>
                          <Chip
                            icon={<CalendarMonthIcon />}
                            label={validity.label}
                            color={
                              validity.expired
                                ? "error"
                                : validity.daysLeft <= 30
                                  ? "warning"
                                  : "success"
                            }
                            variant={validity.expired ? "filled" : "outlined"}
                            size="small"
                          />
                          <LinearProgress
                            variant="determinate"
                            value={validity.percentLeft}
                            color={
                              validity.expired
                                ? "error"
                                : validity.daysLeft <= 30
                                  ? "warning"
                                  : "success"
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            Do: {formatDate(visitor.expiresAt)}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredVisitors.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Brak pasujacych wpisow.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  async function handlePinSubmit(event) {
    event.preventDefault();

    if (pin !== "2468") {
      setPinError(true);
      return;
    }

    await loadVisitors();
    setAuthorized(true);
  }
}

function getValidity(visitor) {
  const expiresAt = new Date(
    visitor.expiresAt || addMonths(visitor.completedAt, 6),
  );
  const now = new Date();
  const millisecondsLeft = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.ceil(millisecondsLeft / 86400000);
  const expired = daysLeft < 0;
  const percentLeft = expired
    ? 0
    : Math.min(100, Math.max(0, (daysLeft / passValidityDays) * 100));

  return {
    daysLeft,
    expired,
    percentLeft,
    label: expired
      ? `Wygasla ${Math.abs(daysLeft)} dni temu`
      : `Pozostalo ${daysLeft} dni`,
  };
}

function addMonths(value, months) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("pl-PL");
}
