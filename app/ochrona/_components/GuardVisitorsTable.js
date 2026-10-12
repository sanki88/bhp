"use client";

import {
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { formatDate, formatDateTime } from "../_helpers/date";
import { getValidity } from "../_helpers/validity";

export default function GuardVisitorsTable({ visitors }) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      tabIndex={0}
      role="region"
      aria-label="Przewijany rejestr szkoleń"
      sx={{
        border: "1px solid",
        borderColor: "divider",
        maxWidth: "100%",
      }}
    >
      <Table
        aria-label="Zaliczone szkolenia"
        size="small"
        sx={{
          tableLayout: "fixed",
          width: "100%",
          minWidth: 820,
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
            <TableCell sx={{ width: "17%" }}>Gość</TableCell>
            <TableCell sx={{ width: "15%" }}>Firma</TableCell>
            <TableCell sx={{ width: "23%" }}>Cel</TableCell>
            <TableCell sx={{ width: "12%" }}>Telefon</TableCell>
            <TableCell sx={{ width: "13%" }}>Data szkolenia</TableCell>
            <TableCell sx={{ width: "10%" }}>Black list</TableCell>
            <TableCell sx={{ width: "10%" }}>Ważność</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visitors.map((visitor) => {
            const validity = getValidity(visitor);

            return (
              <TableRow
                key={visitor.id}
                hover
                sx={{
                  backgroundColor: visitor.blacklisted
                    ? "rgba(211, 47, 47, 0.10)"
                    : "inherit",
                  "&:hover": {
                    backgroundColor: visitor.blacklisted
                      ? "rgba(211, 47, 47, 0.16)"
                      : undefined,
                  },
                }}
              >
                <TableCell>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {visitor.firstName} {visitor.lastName}
                  </Typography>
                </TableCell>
                <TableCell>{visitor.company}</TableCell>
                <TableCell>
                  <Typography sx={{ whiteSpace: "normal", fontSize: 13 }}>
                    {visitor.visitPurpose}
                  </Typography>
                </TableCell>
                <TableCell>{visitor.phone}</TableCell>
                <TableCell>{formatDateTime(visitor.completedAt)}</TableCell>
                <TableCell>
                  {visitor.blacklisted ? (
                    <Stack spacing={0.5}>
                      <Chip
                        icon={<BlockIcon />}
                        label="BLACK"
                        color="error"
                        size="small"
                      />
                      <Typography variant="caption" color="error.main">
                        {visitor.blacklistReason || "Brak powodu"}
                      </Typography>
                    </Stack>
                  ) : (
                    <Chip label="Nie" color="success" variant="outlined" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
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
  );
}
