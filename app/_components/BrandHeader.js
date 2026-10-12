import Image from "next/image";
import { Typography } from "@mui/material";

export default function BrandHeader({ title, eyebrow, subtitle, actions }) {
  return (
    <header className="brand-header">
      <div className="brand-heading">
        <div className="brand-logo">
          <Image src="/MANLogo2.png" alt="MAN" fill preload sizes="(max-width: 599px) 88px, 104px" style={{ objectFit: "contain" }} />
        </div>
        <div className="brand-copy">
          {eyebrow && <Typography component="p" variant="overline" color="primary.main" sx={{ mb: 0.75 }}>{eyebrow}</Typography>}
          <Typography component="h1" variant="h1">{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 660 }}>{subtitle}</Typography>}
        </div>
      </div>
      {actions && <div className="brand-actions">{actions}</div>}
    </header>
  );
}
