# Nyx dashboard redesign — design QA

- Target visual: the detailed Nyx three-column dashboard reference supplied on 5 October 2026, including the branded navigation rail, period strip, KPI cards, attention table, chart/map pair, pathways, and Career Map.
- Implemented layout: persistent Nyx operational rail, welcome header, individual 2022–2026/career period strip, four KPI cards, table-style briefing, five-year publications/projects chart, affiliation-footprint panel, module pathways, and full-height CV Career Map.
- Responsive checks in source: desktop three-column, reduced navigation rail, two-column Career Map, and mobile horizontal operational rail.
- Functional checks: dashboard refresh; individual 2022–2026 and career period selection; module navigation; Career Map expansion; subsection status display; recommendation drawers; active project/lead/product summaries; and affiliation aggregation from Research Intelligence are all wired in the implementation.
- Data rule checked: active-project values use the same workload rule as Project Dashboard, excluding projects marked complete/closed/archived and fully complete work-package sets.
- Data rule checked: the affiliation panel uses a neutral map background only. It contains no fixed partner locations and remains explicitly pending until Research Intelligence records `coauthorAffiliations`, then aggregates confirmed country values for the selected period.
- Build and automated tests: passed locally on 5 October 2026.

## Visual verification

Browser screenshot capture was unavailable in this workspace because the persisted browser permission state blocked access. No visual-pass claim is made until the deployed page can be opened and checked at desktop and mobile widths.

final result: blocked
