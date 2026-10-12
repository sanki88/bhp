"use client";
import Link from "next/link";
import { Box, Card, Stack, Typography } from "@mui/material";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BrandHeader from "@/_components/BrandHeader";
import { languages } from "@/lib/languages";
import { getUiCopy } from "@/lib/ui-copy";

export default function HomeContent({ activeLanguage }) {
  const text = getUiCopy(activeLanguage).home;
  return (
    <Box component="main" className="app-shell selection-shell" lang={activeLanguage}>
      <BrandHeader title={text.title} eyebrow={text.eyebrow} subtitle={text.subtitle} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: { xs: 2, md: 3 }, mt: { xs: 3, md: 5 } }}>
        <ChoiceButton href={`/szkolenie?typ=guest&language=${activeLanguage}`} icon={<GroupsOutlinedIcon />} label={text.guest} description={text.guestDescription} action={text.start} />
        <ChoiceButton href={`/szkolenie?typ=subcontractor&language=${activeLanguage}`} icon={<EngineeringOutlinedIcon />} label={text.subcontractor} description={text.subcontractorDescription} action={text.start} />
      </Box>
      <Box component="nav" aria-label={text.languageLabel} sx={{ mt: { xs: 4, md: 5 }, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{text.languageLabel}</Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
          {languages.map((language) => {
            const selected = language.code === activeLanguage;
            return (
              <Box key={language.code} component={Link} href={`/?language=${language.code}`} aria-label={language.nativeLabel} aria-current={selected ? "page" : undefined}
                sx={{ display: "inline-flex", alignItems: "center", gap: 1, minHeight: 44, px: 1.75, borderRadius: 2, border: "1px solid", borderColor: selected ? "primary.main" : "divider", bgcolor: selected ? "#fff0f4" : "background.paper", color: selected ? "primary.dark" : "text.secondary", fontSize: "0.875rem", fontWeight: selected ? 600 : 400, "&:hover": { borderColor: "primary.main" } }}>
                <span className={`fi fi-${language.flag}`} aria-hidden="true" />{language.nativeLabel}
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
function ChoiceButton({ href, icon, label, description, action }) {
  return (
    <Card component={Link} href={href} elevation={0}
      sx={{ minWidth: 0, minHeight: { xs: 300, md: 320 }, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", p: { xs: 3, sm: 4 }, transition: "border-color 160ms ease, box-shadow 160ms ease", "&:hover": { borderColor: "primary.main", boxShadow: "0 8px 28px rgba(37,51,66,0.08)" } }}>
      <Box sx={{ display: "grid", placeItems: "center", width: 72, height: 72, flexShrink: 0, borderRadius: "22px", bgcolor: "#fff0f4", color: "primary.main", mb: 2.5, "& svg": { fontSize: 40 } }}>{icon}</Box>
      <Typography variant="h3" component="h2" sx={{ mb: 1 }}>{label}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1, maxWidth: 360 }}>{description}</Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", color: "primary.main" }}>
        <Typography component="span" sx={{ fontWeight: 600 }}>{action}</Typography><ArrowForwardIcon fontSize="small" />
      </Stack>
    </Card>
  );
}
