import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(bytes, { maxPages = 12, maxCharacters = 20000 } = {}) {
  const task = pdfjs.getDocument({ data: bytes });
  const document = await task.promise;
  const pages = [];
  try {
    const count = Math.min(document.numPages, maxPages);
    for (let pageNumber = 1; pageNumber <= count; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || "").join(" "));
      if (pages.join(" ").length >= maxCharacters) break;
    }
    return pages.join(" ").replace(/\s+/g, " ").trim().slice(0, maxCharacters);
  } finally {
    await document.destroy();
  }
}
