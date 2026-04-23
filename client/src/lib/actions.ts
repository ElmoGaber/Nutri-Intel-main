/**
 * Shared utility functions for common UI actions:
 * download files (CSV, JSON, Text, PDF), print, share, save to localStorage
 */

import jsPDF from "jspdf";
// Lazy-load html2canvas to reduce initial bundle (~400KB savings)
const loadHtml2Canvas = () => import("html2canvas").then((m) => m.default);

export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF"; // UTF-8 BOM for Arabic support
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function downloadJSON(filename: string, data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export async function downloadPDF(filename: string, title: string, sections: { heading: string; content: string }[]) {
  // Create a temporary hidden container with the content
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:700px;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif;direction:auto;";

  // Build HTML content
  let html = `<h1 style="text-align:center;font-size:24px;margin-bottom:4px;color:#1a1a2e;">${escapeHtml(title)}</h1>`;
  html += `<p style="text-align:center;font-size:12px;color:#888;margin-bottom:24px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>`;

  for (const section of sections) {
    html += `<div style="margin-bottom:16px;">`;
    html += `<h2 style="font-size:15px;font-weight:bold;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;color:#333;">${escapeHtml(section.heading)}</h2>`;
    html += `<pre style="font-family:Arial,sans-serif;font-size:11px;white-space:pre-wrap;word-wrap:break-word;color:#444;line-height:1.6;margin:0;">${escapeHtml(section.content)}</pre>`;
    html += `</div>`;
  }

  html += `<p style="text-align:center;font-size:9px;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:8px;">Nutri-Intel Report</p>`;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const html2canvas = await loadHtml2Canvas();
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    while (heightLeft > 0) {
      position = -(pageHeight - 20) * (Math.ceil((imgHeight - heightLeft) / (pageHeight - 20)));
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
    }

    doc.save(filename);
  } catch {
    // Fallback: plain text PDF if html2canvas fails
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text(title, 105, y, { align: "center" });
    y += 15;
    for (const section of sections) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(section.heading, 20, y);
      y += 8;
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(section.content, 170);
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      }
      y += 6;
    }
    doc.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printPage() {
  window.print();
}

export async function shareContent(title: string, text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: window.location.href });
      return true;
    } catch {
      // User cancelled
    }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text + "\n" + window.location.href);
    return true;
  } catch {
    return false;
  }
}

export function saveToLocalStorage(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAppCache(): boolean {
  try {
    const keysToKeep = ["theme", "language"];
    const saved: Record<string, string | null> = {};
    keysToKeep.forEach((k) => (saved[k] = localStorage.getItem(k)));
    localStorage.clear();
    keysToKeep.forEach((k) => {
      if (saved[k]) localStorage.setItem(k, saved[k]!);
    });
    return true;
  } catch {
    return false;
  }
}
