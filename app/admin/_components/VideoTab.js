"use client";

import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { getVideoKey } from "@/lib/languages";

export default function VideoTab(props) {
  const visibleVideos = props.videos.filter(
    (video) => (video.language || "pl") === props.activeLanguage,
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 4 }}>
        <Paper component="form" onSubmit={props.uploadVideo} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Dodaj film szkoleniowy</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Nowy film zostanie zapisany i automatycznie ustawiony jako aktywny dla wybranej grupy.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <TextField label="Nazwa filmu" value={props.videoTitle} onChange={(event) => props.setVideoTitle(event.target.value)} placeholder="Np. BHP goscie - wersja maj" />
            <TextField select label="Grupa" value={props.videoAudience} onChange={(event) => props.setVideoAudience(event.target.value)}>
              <MenuItem value="guest">Dla gości</MenuItem>
              <MenuItem value="subcontractor">Dla podwykonawców</MenuItem>
            </TextField>
            <Button variant="outlined" color="secondary" component="label" startIcon={<UploadFileIcon />} sx={{ alignSelf: "flex-start" }}>
              Wybierz film
              <input hidden type="file" accept="video/*" onChange={(event) => props.setVideoFile(event.target.files?.[0] || null)} />
            </Button>
            <Typography color="text.secondary">
              {props.videoFile ? `Wybrany plik: ${props.videoFile.name}` : "Nie wybrano pliku."}
            </Typography>
            {props.uploading && <LinearProgress color="primary" />}
            <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={props.uploading}>
              Zapisz film
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Lista filmów</Typography>
          <Stack spacing={2}>
            {visibleVideos.map((video) => {
              const active =
                props.activeVideos[
                  getVideoKey(props.activeLanguage, video.audience)
                ] === video.id;

              return (
                <Paper key={video.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: active ? "primary.main" : "divider" }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>{video.title}</Typography>
                      <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                        {active && <Chip label="Aktywny" color="primary" size="small" />}
                        <Chip label={video.audience === "subcontractor" ? "Podwykonawcy" : "Goście"} color="secondary" variant="outlined" size="small" />
                        <Chip label={(video.language || "pl").toUpperCase()} variant="outlined" size="small" />
                      </Stack>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: "wrap", flexShrink: 0, alignSelf: { xs: "flex-start", md: "center" } }}
                    >
                      <Button size="small" variant="outlined" color="secondary" startIcon={<CheckCircleIcon />} disabled={active} onClick={() => props.activateVideo(video)}>
                        Ustaw aktywny
                      </Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={video.id.startsWith("default-")} onClick={() => props.removeVideo(video)}>
                        Usuń
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
            {visibleVideos.length === 0 && (
              <Typography color="text.secondary">
                Brak filmów dla wybranego języka. Dodaj film dla odpowiedniej
                grupy.
              </Typography>
            )}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
