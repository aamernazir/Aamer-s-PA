import JSZip from "jszip";

function xmlEscape(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function createCvDocx(sourceText, sections = []) {
  const lines = String(sourceText || "").split(/\r?\n/);
  const sectionNames = new Set(sections.map((section) => String(section || "").trim().replace(/[:.]+$/, "").toLowerCase()).filter(Boolean));
  const firstContentLine = lines.findIndex((line) => line.trim());
  const paragraphs = lines.map((line, index) => {
    const value = line.trim();
    if (!value) return '<w:p><w:pPr><w:spacing w:after="80"/></w:pPr></w:p>';
    const normalized = value.replace(/[:.]+$/, "").toLowerCase();
    const isHeading = sectionNames.has(normalized) || (value.length < 80 && /^[A-Z][A-Z0-9 &/(),.-]{3,}$/.test(value));
    const style = index === firstContentLine ? "Title" : isHeading ? "Heading1" : "Normal";
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(value)}</w:t></w:r></w:p>`;
  }).join("");

  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file("word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file("word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="220"/></w:pPr><w:rPr><w:b/><w:color w:val="1A2332"/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="1F5C8B"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>');
  zip.file("docProps/core.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Academic CV</dc:title><dc:creator>Aamer Nazir</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + new Date().toISOString() + '</dcterms:created></cp:coreProperties>');
  zip.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + paragraphs + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="480" w:footer="480" w:gutter="0"/></w:sectPr></w:body></w:document>');
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function updateOriginalCvDocx(base64, additions = [], sectionNames = []) {
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("The imported Word file has no document body.");
  const xml = await documentFile.async("string");
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  if (documentXml.querySelector("parsererror")) throw new Error("The original Word document could not be updated safely.");
  const namespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const body = documentXml.getElementsByTagNameNS(namespace, "body")[0];
  if (!body) throw new Error("The original Word document has no editable body.");
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const knownHeadings = new Set(sectionNames.map(normalize).filter(Boolean));
  const paragraphText = (paragraph) => Array.from(paragraph.getElementsByTagNameNS(namespace, "t")).map((node) => node.textContent).join("");
  const makeParagraph = (value, heading = false) => {
    const paragraph = documentXml.createElementNS(namespace, "w:p");
    if (heading) {
      const props = documentXml.createElementNS(namespace, "w:pPr");
      const style = documentXml.createElementNS(namespace, "w:pStyle");
      style.setAttributeNS(namespace, "w:val", "Heading1");
      props.appendChild(style);
      paragraph.appendChild(props);
    }
    const run = documentXml.createElementNS(namespace, "w:r");
    const textNode = documentXml.createElementNS(namespace, "w:t");
    textNode.textContent = String(value);
    run.appendChild(textNode);
    paragraph.appendChild(run);
    return paragraph;
  };
  const originalText = normalize(Array.from(body.getElementsByTagNameNS(namespace, "t")).map((node) => node.textContent).join(" "));
  const unique = new Set();
  const grouped = new Map();
  additions.forEach(({ section, text }) => {
    const value = String(text || "").trim();
    const key = normalize(value);
    if (!value || !key || unique.has(key) || originalText.includes(key)) return;
    unique.add(key);
    const label = String(section || "Other CV records").trim();
    grouped.set(label, [...(grouped.get(label) || []), value]);
  });
  for (const [section, entries] of grouped) {
    const paragraphs = Array.from(body.getElementsByTagNameNS(namespace, "p")).filter((node) => node.parentNode === body);
    const heading = paragraphs.find((paragraph) => normalize(paragraphText(paragraph)) === normalize(section));
    let anchor = heading;
    if (heading) {
      for (let index = paragraphs.indexOf(heading) + 1; index < paragraphs.length; index++) {
        if (knownHeadings.has(normalize(paragraphText(paragraphs[index])))) break;
        anchor = paragraphs[index];
      }
    } else {
      const title = makeParagraph(section, true);
      body.insertBefore(title, body.getElementsByTagNameNS(namespace, "sectPr")[0] || null);
      anchor = title;
    }
    for (const value of entries) {
      const paragraph = makeParagraph(value);
      body.insertBefore(paragraph, anchor.nextSibling);
      anchor = paragraph;
    }
  }
  zip.file("word/document.xml", new XMLSerializer().serializeToString(documentXml));
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
}
