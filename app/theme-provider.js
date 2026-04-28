"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#E40045",
      dark: "#B50037",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#303C49",
      dark: "#202832",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#303C49",
      secondary: "#66717D",
    },
    divider: "#D9DDE1",
    background: {
      default: "#F4F5F6",
      paper: "#FFFFFF",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h1: { letterSpacing: 0 },
    h2: { letterSpacing: 0 },
    h3: { letterSpacing: 0 },
    h4: { letterSpacing: 0 },
    button: {
      fontWeight: 800,
      textTransform: "none",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #D9DDE1",
          boxShadow: "0 24px 70px rgba(48, 60, 73, 0.12)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 800,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#303C49",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: "#FFFFFF",
          fontSize: "0.78rem",
          fontWeight: 900,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        },
      },
    },
  },
});

export default function AppThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
