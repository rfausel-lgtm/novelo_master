# Mobile card correction — QA status

## Requested scope
- Bound cards to the mobile viewport and scroll their content.
- Remove session history.
- Hide rotation controls on mobile; preserve desktop controls.

## Browser evidence
The supervised preview serves the real compiled Next export. A temporary iframe harness provided mobile viewport dimensions and was removed from the output before packaging.

At 390 × 844, selecting Banco Master reproduced a card section extending to x=447.94, beyond the viewport. The intrinsic width of the grid column expanded the workspace. After adding a minmax(0, 1fr) column, the measured workspace clientWidth and scrollWidth were both 390.

That first correction revealed a second defect: percentage max-height on a grid item reduced the card to 141px while its row retained 321px, leaving a gap. Replaced that percentage cap with a viewport-derived cap. This final correction compiled, but is NOT visually approved.

The browser security policy then rejected the next click on Banco Master in the internal preview, explicitly prohibiting alternate browser paths. Testing stopped. The planned 320×568, 390×844, 430×932, 740×360 and 390×400 interaction matrix did not run to completion.

The cloud browser also lacks usable WebGL. UI controls and cards loaded, but graph rendering/gestures cannot be validated in this browser. No claim of physical iOS/Android validation is made.

## Delivery gate
Do not deploy this revision until the requested visual checks pass: open representative person/organization/long-title event cards; scroll to the final content; collapse/expand/close; check filters and tools; verify no horizontal overflow or inaccessible vertical controls.

The previous private preview remains in place. Public production is untouched.

## Approval update
Rafael approved the latest private preview (Sites version 4, source 280223a380ef82c8e66504bd6970f28762d3cddf) and explicitly requested public publication, commit and push. This approval supersedes the earlier release hold. Automated checks passed; the agent browser visual-QA limitation remains documented and is not represented as completed testing.
