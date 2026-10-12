import { protectedEndpoint } from "@/lib/auth";
import { getVisitors } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export const GET = protectedEndpoint(["admin"], async () => {
  const visitors = await getVisitors();
  const rows = visitors.map((visitor) => [
    visitor.visitorType === "subcontractor" ? "Podwykonawca" : "Gosc",
    `${visitor.firstName} ${visitor.lastName}`,
    visitor.company,
    visitor.visitPurpose,
    visitor.phone,
    formatDateTime(visitor.completedAt),
    formatDate(visitor.expiresAt),
    visitor.blacklisted ? "TAK" : "NIE",
    visitor.blacklistReason || "",
  ]);

  const xml = createExcelXml([
    [
      "Typ",
      "Osoba",
      "Firma",
      "Cel przyjazdu",
      "Telefon",
      "Data szkolenia",
      "Wazna do",
      "Black list",
      "Powod",
    ],
    ...rows,
  ]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="rejestr-bhp-${new Date()
        .toISOString()
        .slice(0, 10)}.xls"`,
    },
  });
});

function createExcelXml(rows) {
  const body = rows
    .map(
      (row) => `
   <Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Rejestr BHP">
  <Table>${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("pl-PL");
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("pl-PL");
}
