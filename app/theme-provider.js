"use client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
const heading = { fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.025em", overflowWrap: "anywhere" };
const theme = createTheme({
  palette: {
    primary: { main: "#d50040", dark: "#ae0034", contrastText: "#ffffff" },
    secondary: { main: "#344454", dark: "#253342", contrastText: "#ffffff" },
    text: { primary: "#253342", secondary: "#657383" },
    divider: "#dfe5eb",
    background: { default: "#f4f6f8", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Segoe UI", Arial, Helvetica, sans-serif',
    h1: { ...heading, fontSize: "clamp(1.8rem, 1.2rem + 2.2vw, 2.75rem)" },
    h2: { ...heading, fontSize: "clamp(1.7rem, 1.2rem + 1.8vw, 2.4rem)" },
    h3: { ...heading, fontSize: "clamp(1.5rem, 1.1rem + 1.3vw, 2rem)" },
    h4: { ...heading, fontSize: "clamp(1.4rem, 1.05rem + 1vw, 1.8rem)" },
    h5: { ...heading, fontSize: "clamp(1.2rem, 1.05rem + 0.6vw, 1.4rem)" },
    h6: { ...heading, fontSize: "1.1rem" },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.55 },
    button: { fontWeight: 600, textTransform: "none", lineHeight: 1.4 },
    overline: { fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1.8, fontSize: "0.7rem" },
  },
  components: {
    MuiTypography: { styleOverrides: { root: { minWidth: 0, overflowWrap: "anywhere" } } },
    MuiGrid: { styleOverrides: { root: { minWidth: 0 } } },
    MuiPaper: { styleOverrides: { root: { minWidth: 0 } } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: "0.875rem" } } },
    MuiCard: { styleOverrides: { root: { border: "1px solid #dfe5eb", boxShadow: "0 4px 24px rgba(37, 51, 66, 0.04)" } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 42, borderRadius: 8, padding: "9px 16px", overflowWrap: "anywhere" },
        sizeSmall: { minHeight: 36, padding: "6px 12px" },
        sizeLarge: { minHeight: 48, padding: "12px 22px" },
        outlinedSecondary: { borderColor: "#d6dde5", backgroundColor: "#fff" },
      },
    },
    MuiOutlinedInput: { styleOverrides: {
      root: { borderRadius: 8, backgroundColor: "#fff", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#8a97a4" } },
      notchedOutline: { borderColor: "#d6dde5" },
    } },
    MuiChip: { styleOverrides: {
      root: { maxWidth: "100%", height: "auto", minHeight: 26, fontWeight: 600, borderRadius: 6 },
      label: { display: "block", paddingTop: 3, paddingBottom: 3, whiteSpace: "normal", overflowWrap: "anywhere" },
    } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10 }, message: { minWidth: 0, overflowWrap: "anywhere" } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, minHeight: 48 } } },
    MuiTabs: { styleOverrides: { root: { borderBottom: "1px solid #dfe5eb" } } },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: "#f0f3f6" } } },
    MuiTableCell: { styleOverrides: {
      root: { borderBottomColor: "#e8edf1" },
      head: { color: "#536272", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.035em", textTransform: "uppercase", whiteSpace: "normal" },
    } },
    MuiDialogTitle: { styleOverrides: { root: { overflowWrap: "anywhere" } } },
  },
});
export default function AppThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
