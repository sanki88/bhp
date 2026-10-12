import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import AppThemeProvider from "./theme-provider";

export const metadata = {
  title: "BHP | Rejestracja i szkolenia",
  description: "Rejestracja gości, szkolenia BHP i panel ochrony.",
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
