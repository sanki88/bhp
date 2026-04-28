import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const videoPath = path.join(process.cwd(), "public", "szkolenie-bhp.mp4");

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("video");

  if (!file || typeof file === "string") {
    return Response.json({ error: "Wybierz plik wideo." }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return Response.json({ error: "Plik musi byc filmem." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(videoPath, buffer);

  return Response.json({
    ok: true,
    fileName: file.name,
    size: file.size,
    videoUrl: "/szkolenie-bhp.mp4",
  });
}
