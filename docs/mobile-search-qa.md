# Mobile search and filters — readiness

Status: NOT_READY
Browser QA: PENDING
Private deployment: PENDING
Public deployment: NOT AUTHORIZED

## Implemented
- Always-visible mobile search; suggestions grouped by category.
- Native modal filter sheet with expandable sections, draft changes, explicit apply/count, clear, and cancel.
- Removable applied filter chips and badge.
- Evidence layer requested before apply; failures prevent claiming an accurate result count.
- Draft count includes existing focus or isolation; existing graph filter semantics preserved.
- Desktop uses the previous filter panel and ungrouped search.

## Automated evidence
97 tests passed, including draft isolation, explicit apply, cancel, evidence loading, category chip set equality and date removal preserving other filters.

## Required before notification
Visual/interaction QA of mobile search, grouped results, long labels, filter scrolling and footer, apply/cancel/clear, chips, zero results, node cards, and desktop regression. Check 320×568, 390×844, 430×932 and phone landscape, plus keyboard-height constraints.

The earlier browser URL security-policy rejection must be respected: no workaround, alternate browser path or repeated blocked action. Do not mark ready based on compilation, automated tests, or deployment status alone.

The user requested notification only when the assistant considers the preview fully ready. The prior exception for privately publishing the card correction does not constitute visual approval of this new filter workflow. Public production remains untouched.

Only mark READY when genuine QA evidence has been recorded and a matching saved version has successfully deployed privately. Then notify once with the exact returned URL.

## Approval update
Rafael approved the latest private preview (Sites version 4, source 280223a380ef82c8e66504bd6970f28762d3cddf) and explicitly requested public publication, commit and push. This approval supersedes the earlier release hold. Automated checks passed; the agent browser visual-QA limitation remains documented and is not represented as completed testing.
