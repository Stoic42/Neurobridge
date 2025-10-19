# Runbook: Resolving Vite/Babel "Pre-transform error" caused by diff markers in TSX

## Summary
When editing React TSX files, stray diff markers (lines starting with `-` or `+`) were accidentally left inside JSX. These characters are not valid JavaScript/TypeScript syntax and cause the parser used by Vite (@babel/parser/esbuild) to throw "Unexpected token" errors during the pre-transform phase. The issue reoccurred because multiple files were incrementally beautified and some diff markers were missed in the cleanup.

## Symptoms You May See
- Vite startup fails with messages such as:
  - `Pre-transform error: Unexpected token (EmotionMeter.tsx:line X)`
  - `@babel/parser SyntaxError: Unexpected token` (often pointing to `className` strings)
- Browser preview shows broken assets or `net::ERR_ABORTED` for components that failed to compile.

## Affected Files (examples from our session)
- <mcfile name="ResultCard.tsx" path="d:\Projects\NeurodiversityTranslator\frontend\src\components\ResultCard.tsx"></mcfile>
- <mcfile name="HistoryPanel.tsx" path="d:\Projects\NeurodiversityTranslator\frontend\src\components\HistoryPanel.tsx"></mcfile>
- <mcfile name="EmotionMeter.tsx" path="d:\Projects\NeurodiversityTranslator\frontend\src\components\EmotionMeter.tsx"></mcfile>

## Root Cause
- During UI beautification, changes were drafted in a diff-like format (with leading `-`/`+` lines). Portions of those markers were inadvertently committed into TSX files instead of being applied as normal edits.
- Any remaining diff markers inside JSX/TSX break parsing, leading to repeated compile failures until all instances are removed.

## Resolution Steps (what we did)
1. Identify failures and their exact locations from Vite logs (file and line number).
2. Systematically scan the components directory for diff-marker lines:
   - Search pattern: leading `-` or `+` at the start of a line.
3. Replace the affected fragments with valid JSX, ensuring only the target classes and attributes remain (no `-`/`+`).
4. Repeat the scan until no matches remain.
5. Restart the Vite development server (we used port 5175) and verify successful compilation.
6. Open the browser preview to confirm the UI renders correctly.

## Preventive Measures
- Avoid pasting patch/diff-style content directly into source files. Always apply edits as clean code, not as visible diffs.
- After making multi-file UI changes, run a quick scan before starting the dev server:
  - Search for lines beginning with `-` or `+` in `src/components/**/*.tsx`.
- Consider adding a lightweight check to your workflow:
  - Pre-commit or pre-push hook that searches for leading `-`/`+` lines in `.tsx` files.
  - Alternatively, add an IDE task/script to run the scan and fail fast when markers are detected.
- Restart the dev server after fixes and verify logs; port-switching (e.g., 5173 → 5175) helps avoid conflicts but won’t resolve parse errors—only code cleanup will.

## Quick Checklist
- [ ] Read the exact Vite/Babel error and note the file/line.
- [ ] Search project for leading `-` or `+` lines in `.tsx`.
- [ ] Replace invalid fragments with valid JSX/TSX.
- [ ] Re-run dev server and verify compilation.
- [ ] Preview UI to confirm behavior and styling.
- [ ] Run a final scan to ensure no markers remain.

## Notes
- These errors are purely syntactic; once markers are removed, your TSX compiles and the UI works as intended.
- The beautification changes (glassmorphism, gradients, rounded corners, shadows) are safe—only diff artifacts caused the failures.