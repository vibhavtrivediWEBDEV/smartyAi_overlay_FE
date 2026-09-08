import { jsPDF } from "jspdf";
import type { ATSResume } from "@/lib/ats";

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join(""));
  }
  return pages.join("\n");
}

export function resumeFileName(name: string) {
  const safeName = name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "Resume";
  return `${safeName}-ATS-Resume.pdf`;
}

export function downloadResumePdf(resume: ATSResume) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 18;
  const width = 174;
  let y = 18;
  const ensureRoom = (height: number) => { if (y + height > 279) { pdf.addPage(); y = 18; } };
  const write = (value: string, options: { size?: number; bold?: boolean; bullet?: boolean; gap?: number } = {}) => {
    if (!value.trim()) return;
    const size = options.size ?? 10;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(`${options.bullet ? "• " : ""}${value}`, width) as string[];
    const height = lines.length * size * 0.42 + (options.gap ?? 1);
    ensureRoom(height);
    pdf.text(lines, margin, y);
    y += height;
  };
  const heading = (value: string) => {
    ensureRoom(10);
    y += 2;
    pdf.setDrawColor(110);
    pdf.line(margin, y, 210 - margin, y);
    y += 5;
    write(value.toUpperCase(), { size: 11, bold: true, gap: 2 });
  };
  const list = (title: string, values: string[]) => { if (values.length) { heading(title); values.forEach((item) => write(item, { bullet: true, gap: 2 })); } };
  write(resume.name || "Resume", { size: 19, bold: true, gap: 2 });
  write(resume.headline, { size: 11, bold: true });
  write([resume.email, resume.phone, resume.location].filter(Boolean).join("  |  "), { size: 9, gap: 2 });
  resume.links.forEach((link) => write(`${link.platform}: ${link.url}`, { size: 8 }));
  if (resume.summary) { heading("Professional Summary"); write(resume.summary); }
  if (resume.skills.length) { heading("Skills"); write(resume.skills.join(" • ")); }
  list("Experience", resume.experience);
  list("Education", resume.education);
  if (resume.projects.length) {
    heading("Projects");
    resume.projects.forEach((project) => { write(project.name, { bold: true }); write(project.description, { bullet: true }); write(project.technologies.join(", "), { size: 9 }); });
  }
  list("Achievements", resume.achievements);
  list("Certifications", resume.certifications);
  list("Languages", resume.languages);
  pdf.save(resumeFileName(resume.name));
}