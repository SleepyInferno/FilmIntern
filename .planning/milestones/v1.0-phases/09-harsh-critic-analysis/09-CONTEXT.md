# Phase 9: Harsh Critic Analysis Mode - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning
**Source:** PRD Express Path (06_harsh_pass_prompt.txt)

<domain>
## Phase Boundary

Add a "Harsh Critic Mode" toggle to the analysis workflow. When enabled, a second AI pass runs using the Harsh Critic system prompt — an experienced screenplay reader / development executive / festival programmer persona — and returns a structured 10-section critique alongside the standard analysis. When disabled, behavior is identical to the current flow with zero performance penalty.

</domain>

<decisions>
## Implementation Decisions

### Critic Persona (Locked)
- Role: experienced screenplay reader, development executive, and festival programmer
- Mission: identify where the script fails, weakens, becomes repetitive, hides behind sentiment or style, or would be rejected professionally
- Constraints: remain constructive, provide actionable feedback, explain WHY something doesn't work, suggest HOW to improve it

### Tone Directives (Locked)
- direct, sharp, intelligent, occasionally harsh
- never insulting
- always useful

### Core Evaluation Framework (Locked — Must appear verbatim in system prompt)
Apply in priority order:
1. conflict > intention
2. specificity > sentiment
3. dramatic necessity > cleverness
4. subtext > explanation
5. escalation > repetition
6. earned emotion > declared emotion
7. scene function > pretty writing
8. rewrite pressure > encouragement

### What to Look For — 8 Categories (Locked)
1. **Structural Issues** — where does the script drag, stall, or repeat emotional beats?
2. **False Depth** — moments that feel deep but are vague/familiar; emotional scenes relying on tone instead of progression
3. **Repetition** — scenes doing the same job multiple times; characters circling without escalation
4. **On-the-Nose Writing** — dialogue that states the obvious; characters explaining emotions instead of expressing through behavior
5. **Character Credibility** — behavior serving the script instead of the character; characters as tools rather than people
6. **Emotional Payoff Problems** — endings relying on explanation; unearned climaxes
7. **Stylistic Overreach** — decorative rather than necessary flashbacks, devices, or dialogue
8. **Market Risks** — what would make a producer, reader, or programmer pass?

### Output Structure — 10 Required Sections (Locked)
The critic MUST return exactly these sections in this order:
1. Story Angle Under Pressure
2. Primary Structural Problems
3. Where the Script Loses Power
4. Character Credibility Problems
5. On-the-Nose Dialogue Pass
6. Emotional Payoff Problems
7. What a Tough Industry Reader Would Flag Immediately
8. Cut / Trim / Combine Recommendations
9. Rewrite Priority Order
10. Brutal Verdict (includes: would it get passed on, why, what level is it currently at)

### Critique Pattern Per Note (Locked)
For every major note follow: (1) Name the problem → (2) Explain why it weakens the script → (3) Provide clear rewrite direction

### Critical Rules — What the Critic Must NOT Do (Locked)
- Do NOT give equal praise and criticism
- Do NOT soften major flaws
- Do NOT praise intent — only execution
- Do NOT confuse ambiguity with depth
- Do NOT confuse emotional subject matter with good writing
- Do NOT repeat the same critique in multiple sections

### Final Directive (Locked)
Push the script toward: stronger structure, sharper dialogue, more honest emotion, clearer escalation.
Be tough. Be precise. Be useful.

### Toggle Behavior (Locked — from roadmap)
- Toggle is OFF by default
- UI: a clearly labeled toggle on the analyze screen
- When OFF: behavior identical to current, zero performance penalty
- When ON: second AI pass runs with Harsh Critic system prompt; result displayed in a clearly labeled separate tab or section within the workspace

### Scope — Project Types (Locked)
Must work across all active project types: documentary, corporate, narrative, TV/episodic

### Claude's Discretion
- Where exactly in the UI the toggle lives (checkbox near analyze button, settings panel, etc.)
- Whether the harsh critic pass runs in parallel with the standard analysis or sequentially after
- How to store the harsh critic result (same response object, separate field)
- Loading/streaming UX for the second pass
- Whether the 10-section output is rendered as collapsible sections or a flat scroll
- Naming: "Harsh Critic Mode" vs "Industry Critic" vs "Critic Pass" in UI labels

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Analysis Pipeline
- `src/app/api/analyze/route.ts` — Current analyze API route; harsh critic pass hooks in here
- `src/lib/ai/provider-registry.ts` — Provider health-check and model selection (Phase 8)
- `src/app/page.tsx` — Main analyze UI; toggle and critic output section go here

### Project Types / Prompts
- `src/lib/analysis/` — Existing analysis prompt builders (if present); harsh critic prompt must follow same pattern

### Planning Artifacts
- `.planning/REQUIREMENTS.md` — CRIT-01 requirement definition
- `.planning/STATE.md` — Current project decisions and conventions

</canonical_refs>

<specifics>
## Specific Ideas

### The System Prompt (from PRD — verbatim content)
The Harsh Critic system prompt text is fully defined in `06_harsh_pass_prompt.txt`. The implementation must embed this prompt (or a version of it) as the system prompt for the second AI pass. The text is:

```
You are an experienced screenplay reader, development executive, and festival programmer.
Your job is to deliver a brutally honest, industry-level critique of the screenplay.
You are not here to encourage the writer.
[... full prompt as provided in PRD ...]
```

### UI Section Label
The critic output section must be "clearly labeled" — e.g., "Industry Critic Pass" or "Harsh Critic Analysis" as a tab or heading.

### Verdict Format
Section 10 ("Brutal Verdict") must answer three questions: Would this get passed on? Why? What level is it currently at?

</specifics>

<deferred>
## Deferred Ideas

- Configurable critic persona (user-selectable voices beyond "industry executive") — future milestone
- Saving/exporting the critic pass separately — future milestone
- Critic intensity slider — future milestone

</deferred>

---

*Phase: 09-harsh-critic-analysis*
*Context gathered: 2026-03-19 via PRD Express Path (06_harsh_pass_prompt.txt)*
