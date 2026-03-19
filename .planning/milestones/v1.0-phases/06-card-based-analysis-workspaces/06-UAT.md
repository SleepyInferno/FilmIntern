---
status: testing
phase: 06-card-based-analysis-workspaces
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-03-19T12:05:00Z
updated: 2026-03-19T12:05:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Stop the dev server if running. Delete the SQLite database file (`.filmintern/filmintern.db` or wherever it lives) so the app starts fresh. Run `npm run dev`. The server should boot without errors, the DB should be created automatically, and navigating to http://localhost:3000 should show the app with an empty Projects sidebar and no errors in the terminal.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Stop the dev server if running. Delete the SQLite database file so the app starts fresh. Run `npm run dev`. The server should boot without errors, the DB should be created automatically, and navigating to http://localhost:3000 should show the app with an empty Projects sidebar and no errors in the terminal.
result: [pending]

### 2. Projects Sidebar Always Visible
expected: The Projects sidebar is visible on every page — home (/), settings (/settings), and any other page. It should not disappear when navigating between pages.
result: [pending]

### 3. File Drop Creates Project in Sidebar
expected: Drop or select a file on the home page. As soon as the file is uploaded and the content preview appears, a new entry should appear in the Projects sidebar immediately — before you even run analysis. The project shows the file name and project type.
result: [pending]

### 4. Narrative Workspace — Story Lab with 8 Cards
expected: Select "Narrative" project type, upload a script or text file, run analysis. When the analysis completes, the result displays as 8 evaluation cards: Logline & Premise, Story Structure, Character Arcs, Dialogue & Voice, Theme & Resonance, Pacing & Tension, Genre & Comparables, Development Recommendations. Each card has a title and shows content from the analysis — not raw JSON or a generic layout.
result: [pending]

### 5. Story Structure — Expandable Beat Rows
expected: In the Story Structure card on a Narrative analysis, the individual story beats (act breaks, turning points, etc.) should be clickable rows. Clicking a beat expands it to show details; clicking again collapses it. The chevron icon should rotate to indicate expanded state.
result: [pending]

### 6. Character Arcs — Show More Toggle
expected: If the Narrative analysis returns more than 3 characters, the Character Arcs card shows only the first 3 with a "Show more" link beneath. Clicking it reveals the remaining characters. Clicking "Show less" collapses back to 3.
result: [pending]

### 7. Documentary Workspace — 6 Interview Cards
expected: Select "Documentary" project type, upload a transcript, run analysis. The result displays as 6 evaluation cards: Key Quotes, Recurring Themes, Key Moments, Subject Profiles, Story Arc, Interview Gaps. Key Quotes shows italicized quotes with speaker labels. Key Moments shows colored type dots.
result: [pending]

### 8. Corporate Workspace — 6 Messaging Cards
expected: Select "Corporate" project type, upload a transcript, run analysis. The result displays as 6 evaluation cards: Soundbites, Key Messages, Spokesperson Assessment, Audience Alignment, Message Consistency, Recommendations. Content is messaging-domain appropriate.
result: [pending]

### 9. TV Workspace — 6 Series Cards
expected: Select "TV / Episodic" project type, upload a script, run analysis. The result displays as 6 evaluation cards: Episode Arc, Series Structure, Character Development, Tone & Voice, Pilot Effectiveness, Franchise Potential. Content is TV-domain appropriate.
result: [pending]

### 10. Workspace Streaming Skeletons
expected: While an analysis is running (streaming), the workspace cards should show placeholder skeleton bars — gray loading states — not blank white space or errors. As data arrives progressively, sections fill in. The StreamingStatusBar should show a pulsing "Analyzing..." indicator.
result: [pending]

### 11. Optional Cards Show Fallback Text (Not Skeleton)
expected: For a Corporate or TV analysis where some optional fields (like Spokesperson Assessment or Tone & Voice) may be absent from the response, those cards should show a short fallback message like "Spokesperson Assessment not available for this analysis" — not a loading skeleton and not an empty card.
result: [pending]

### 12. Sidebar Project Restore
expected: After running an analysis and seeing the workspace, click a different project (or navigate away and back). Clicking the saved project in the sidebar should restore the full workspace: the file name, project type, and all analysis cards exactly as they appeared when the analysis completed.
result: [pending]

### 13. Dropzone Hidden After Upload
expected: After dropping or selecting a file, the drag-and-drop dropzone area should disappear and be replaced by the file info bar and content preview. The dropzone should NOT reappear while working on the current project — you shouldn't be able to accidentally overwrite the uploaded file.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0

## Gaps

[none yet]
