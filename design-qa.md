# Nyx dashboard redesign — design QA

- Target visual: approved compact three-column Nyx cockpit concept from 5 October 2026, including the co-author affiliation footprint.
- Implemented layout: persistent operational rail, compact needs-attention briefing, five-year publications/projects chart, affiliation-footprint panel, and full-height CV Career Map.
- Responsive checks in source: desktop three-column, reduced navigation rail, two-column Career Map, and mobile horizontal operational rail.
- Functional checks: dashboard refresh; individual 2022–2026 and career period selection; module navigation; Career Map expansion; subsection status display; recommendation drawers; active project/lead/product summaries; and affiliation aggregation from Research Intelligence are all wired in the implementation.
- Data rule checked: active-project values use the same workload rule as Project Dashboard, excluding projects marked complete/closed/archived and fully complete work-package sets.
- Data rule checked: the affiliation panel contains no fixed partner locations. It remains empty until Research Intelligence records `coauthorAffiliations`, then aggregates confirmed country values for the selected period.
- Build and automated tests: passed locally on 5 October 2026.

## Visual verification

Browser screenshot capture was unavailable in this workspace because the persisted browser permission state blocked access. No visual-pass claim is made until the deployed page can be opened and checked at desktop and mobile widths.

final result: blocked
