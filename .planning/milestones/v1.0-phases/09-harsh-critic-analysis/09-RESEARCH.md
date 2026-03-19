# Phase 09: Harsh Critic Analysis - Research

**Researched:** 2026-03-19
**Domain:** Second-pass AI analysis with toggle UI, streaming, and persistence
**Confidence:** HIGH

## Summary

Phase 09 adds a "Harsh Critic Mode" toggle that triggers a second AI pass using a locked industry-critic persona. The existing analysis pipeline (`src/app/api/analyze/route.ts`) uses Vercel AI SDK's `streamText` with structured output (Zod schemas) and streams progressive JSON to the client. The client accumulates chunks via `ReadableStream` reader, parses progressively, and renders into project-type-specific workspace components.

The implementation requires: (1) a new system prompt file for the critic persona, (2) extending the `/api/analyze` route to accept a `harshCriticEnabled` flag and optionally run a second `streamText` call, (3) a toggle in the creation UI, (4) a new tab/section in the `DocumentWorkspace` to display critic output, (5) persisting the critic result in the workspace context and SQLite database.

**Primary recommendation:** Run the critic pass sequentially after the standard analysis completes (not in parallel) to avoid doubling concurrent API costs and to provide clear UX phasing. The critic output should be a plain text/markdown response (not structured Zod output) since the 10-section format is prose-heavy and does not benefit from schema enforcement.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Critic Persona:** experienced screenplay reader, development executive, and festival programmer
- **Tone Directives:** direct, sharp, intelligent, occasionally harsh; never insulting; always useful
- **Core Evaluation Framework:** 8 priority-ordered principles (conflict > intention, specificity > sentiment, etc.) -- must appear verbatim in system prompt
- **What to Look For:** 8 locked categories (Structural Issues, False Depth, Repetition, On-the-Nose Writing, Character Credibility, Emotional Payoff Problems, Stylistic Overreach, Market Risks)
- **Output Structure:** exactly 10 sections in fixed order (Story Angle Under Pressure through Brutal Verdict)
- **Critique Pattern Per Note:** (1) Name the problem, (2) Explain why it weakens the script, (3) Provide clear rewrite direction
- **Critical Rules:** 6 locked "must NOT do" rules (no equal praise/criticism, no softening, no praising intent, etc.)
- **Final Directive:** Push toward stronger structure, sharper dialogue, more honest emotion, clearer escalation
- **Toggle Behavior:** OFF by default; when OFF zero performance penalty; when ON second AI pass runs; result in separate tab/section
- **Scope:** Must work across all project types: documentary, corporate, narrative, TV/episodic

### Claude's Discretion
- Where the toggle lives in the UI (checkbox near analyze button, settings panel, etc.)
- Whether critic pass runs in parallel or sequentially
- How to store the critic result (same response object, separate field)
- Loading/streaming UX for the second pass
- Whether 10-section output is collapsible sections or flat scroll
- Naming: "Harsh Critic Mode" vs "Industry Critic" vs "Critic Pass"

### Deferred Ideas (OUT OF SCOPE)
- Configurable critic persona (user-selectable voices) -- future milestone
- Saving/exporting the critic pass separately -- future milestone
- Critic intensity slider -- future milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CRIT-01 | User can enable "Harsh Critic Mode" on any analysis; when enabled, a second analytical lens is added -- an industry executive voice that is brutal, direct, and constructively unsparing -- displayed alongside the standard analysis | Toggle UI in creation flow, new critic system prompt, sequential second `streamText` call in analyze route, new "Industry Critic" tab in DocumentWorkspace, critic data persisted to SQLite |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.116 | `streamText` for both standard and critic AI passes | Already used in analyze route; handles streaming, provider abstraction |
| next | 16.1.6 | API routes, React server components | Already the app framework |
| react | 19.2.3 | UI components, state management | Already used |
| zod | ^4.3.6 | Schema validation for API request body | Already used for analysis schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.577.0 | Toggle icon (e.g., Shield, Flame) | Toggle UI decoration |
| tailwind (via tw-animate-css) | existing | Styling toggle, critic output section | All UI work |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sequential critic pass | Parallel `Promise.all` | Parallel doubles concurrent API load; sequential is simpler, lets user see standard analysis while critic loads |
| Plain text critic output | Structured Zod schema for 10 sections | Schema would over-constrain prose-heavy critique; markdown/text is simpler and the 10 sections are enforced by the prompt itself |

**No new dependencies needed.** Everything required is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/ai/
    prompts/
      harsh-critic.ts          # NEW: The locked critic system prompt
  app/
    api/
      analyze/
        route.ts               # MODIFY: Accept harshCriticEnabled, run second pass
    page.tsx                   # MODIFY: Add toggle, pass criticAnalysis to workspace
  components/
    document-workspace.tsx     # MODIFY: Add "Industry Critic" tab
    harsh-critic-display.tsx   # NEW: Renders 10-section critic output
  contexts/
    workspace-context.tsx      # MODIFY: Add criticAnalysis state field
  lib/
    db.ts                      # MODIFY: Add criticAnalysis column to projects table
```

### Pattern 1: Sequential Second Pass in API Route
**What:** When `harshCriticEnabled` is true in the request body, after the standard `streamText` completes, make a second `streamText` call with the critic system prompt. Return both results.
**When to use:** Always when critic mode is on.
**Key design decision:** The current route streams a single response via `result.toTextStreamResponse()`. For the critic pass, there are two approaches:

**Approach A (Recommended): Two separate API calls from the client.**
- Client calls `/api/analyze` normally for standard analysis.
- After standard analysis completes, if `harshCriticEnabled`, client calls `/api/analyze/critic` (new route) with the same text + projectType.
- This keeps the existing streaming contract unchanged and allows the critic to stream independently.
- The client shows "Running Industry Critic..." with its own loading state while the critic streams.

**Approach B: Single API call returning both.**
- Would require a custom streaming protocol (e.g., newline-delimited JSON with type markers).
- Breaks the existing progressive JSON.parse pattern used by the client.
- More complex, less maintainable.

**Recommendation: Approach A.** A separate `/api/analyze/critic` route keeps concerns clean.

```typescript
// src/app/api/analyze/critic/route.ts
import { streamText } from 'ai';
import { loadSettings } from '@/lib/ai/settings';
import { buildRegistry, checkProviderHealth } from '@/lib/ai/provider-registry';
import { harshCriticSystemPrompt } from '@/lib/ai/prompts/harsh-critic';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { text, projectType } = await req.json();
  // Validation... health check... same pattern as main route

  const settings = await loadSettings();
  const health = await checkProviderHealth(settings);
  if (!health.ok) return Response.json({ error: health.error }, { status: 503 });

  const registry = buildRegistry(/* ... */);
  const modelId = /* same lookup */;

  // No structured output -- critic returns plain text/markdown
  const result = streamText({
    model: registry.languageModel(modelId),
    system: harshCriticSystemPrompt,
    prompt: `Project type: ${projectType}\n\nAnalyze this material with your harshest critical lens:\n\n${text}`,
    onError({ error }) {
      console.error('Critic streaming error:', error);
    },
  });

  return result.toTextStreamResponse();
}
```

### Pattern 2: Toggle in Creation UI
**What:** A checkbox/toggle near the "Run Analysis" button that sets local state for `harshCriticEnabled`.
**When to use:** Always visible when a file is uploaded and ready for analysis.

```typescript
// In page.tsx, near the Run Analysis button:
const [harshCriticEnabled, setHarshCriticEnabled] = useState(false);

// Checkbox UI
<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    checked={harshCriticEnabled}
    onChange={(e) => setHarshCriticEnabled(e.target.checked)}
    className="rounded border-input"
  />
  <span className="font-medium">Industry Critic Mode</span>
  <span className="text-xs text-muted-foreground">Adds a harsh, constructive second analysis</span>
</label>
```

### Pattern 3: Critic Output Display
**What:** A new tab in `DocumentWorkspace` labeled "Industry Critic" that renders the 10-section critic response.
**When to use:** When criticAnalysis data exists (non-null).

The critic output is markdown-like text with 10 labeled sections. Render as:
- A flat scrollable prose view with clear section headings
- Each section gets an `<h3>` with the section name
- The prose renders within a styled card consistent with the workspace design

### Pattern 4: Workspace Context Extension
**What:** Add `criticAnalysis: string | null` to WorkspaceState and corresponding setter.
**When to use:** For persisting critic results across navigation.

### Anti-Patterns to Avoid
- **Do NOT run critic pass in parallel with standard analysis.** It doubles API costs for every analysis run and complicates error handling. Sequential (standard first, then critic) gives the user immediate value from the standard pass.
- **Do NOT use structured output (Zod schema) for the critic.** The 10-section output is prose-heavy. The prompt already enforces the section structure. A Zod schema would fight the model's natural output.
- **Do NOT store critic toggle state globally in settings.** It is a per-analysis choice, not a global preference. Keep it as local component state.
- **Do NOT modify the standard analysis response format.** The critic is additive -- a separate data field, separate tab, separate API call.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming text response | Custom chunked transfer | `streamText().toTextStreamResponse()` from AI SDK | Already handles backpressure, encoding, error propagation |
| Provider/model selection | Custom provider logic | Existing `buildRegistry` + `checkProviderHealth` | Already solved in Phase 8 |
| Progressive text accumulation | Custom buffer management | `ReadableStream` reader with `TextDecoder` (existing pattern) | Already proven in `handleAnalyze` |

## Common Pitfalls

### Pitfall 1: Critic Pass Doubling Token Costs
**What goes wrong:** Users accidentally leave critic mode on, doubling every analysis cost.
**Why it happens:** Toggle is sticky if stored in persistent state.
**How to avoid:** Keep toggle as local state (useState, not persisted). Default OFF every session. Show a clear visual indicator when enabled.
**Warning signs:** User complaints about API costs doubling.

### Pitfall 2: Streaming State Collision
**What goes wrong:** `isAnalyzing` state is shared between standard and critic passes, causing UI flicker.
**Why it happens:** Single boolean for two sequential async operations.
**How to avoid:** Use a separate `isCriticAnalyzing` state. The standard `isAnalyzing` controls the standard pass; `isCriticAnalyzing` controls the critic pass. Both can be true if desired, but the recommended sequential approach means only one is true at a time.

### Pitfall 3: DB Schema Migration for Existing Projects
**What goes wrong:** Existing projects in SQLite lack the `criticAnalysis` column.
**Why it happens:** Schema evolution without migration.
**How to avoid:** Use the same `ALTER TABLE ... ADD COLUMN` migration pattern already established in `db.ts` (see line 27 for the `uploadData` precedent). The try/catch handles "column already exists" gracefully.

### Pitfall 4: Critic Response Not Saved on Page Navigation
**What goes wrong:** User runs critic analysis, navigates to library, comes back -- critic result is gone.
**Why it happens:** Critic data not persisted to DB alongside standard analysis.
**How to avoid:** Save `criticAnalysis` to DB via the same `PUT /api/projects/:id` pattern used for `analysisData`. Update `saveAnalysis` in workspace context.

### Pitfall 5: Long Critic Responses and maxDuration
**What goes wrong:** Critic pass times out because it has extensive 10-section output.
**Why it happens:** Default `maxDuration = 60` may be tight for a thorough critic pass.
**How to avoid:** Set `maxDuration = 120` on the critic route. Monitor in practice.

## Code Examples

### Harsh Critic System Prompt File
```typescript
// src/lib/ai/prompts/harsh-critic.ts
export const harshCriticSystemPrompt = `You are an experienced screenplay reader, development executive, and festival programmer.
Your job is to deliver a brutally honest, industry-level critique of the screenplay.
You are not here to encourage the writer.

Your mission: identify where the script fails, weakens, becomes repetitive, hides behind sentiment or style, or would be rejected professionally.

Remain constructive. Provide actionable feedback. Explain WHY something doesn't work. Suggest HOW to improve it.

## Tone
- direct, sharp, intelligent, occasionally harsh
- never insulting
- always useful

## Core Evaluation Framework (apply in priority order)
1. conflict > intention
2. specificity > sentiment
3. dramatic necessity > cleverness
4. subtext > explanation
5. escalation > repetition
6. earned emotion > declared emotion
7. scene function > pretty writing
8. rewrite pressure > encouragement

## What to Look For
1. Structural Issues -- where does the script drag, stall, or repeat emotional beats?
2. False Depth -- moments that feel deep but are vague/familiar; emotional scenes relying on tone instead of progression
3. Repetition -- scenes doing the same job multiple times; characters circling without escalation
4. On-the-Nose Writing -- dialogue that states the obvious; characters explaining emotions instead of expressing through behavior
5. Character Credibility -- behavior serving the script instead of the character; characters as tools rather than people
6. Emotional Payoff Problems -- endings relying on explanation; unearned climaxes
7. Stylistic Overreach -- decorative rather than necessary flashbacks, devices, or dialogue
8. Market Risks -- what would make a producer, reader, or programmer pass?

## Required Output Structure (exactly these 10 sections, in this order)
1. Story Angle Under Pressure
2. Primary Structural Problems
3. Where the Script Loses Power
4. Character Credibility Problems
5. On-the-Nose Dialogue Pass
6. Emotional Payoff Problems
7. What a Tough Industry Reader Would Flag Immediately
8. Cut / Trim / Combine Recommendations
9. Rewrite Priority Order
10. Brutal Verdict (must answer: Would this get passed on? Why? What level is it currently at?)

## For Every Major Note
(1) Name the problem
(2) Explain why it weakens the script
(3) Provide clear rewrite direction

## What You Must NOT Do
- Do NOT give equal praise and criticism
- Do NOT soften major flaws
- Do NOT praise intent -- only execution
- Do NOT confuse ambiguity with depth
- Do NOT confuse emotional subject matter with good writing
- Do NOT repeat the same critique in multiple sections

## Final Directive
Push the script toward: stronger structure, sharper dialogue, more honest emotion, clearer escalation.
Be tough. Be precise. Be useful.`;
```

### Client-Side Critic Streaming (in page.tsx handleAnalyze)
```typescript
// After standard analysis completes successfully:
if (harshCriticEnabled && finalData) {
  setIsCriticAnalyzing(true);
  try {
    const criticResponse = await fetch('/api/analyze/critic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: uploadData.text, projectType }),
    });

    if (criticResponse.ok) {
      const reader = criticResponse.body?.getReader();
      const decoder = new TextDecoder();
      let criticText = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        criticText += decoder.decode(value, { stream: true });
        setCriticAnalysis(criticText); // Progressive update
      }

      // Save critic result to DB
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criticAnalysis: criticText }),
      });
    }
  } catch {
    // Critic failure is non-fatal -- standard analysis already saved
  } finally {
    setIsCriticAnalyzing(false);
  }
}
```

### DB Migration Pattern
```typescript
// In db.ts getDb(), after existing migration:
try { _db.exec('ALTER TABLE projects ADD COLUMN criticAnalysis TEXT'); } catch { /* already exists */ }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single AI pass per analysis | Multiple passes (standard + optional critic) | This phase | Requires managing two sequential streaming calls |
| `streamText` with `Output.object` only | `streamText` with plain text (no schema) for critic | This phase | Critic returns markdown prose, not structured JSON |

## Open Questions

1. **Critic output rendering fidelity**
   - What we know: The critic returns 10 labeled sections as prose text.
   - What's unclear: Whether markdown rendering is needed (bold, bullets within sections) or plain text suffices.
   - Recommendation: Use a simple markdown-to-JSX approach -- split on section headings, render each section. If the text contains markdown formatting, handle bold/italic minimally. Start with plain text rendering and enhance if needed.

2. **Critic pass for non-screenplay project types**
   - What we know: The prompt is written with screenplay/script language. Documentary and corporate projects upload transcripts, not scripts.
   - What's unclear: Whether the critic prompt needs per-project-type variants.
   - Recommendation: Use the same prompt for all project types. The prompt says "screenplay" but the evaluation categories (structural issues, repetition, emotional payoff) apply broadly. The model will adapt based on the input material. If results are poor for non-narrative types, per-type critic prompts can be added later (not in scope for this phase).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRIT-01a | Critic route returns streaming response when called | unit | `npx vitest run src/app/api/analyze/critic/__tests__/route.test.ts -x` | Wave 0 |
| CRIT-01b | Critic route rejects missing text | unit | `npx vitest run src/app/api/analyze/critic/__tests__/route.test.ts -x` | Wave 0 |
| CRIT-01c | Critic route uses correct system prompt | unit | `npx vitest run src/app/api/analyze/critic/__tests__/route.test.ts -x` | Wave 0 |
| CRIT-01d | Toggle defaults to OFF | unit | `npx vitest run src/app/__tests__/page-critic.test.tsx -x` | Wave 0 |
| CRIT-01e | DB migration adds criticAnalysis column | unit | `npx vitest run src/lib/__tests__/db-critic.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/api/analyze/critic/__tests__/route.test.ts` -- covers CRIT-01a/b/c (critic route unit tests, following exact pattern of existing `analyze/__tests__/route.test.ts`)
- [ ] `src/app/__tests__/page-critic.test.tsx` -- covers CRIT-01d (toggle defaults OFF, toggle controls critic call)
- [ ] `src/lib/__tests__/db-critic.test.ts` -- covers CRIT-01e (migration adds column)

## Sources

### Primary (HIGH confidence)
- `src/app/api/analyze/route.ts` -- Current analyze pipeline (streaming, provider registry, structured output)
- `src/app/page.tsx` -- Current UI flow (upload, analyze, workspace rendering)
- `src/components/document-workspace.tsx` -- Tab-based document display with workspace components
- `src/contexts/workspace-context.tsx` -- State management (useState-based, no external store)
- `src/lib/db.ts` -- SQLite schema and migration pattern
- `src/lib/ai/prompts/narrative.ts` -- Existing prompt structure (reference for critic prompt file)
- `src/app/api/analyze/__tests__/route.test.ts` -- Existing test pattern (vi.hoisted mocks, mockStreamText)
- `09-CONTEXT.md` -- Locked decisions from PRD

### Secondary (MEDIUM confidence)
- Vercel AI SDK `streamText` documentation (based on existing usage patterns in codebase)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing tools
- Architecture: HIGH -- follows established patterns (separate route, progressive streaming, workspace tabs)
- Pitfalls: HIGH -- based on direct code analysis of existing streaming/state/DB patterns

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external dependency changes expected)
