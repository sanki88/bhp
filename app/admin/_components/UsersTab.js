"use client";

import { useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { clientFetch } from "@/lib/client-fetch";

const emptyForm = { username: "", role: "guard", password: "", confirmation: "" };
const roleLabel = (role) => role === "admin" ? "Administrator" : "Ochrona";

export default function UsersTab({ users, currentUserId, reloadUsers, onUnauthorized }) {
  const [form, setForm] = useState(emptyForm);
  const [dialog, setDialog] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState(null);
  const [dialogError, setDialogError] = useState("");
  const [busy, setBusy] = useState(false);
  const activeAdmins = users.filter((user) => user.active && user.role === "admin").length;

  function openDialog(user, action) {
    setDialog({ user, action }); setPassword(""); setConfirmation(""); setDialogError("");
  }
  function closeDialog() {
    if (busy) return;
    setDialog(null); setPassword(""); setConfirmation(""); setDialogError("");
  }
  async function request(method, body) {
    const response = await clientFetch("/api/admin/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (response.status === 401 || response.status === 403) onUnauthorized();
    if (!response.ok) throw new Error(data.error || "Nie udało się zapisać użytkownika.");
    return data;
  }
  async function createUser(event) {
    event.preventDefault();
    if (busy) return;
    setMessage(null);
    if (form.password !== form.confirmation) { setMessage({ severity: "error", text: "Podane hasła są różne." }); return; }
    setBusy(true);
    try {
      const data = await request("POST", { username: form.username, role: form.role, password: form.password });
      setForm(emptyForm);
      await reloadUsers();
      setMessage({ severity: "success", text: `Utworzono konto „${data.user.username}” z rolą: ${roleLabel(data.user.role)}.` });
    } catch (error) { setMessage({ severity: "error", text: error.message }); }
    finally { setBusy(false); }
  }
  async function updateUser(event) {
    event.preventDefault();
    if (busy || !dialog) return;
    setDialogError("");
    if (dialog.action === "password" && password !== confirmation) { setDialogError("Podane hasła są różne."); return; }
    setBusy(true);
    try {
      const data = await request("PATCH", { id: dialog.user.id, action: dialog.action, ...(dialog.action === "password" ? { password } : {}) });
      const text = dialog.action === "password" ? "Hasło zmienione. Dotychczasowe sesje konta zostały zakończone." : dialog.action === "disable" ? "Konto zablokowane i wylogowane ze wszystkich urządzeń." : "Konto odblokowane. Użytkownik może się zalogować.";
      setDialog(null); setPassword(""); setConfirmation("");
      if (data.signOut) { onUnauthorized(); return; }
      await reloadUsers();
      setMessage({ severity: "success", text });
    } catch (error) { setDialogError(error.message); }
    finally { setBusy(false); }
  }

  return <Stack spacing={3}>
    {message && <Alert severity={message.severity} onClose={() => setMessage(null)}>{message.text}</Alert>}
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper component="form" onSubmit={createUser} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Stack spacing={2}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>Nowy użytkownik</Typography>
            <TextField label="Login użytkownika" autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required disabled={busy} helperText="3–80 znaków: litery a–z, cyfry, kropka, myślnik lub podkreślenie." slotProps={{ htmlInput: { minLength: 3, maxLength: 80, pattern: "[a-zA-Z0-9._\\-]{3,80}" } }} />
            <TextField select label="Rola" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} disabled={busy} helperText={form.role === "admin" ? "Zarządzanie rejestrem, szkoleniami i kontami użytkowników." : "Dostęp do podglądu rejestru osób."}>
              <MenuItem value="guard">Ochrona</MenuItem><MenuItem value="admin">Administrator</MenuItem>
            </TextField>
            <TextField label="Hasło nowego użytkownika" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required disabled={busy} helperText="Od 12 do 128 znaków. Przekaż hasło właścicielowi konta." slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} />
            <TextField label="Powtórz hasło" type="password" autoComplete="new-password" value={form.confirmation} onChange={(event) => setForm({ ...form, confirmation: event.target.value })} required disabled={busy} slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} />
            <Button type="submit" variant="contained" startIcon={<PersonAddIcon />} disabled={busy}>{busy ? "Zapisywanie…" : "Dodaj użytkownika"}</Button>
          </Stack>
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Stack spacing={2}>
          <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>Konta użytkowników</Typography>
            <Button onClick={reloadUsers} disabled={busy}>Odśwież</Button>
          </Stack>
          {users.map((user) => {
            const lastAdmin = user.active && user.role === "admin" && activeAdmins === 1;
            return <Paper key={user.id} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{user.username}{user.id === currentUserId ? " (Twoje konto)" : ""}</Typography>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    <Chip size="small" label={roleLabel(user.role)} variant="outlined" />
                    <Chip size="small" label={user.active ? "Aktywne" : "Zablokowane"} color={user.active ? "success" : "default"} />
                  </Stack>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="outlined" onClick={() => openDialog(user, "password")} disabled={busy} aria-label={`Zmień hasło użytkownika ${user.username}`}>Zmień hasło</Button>
                  <Button variant="outlined" color={user.active ? "error" : "success"} onClick={() => openDialog(user, user.active ? "disable" : "enable")} disabled={busy || lastAdmin} aria-label={`${user.active ? "Zablokuj" : "Odblokuj"} użytkownika ${user.username}`}>{user.active ? "Zablokuj" : "Odblokuj"}</Button>
                </Stack>
                {lastAdmin && <Typography variant="body2" color="text.secondary">Ostatni aktywny administrator — blokada tego konta jest niedostępna.</Typography>}
              </Stack>
            </Paper>;
          })}
          {!users.length && <Typography color="text.secondary">Brak kont do wyświetlenia.</Typography>}
        </Stack>
      </Grid>
    </Grid>
    <Dialog open={Boolean(dialog)} onClose={closeDialog} fullWidth maxWidth="sm" aria-labelledby="user-action-title">
      <Box component="form" onSubmit={updateUser}>
        <DialogTitle id="user-action-title">{dialog?.action === "password" ? "Zmień hasło" : dialog?.action === "disable" ? "Zablokuj konto" : "Odblokuj konto"}: {dialog?.user.username}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {dialog?.action === "password" ? <>
            <Typography>Ustaw nowe hasło. Wszystkie dotychczasowe sesje tego konta zostaną zakończone.</Typography>
            <TextField label="Nowe hasło" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={busy} autoFocus helperText="Od 12 do 128 znaków." slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} />
            <TextField label="Powtórz nowe hasło" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required disabled={busy} slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} />
          </> : <Typography>{dialog?.action === "disable" ? "Użytkownik zostanie wylogowany ze wszystkich urządzeń. Dostęp będzie można później przywrócić." : "Użytkownik będzie mógł ponownie zalogować się dotychczasowym hasłem."}</Typography>}
          {dialog?.user.id === currentUserId && <Alert severity="info">Zmieniasz własne konto. Po zapisaniu zostaniesz wylogowany.</Alert>}
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
        </Stack></DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={closeDialog} disabled={busy}>Anuluj</Button><Button type="submit" variant="contained" color={dialog?.action === "disable" ? "error" : "primary"} disabled={busy}>{busy ? "Zapisywanie…" : "Potwierdź"}</Button></DialogActions>
      </Box>
    </Dialog>
  </Stack>;
}
