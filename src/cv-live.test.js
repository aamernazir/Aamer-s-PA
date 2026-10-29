import test from "node:test";
import assert from "node:assert/strict";
import { apsQualityReviewItems, buildCvLiveData, countCvPublications, findCvProjectDuplicates, liveCvApsEntries } from "./cv-live.js";

test("Project Dashboard records become live CV project entries and duplicates collapse", () => {
  const projects = [
    { id: "p1", title: "Recycled Polymer Demonstrator", status: "Completed", ownerRole: "PI", projectNumber: "KF-12" },
    { id: "p2", title: "Recycled Polymer Demonstrator", status: "Completed" },
    { id: "p3", title: "Cancelled Trial", status: "Cancelled" },
    { id: "p4", title: "New Materials Study", status: "Active" },
  ];
  const live = buildCvLiveData({ projects });
  assert.equal(live.projects.length, 2);
  assert.equal(live.projects[0].status, "In progress");
  assert.equal(live.projects[1].status, "Completed");
  assert.deepEqual(findCvProjectDuplicates(["Research Grants", "Recycled Polymer Demonstrator — KF-12"], projects).map((item) => item.title), ["New Materials Study"]);
});

test("APS contributions map to CV subsections and skip projects already listed in Project Dashboard", () => {
  const aps = {
    activeCycle: "APS27",
    cycles: { APS27: {
      research: { r3Projects: ["Live project", "APS-only interdisciplinary project"], r6Recognitions: ["Research award"], r6Conferences: ["Conference organizer"] },
      teaching: { t2Advising: ["Advised graduate researchers"] },
      societal: { s3Outreach: ["Community workshop"] },
    } },
  };
  const entries = liveCvApsEntries(aps, [{ title: "Live project" }]);
  assert.deepEqual(entries.map((entry) => `${entry.section}:${entry.text}`), [
    "Achievements:Research award",
    "Conferences:Conference organizer",
    "Teaching & Supervision:Advised graduate researchers",
    "Community Engagement:Community workshop",
    "Projects:APS-only interdisciplinary project",
  ]);
});

test("CV summary highlights include achievements and completed projects without mutating source records", () => {
  const project = { id: "p1", title: "Finished Study", status: "Completed" };
  const aps = { research: { r6Recognitions: ["Best paper award"] } };
  const result = buildCvLiveData({ projects: [project], aps, outputs: [{ id: "a1", title: "Teaching prize", type: "Award / Certificate" }] });
  assert.deepEqual(result.highlights.map((item) => item.text), ["Best paper award", "Teaching prize", "Completed project: Finished Study"]);
  assert.deepEqual(project, { id: "p1", title: "Finished Study", status: "Completed" });
});

test("publication count accepts only the three requested types and respects CV-linked section classifications", () => {
  assert.equal(countCvPublications(
    [
      { id: "j1", title: "Journal Work", type: "Other", section: "Journal Articles" },
      { id: "c1", title: "Proceedings Work", type: "Journal Paper", section: "Conference Proceedings" },
      { id: "b1", title: "Chapter Work", type: "Book Chapter", section: "Book Chapters" },
      { id: "x1", title: "Conference Talk", type: "Conference Paper", section: "Conferences" },
      { id: "x2", title: "Broad Publication", type: "Journal Paper", section: "Publications" },
    ],
    [
      { title: "Journal Work copy", type: "Journal Paper", cvEntryId: "j1" },
      { title: "Other proceedings", type: "Conference Paper", cvEntryId: "c1" },
      { title: "Talk wrongly typed", type: "Journal Paper", cvSection: "Conference Presentations" },
      { title: "Archive journal", type: "Journal Paper" },
      { title: "Archive talk", type: "Conference Presentation" },
    ],
    [{ text: "Archive journal", type: "Journal Paper" }],
  ), 4);
});

test("only awarded strategic funding opportunities appear in the live project section", () => {
  const result = buildCvLiveData({
    fundingOpportunities: [
      { id: "a", title: "Granted research project", funder: "Research Council", program: "Grant", status: "Awarded" },
      { id: "b", title: "Proposal under review", status: "Submitted" },
    ],
    aps: { research: { r1Publications: [{ title: "APS paper", year: 2025 }] } },
  });
  assert.deepEqual(result.projects.map((item) => item.title), ["Granted research project"]);
  assert.equal(result.highlights.some((item) => item.text === "Awarded funding: Granted research project"), true);
  assert.deepEqual(result.sections.Papers.map((item) => item.text), ["APS paper"]);
  assert.equal(result.counts.papers, 0); // APS notes alone are not validated publication records.
});

test("APS attention is section-specific, limited to entered records, and respects ignored quality checks", () => {
  const aps = { activeCycle: "APS27", cycles: { APS27: {
    status: "In Progress",
    ignoredQualityIssues: ["R6_RECOG-period"],
    research: { r6Recognitions: ["Won award"] },
    societal: { s3Outreach: ["Organized community workshops for local schools and university partners (2026)"] },
  } } };
  const reviews = apsQualityReviewItems(aps);
  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].section, "research");
  assert.match(reviews[0].label, /APS27 research entries need review/);
  assert.match(reviews[0].detail, /only one short entry/);
  assert.equal(apsQualityReviewItems({ activeCycle: "APS27", cycles: { APS27: { status: "Submitted", research: { r6Recognitions: ["Won award"] } } } }).length, 0);
});

test("a manually corrected CV-linked presentation is excluded from publication counts", () => {
  const entry = { id: "talk1", title: "Design for Additive Manufacturing of Customized Springs", section: "Conference Papers" };
  const output = { id: "o1", cvEntryId: "talk1", title: entry.title, type: "Conference Presentation", cvSection: "Conference Presentations", cvEditedAt: "2026-10-29" };
  assert.equal(countCvPublications([entry], [output]), 0);
  assert.equal(countCvPublications([{ ...entry, type: "Conference Presentation", section: "Conference Presentations", editedAt: "2026-10-29" }], [output]), 0);
});

test("publication count follows a corrected presentation despite an older CV entry ID", () => {
  const entry = { id: "new-id", title: "Aamer Nazir. Design for Additive Manufacturing of Customized Springs. ICIEA 2024", section: "Conference Papers" };
  const output = { id: "o1", cvEntryId: "old-id", title: "Design for Additive Manufacturing of Customized Springs", type: "Conference Presentation", cvSection: "Conference Presentations", cvEditedAt: "2026-10-29" };
  assert.equal(countCvPublications([entry], [output]), 0);
});
