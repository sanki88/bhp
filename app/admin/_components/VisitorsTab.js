"use client";

import {
  Alert,
  Button,
  Chip,
  InputAdornment,
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
import BlockIcon from "@mui/icons-material/Block";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import { formatDateTime } from "../_helpers/date";

export default function VisitorsTab(props) {
  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <TextField
          label="Szukaj w rejestrze"
          value={props.visitorQuery}
          onChange={(event) => props.setVisitorQuery(event.target.value)}
          fullWidth
          sx={{ maxWidth: { md: 520 } }}
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
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button variant="outlined" color="secondary" onClick={props.loadVisitors}>Odśwież</Button>
          <Button component="a" href="/api/admin/visitors/export" variant="contained" color="primary" startIcon={<DownloadIcon />}>
            Eksport Excel
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} elevation={0} tabIndex={0} role="region" aria-label="Przewijany rejestr BHP" sx={{ border: "1px solid", borderColor: "divider" }}>
        <Table
          aria-label="Rejestr BHP"
          size="small"
          sx={{
            tableLayout: "fixed",
            width: "100%",
            minWidth: 860,
            "& .MuiTableCell-root": {
              px: 1,
              py: 0.75,
              fontSize: 13,
              overflowWrap: "anywhere",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "15%" }}>Osoba</TableCell>
              <TableCell sx={{ width: "10%" }}>Typ</TableCell>
              <TableCell sx={{ width: "14%" }}>Firma</TableCell>
              <TableCell sx={{ width: "20%" }}>Cel</TableCell>
              <TableCell sx={{ width: "11%" }}>Telefon</TableCell>
              <TableCell sx={{ width: "13%" }}>Data</TableCell>
              <TableCell sx={{ width: "10%" }}>Black list</TableCell>
              <TableCell sx={{ width: "7%" }}>Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.visitors.map((visitor) => (
              <TableRow
                key={visitor.id}
                hover
                sx={{
                  backgroundColor: visitor.blacklisted ? "rgba(211, 47, 47, 0.10)" : "inherit",
                  "&:hover": {
                    backgroundColor: visitor.blacklisted ? "rgba(211, 47, 47, 0.16)" : undefined,
                  },
                }}
              >
                <TableCell>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{visitor.firstName} {visitor.lastName}</Typography>
                </TableCell>
                <TableCell>{visitor.visitorType === "subcontractor" ? "Podwyk." : "Gosc"}</TableCell>
                <TableCell>{visitor.company}</TableCell>
                <TableCell><Typography sx={{ whiteSpace: "normal", fontSize: 13 }}>{visitor.visitPurpose}</Typography></TableCell>
                <TableCell>{visitor.phone}</TableCell>
                <TableCell>{formatDateTime(visitor.completedAt)}</TableCell>
                <TableCell>
                  {visitor.blacklisted ? (
                    <Stack spacing={0.5}>
                      <Chip label="BLACK LIST" color="error" icon={<BlockIcon />} size="small" />
                      <Typography variant="caption" color="error.main">{visitor.blacklistReason || "Brak powodu"}</Typography>
                    </Stack>
                  ) : (
                    <Chip label="Nie" color="success" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" color={visitor.blacklisted ? "secondary" : "error"} onClick={() => props.toggleBlacklist(visitor)}>
                    {visitor.blacklisted ? "Usun" : "Dodaj"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {props.visitors.length === 0 && <Alert severity="info">Brak pasujacych wpisow.</Alert>}
    </Stack>
  );
}
