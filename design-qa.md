# Nyx dashboard redesign — design QA

- Target visual: approved compact three-column Nyx cockpit concept from 5 October 2026.
- Implemented layout: persistent operational rail, compact central briefing and combined chart, full-height CV Career Map.
- Responsive checks in source: desktop three-column, reduced navigation rail, two-column Career Map, and mobile horizontal operational rail.
- Functional checks: dashboard refresh, reporting period selection, module navigation, Career Map expansion, subsection status display, and recommendation drawers are all wired in the implementation.
- Data rule checked: active-project values use the same workload rule as Project Dashboard, excluding projects marked complete/closed/archived and fully complete work-package sets.
- Build and automated tests: passed locally on 5 October 2026.

## Visual verification

Browser screenshot capture was unavailable in this workspace because the persisted browser permission state blocked access. No visual-pass claim is made until the deployed page can be opened and checked at desktop and mobile widths.

final result: blocked
