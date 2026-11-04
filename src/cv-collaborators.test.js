import test from "node:test";
import assert from "node:assert/strict";
import { recentCvCoauthors } from "./cv-collaborators.js";

test("recent papers offer deduplicated coauthors with only recorded profile details", () => {
  const papers = [
    { type: "Journal Paper", year: 2026, authors: "A. Nazir, Gokulnath Thavamani, S. Sekar", authorAffiliations: "Gokulnath Thavamani — KAUST, Thuwal, Saudi Arabia; S. Sekar — Dongguk University, Seoul, South Korea", keywords: ["metamaterials", "additive manufacturing"] },
    { type: "Conference Paper", year: 2024, authors: "Gokulnath Thavamani; Aamer Nazir", keywords: ["acoustics"] },
    { type: "Journal Paper", year: 2021, authors: "Old Author, Aamer Nazir" },
    { type: "Conference Presentation", year: 2025, authors: "Presentation Speaker, Aamer Nazir" },
  ];
  const result = recentCvCoauthors(papers, [], 2026);
  assert.equal(result.length, 2);
  assert.equal(result.find((person) => person.name === "Gokulnath Thavamani").papers, 2);
  assert.equal(result.find((person) => person.name === "Gokulnath Thavamani").country, "Saudi Arabia");
  assert.match(result.find((person) => person.name === "Gokulnath Thavamani").expertise, /acoustics/);
  assert.equal(result.find((person) => person.name === "S. Sekar").city, "Seoul");
});
