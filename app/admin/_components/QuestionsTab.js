"use client";

import {
  Box,
  Button,
  Chip,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

export const emptyQuestion = {
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

export default function QuestionsTab(props) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Paper component="form" onSubmit={props.saveQuestion} elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {props.editingId ? "Edycja pytania" : "Nowe pytanie"}
            </Typography>
            {props.editingId && <Button size="small" onClick={props.resetQuestionForm}>Anuluj</Button>}
          </Stack>

          <Stack spacing={2}>
            <TextField label="Treść pytania" value={props.questionForm.text} onChange={(event) => props.updateQuestionText(event.target.value)} required multiline minRows={3} fullWidth />
            <FormControl>
              <FormLabel sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
                Odpowiedzi i poprawna opcja
              </FormLabel>
              <RadioGroup
                value={props.questionForm.correctOptionId}
                onChange={(event) =>
                  props.setQuestionForm((current) => ({
                    ...current,
                    correctOptionId: event.target.value,
                  }))
                }
              >
                {props.questionForm.options.map((option) => (
                  <Stack direction="row" spacing={1.5} key={option.id} sx={{ mb: 1.5, alignItems: "center" }}>
                    <FormControlLabel value={option.id} control={<Radio color="primary" />} label={option.id.toUpperCase()} />
                    <TextField label={`Odpowiedź ${option.id.toUpperCase()}`} value={option.text} onChange={(event) => props.updateOption(option.id, event.target.value)} required fullWidth />
                  </Stack>
                ))}
              </RadioGroup>
            </FormControl>
            <Button type="submit" variant="contained" color="primary" startIcon={props.editingId ? <SaveIcon /> : <AddIcon />}>
              {props.editingId ? "Zapisz zmiany" : "Dodaj pytanie"}
            </Button>
          </Stack>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: "wrap", mb: 2, alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Pula pytań</Typography>
            <Chip label={`Liczba pytań: ${props.questionCount}`} color="secondary" variant="outlined" />
          </Stack>
          <Stack spacing={2}>
            {props.questions.map((question, index) => (
              <Paper key={question.id} elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{index + 1}. {question.text}</Typography>
                    <Stack spacing={0.75}>
                      {question.options.map((option) => (
                        <Typography key={option.id} variant="body2" color={option.id === question.correctOptionId ? "primary.main" : "text.secondary"}>
                          {option.id.toUpperCase()}. {option.text}
                          {option.id === question.correctOptionId ? " - poprawna" : ""}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", flexShrink: 0, alignSelf: "flex-start" }}>
                    <Button size="small" variant="outlined" color="secondary" startIcon={<EditIcon />} onClick={() => props.editQuestion(question)}>Edytuj</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => props.removeQuestion(question)}>Usuń</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
          {!props.questions.length && <Typography color="text.secondary">Brak pytań w tym języku. Dodaj pierwsze pytanie, korzystając z formularza.</Typography>}
        </Paper>
      </Grid>
    </Grid>
  );
}
