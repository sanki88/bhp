import "./globals.css";
import AppThemeProvider from "./theme-provider";

export const metadata = {
  title: "BHP dla gosci",
  description: "Rejestracja gosci, szkolenie BHP i panel ochrony.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
