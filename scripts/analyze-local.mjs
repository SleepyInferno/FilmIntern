#!/usr/bin/env node

/**
 * Local Model Analysis CLI
 *
 * Runs FilmIntern's analysis prompts (standard analysis, harsh critic,
 * full rewrite) against local LM Studio models and saves results for
 * side-by-side comparison.
 *
 * Usage:
 *   node scripts/analyze-local.mjs --script path/to/script.txt --type narrative
 *   node scripts/analyze-local.mjs --script path/to/script.pdf --type narrative --models "gemma,qwen"
 *   node scripts/analyze-local.mjs --script path/to/script.txt --type narrative --phases critic,rewrite
 *
 * Options:
 *   --script   Path to script file (.txt or .pdf)
 *   --type     Project type: narrative, tv-episodic, documentary, corporate (default: narrative)
 *   --models   Comma-separated model filter (partial match). Omit to use all loaded models.
 *   --phases   Comma-separated phases to run: analysis, critic, rewrite (default: all)
 *   --port     LM Studio port (default: 1234)
 *   --host     Host address (default: localhost)
 *   --endpoints  Comma-separated host:port/model specs for multi-host runs (e.g., "localhost:1234/qwen,192.168.1.9:11434/gemma4")
 *   --output   Output directory (default: ./analysis_output)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Argument parsing ────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    script: '',
    type: 'narrative',
    models: '',
    phases: 'analysis,critic,rewrite',
    port: '1234',
    host: 'localhost',
    endpoints: '',
    output: './analysis_output',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--') && i + 1 < args.length) {
      const key = arg.slice(2);
      if (key in opts) opts[key] = args[++i];
    }
  }

  if (!opts.script) {
    console.error('Usage: node scripts/analyze-local.mjs --script <path> [--type narrative] [--models "gemma,qwen"] [--phases analysis,critic,rewrite]');
    process.exit(1);
  }

  return opts;
}

// ── LM Studio API ───────────────────────────────────────────────

async function fetchModels(host) {
  const res = await fetch(`http://${host}/v1/models`);
  const data = await res.json();
  return data.data
    .map((m) => m.id)
    .filter((id) => !id.includes('embed')); // skip embedding models
}

async function chatCompletion(host, model, systemPrompt, userPrompt) {
  const res = await fetch(`http://${host}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
      stream: false,
    }),
    signal: AbortSignal.timeout(600000), // 10 minute timeout
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  // Some models (e.g., Qwen) put output in reasoning_content
  return message?.content || message?.reasoning_content || '';
}

// ── Load prompts from the app ───────────────────────────────────

// We can't import .ts files directly, so we'll read and extract the
// template literal strings manually.
function extractExportedString(filePath, exportName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Match: export const NAME = `...`;  or  export const NAME = "...";
  const backtickRegex = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\`([\\s\\S]*?)\`\\s*;`);
  const match = content.match(backtickRegex);
  if (match) return match[1];

  // Fallback: single/double quote
  const quoteRegex = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*(['"])(.*?)\\1\\s*;`);
  const qMatch = content.match(quoteRegex);
  if (qMatch) return qMatch[2];

  throw new Error(`Could not extract ${exportName} from ${filePath}`);
}

function loadPrompts(projectType) {
  const promptDir = path.join(ROOT, 'src', 'lib', 'ai', 'prompts');

  // Standard analysis prompt
  const analysisPromptMap = {
    narrative: { file: 'narrative.ts', name: 'narrativeSystemPrompt' },
    'tv-episodic': { file: 'tv-episodic.ts', name: 'tvEpisodicSystemPrompt' },
    documentary: { file: 'documentary.ts', name: 'documentarySystemPrompt' },
    corporate: { file: 'corporate.ts', name: 'corporateSystemPrompt' },
  };

  const analysisConfig = analysisPromptMap[projectType];
  if (!analysisConfig) throw new Error(`Unknown project type: ${projectType}`);

  const analysisPrompt = extractExportedString(
    path.join(promptDir, analysisConfig.file),
    analysisConfig.name
  );

  // Harsh critic prompt
  const criticPrompt = extractExportedString(
    path.join(promptDir, 'harsh-critic.ts'),
    'harshCriticSystemPrompt'
  );

  // Full rewrite prompt
  const rewritePrompt = extractExportedString(
    path.join(promptDir, 'full-rewrite.ts'),
    'fullRewriteSystemPrompt'
  );

  return { analysisPrompt, criticPrompt, rewritePrompt };
}

// ── Read script file ────────────────────────────────────────────

async function readScript(scriptPath) {
  const ext = path.extname(scriptPath).toLowerCase();

  if (ext === '.txt' || ext === '.fountain') {
    return fs.readFileSync(scriptPath, 'utf-8');
  }

  if (ext === '.pdf') {
    try {
      const pdfjsPath = path.join(ROOT, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs');
      const pdfjsLib = await import('file:///' + pdfjsPath.replace(/\\/g, '/'));
      const buf = fs.readFileSync(scriptPath);
      const uint8 = new Uint8Array(buf);
      const doc = await pdfjsLib.getDocument({ data: uint8 }).promise;
      let text = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ');
        text += pageText + '\n';
      }
      return text;
    } catch (e) {
      console.error('PDF parsing failed:', e.message);
      console.error('Provide a .txt file instead, or ensure pdfjs-dist is installed.');
      process.exit(1);
    }
  }

  // Default: try reading as text
  return fs.readFileSync(scriptPath, 'utf-8');
}

// ── Sanitize model name for filenames ───────────────────────────

function sanitizeModelName(model) {
  return model.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();
  const phases = opts.phases.split(',').map((p) => p.trim());

  console.log('=== FilmIntern Local Model Analysis ===\n');
  console.log(`Script:  ${opts.script}`);
  console.log(`Type:    ${opts.type}`);
  console.log(`Phases:  ${phases.join(', ')}`);
  console.log(`Output:  ${opts.output}\n`);

  // Read script
  console.log('Reading script...');
  const scriptText = await readScript(opts.script);
  console.log(`  ${scriptText.length} characters read.\n`);

  // Build list of { host, model } targets
  /** @type {{ host: string, model: string }[]} */
  let targets = [];

  if (opts.endpoints) {
    // --endpoints "localhost:1234/qwen,192.168.1.9:11434/gemma4"
    for (const ep of opts.endpoints.split(',').map((s) => s.trim())) {
      const slashIdx = ep.indexOf('/', ep.indexOf(':') + 1);
      if (slashIdx === -1) {
        console.error(`Invalid endpoint format: ${ep}. Use host:port/model-filter`);
        process.exit(1);
      }
      const host = ep.slice(0, slashIdx);
      const modelFilter = ep.slice(slashIdx + 1).toLowerCase();
      console.log(`Querying ${host} for models matching "${modelFilter}"...`);
      const available = await fetchModels(host);
      const matched = available.filter((m) => m.toLowerCase().includes(modelFilter));
      for (const model of matched) {
        targets.push({ host, model });
        console.log(`  Found: ${model}`);
      }
    }
  } else {
    // Single host mode
    const host = `${opts.host}:${opts.port}`;
    console.log(`Querying ${host} for models...`);
    let models = await fetchModels(host);
    if (opts.models) {
      const filters = opts.models.split(',').map((f) => f.trim().toLowerCase());
      models = models.filter((m) => filters.some((f) => m.toLowerCase().includes(f)));
    }
    targets = models.map((model) => ({ host, model }));
    console.log(`  Found: ${targets.map((t) => t.model).join(', ')}`);
  }

  if (targets.length === 0) {
    console.error('No models available. Check your endpoints and try again.');
    process.exit(1);
  }

  console.log(`\nRunning against ${targets.length} model(s).\n`);

  // Load prompts
  console.log('Loading prompts from FilmIntern...');
  const prompts = loadPrompts(opts.type);
  console.log('  Loaded analysis, critic, and rewrite prompts.\n');

  // Create output directory
  const outputDir = path.resolve(opts.output);
  fs.mkdirSync(outputDir, { recursive: true });

  // Run each phase against each model
  const results = {};
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  for (const target of targets) {
    const { host, model } = target;
    const modelSafe = sanitizeModelName(model);
    const modelDir = path.join(outputDir, `${timestamp}_${modelSafe}`);
    fs.mkdirSync(modelDir, { recursive: true });

    results[model] = {};
    console.log(`\n${'='.repeat(60)}`);
    console.log(`MODEL: ${model} @ ${host}`);
    console.log('='.repeat(60));

    // Phase 1: Standard Analysis
    if (phases.includes('analysis')) {
      console.log(`\n  [1/3] Running standard analysis...`);
      const start = Date.now();
      try {
        const userPrompt = `Project type: ${opts.type}\n\nAnalyze this material:\n\n${scriptText}`;
        const result = await chatCompletion(host, model, prompts.analysisPrompt, userPrompt);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  Done in ${elapsed}s (${result.length} chars)`);

        const outFile = path.join(modelDir, 'analysis.md');
        fs.writeFileSync(outFile, `# Standard Analysis\n\n**Model:** ${model}\n**Host:** ${host}\n**Type:** ${opts.type}\n**Duration:** ${elapsed}s\n\n---\n\n${result}`);
        results[model].analysis = { elapsed, chars: result.length, file: outFile };
      } catch (e) {
        console.error(`  FAILED: ${e.message}`);
        results[model].analysis = { error: e.message };
      }
    }

    // Phase 2: Harsh Critic
    if (phases.includes('critic')) {
      console.log(`  [2/3] Running harsh critic...`);
      const start = Date.now();
      try {
        const userPrompt = `Project type: ${opts.type}\n\nAnalyze this material with your harshest critical lens:\n\n${scriptText}`;
        const result = await chatCompletion(host, model, prompts.criticPrompt, userPrompt);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  Done in ${elapsed}s (${result.length} chars)`);

        const outFile = path.join(modelDir, 'harsh-critic.md');
        fs.writeFileSync(outFile, `# Harsh Critic Analysis\n\n**Model:** ${model}\n**Host:** ${host}\n**Type:** ${opts.type}\n**Duration:** ${elapsed}s\n\n---\n\n${result}`);
        results[model].critic = { elapsed, chars: result.length, file: outFile };
      } catch (e) {
        console.error(`  FAILED: ${e.message}`);
        results[model].critic = { error: e.message };
      }
    }

    // Phase 3: Full Rewrite (uses critic output if available)
    if (phases.includes('rewrite')) {
      const criticText = results[model]?.critic?.file
        ? fs.readFileSync(results[model].critic.file, 'utf-8')
        : 'No critic analysis available. Improve the script based on your professional judgment.';

      console.log(`  [3/3] Running full rewrite...`);
      const start = Date.now();
      try {
        const userPrompt = `## PROJECT TYPE\n${opts.type}\n\n---\n\n## CRITIC ANALYSIS\n\n${criticText}\n\n---\n\n## ORIGINAL SCRIPT\n\n${scriptText}`;
        const result = await chatCompletion(host, model, prompts.rewritePrompt, userPrompt);
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`  Done in ${elapsed}s (${result.length} chars)`);

        const outFile = path.join(modelDir, 'full-rewrite.md');
        fs.writeFileSync(outFile, `# Full Rewrite\n\n**Model:** ${model}\n**Host:** ${host}\n**Type:** ${opts.type}\n**Duration:** ${elapsed}s\n\n---\n\n${result}`);
        results[model].rewrite = { elapsed, chars: result.length, file: outFile };
      } catch (e) {
        console.error(`  FAILED: ${e.message}`);
        results[model].rewrite = { error: e.message };
      }
    }
  }

  // Write comparison summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('COMPARISON SUMMARY');
  console.log('='.repeat(60));

  let summary = `# Analysis Comparison\n\n**Script:** ${path.basename(opts.script)}\n**Type:** ${opts.type}\n**Date:** ${new Date().toISOString()}\n**Models:** ${targets.map((t) => `${t.model} @ ${t.host}`).join(', ')}\n\n`;

  summary += '## Results\n\n';
  summary += '| Model | Analysis | Critic | Rewrite |\n';
  summary += '|-------|----------|--------|---------|\n';

  for (const { model } of targets) {
    const r = results[model];
    const fmtResult = (phase) => {
      if (!phase) return 'skipped';
      if (phase.error) return `FAILED`;
      return `${phase.elapsed}s / ${phase.chars} chars`;
    };
    summary += `| ${model} | ${fmtResult(r.analysis)} | ${fmtResult(r.critic)} | ${fmtResult(r.rewrite)} |\n`;
    console.log(`  ${model}:`);
    if (r.analysis) console.log(`    Analysis: ${r.analysis.error || `${r.analysis.elapsed}s`}`);
    if (r.critic) console.log(`    Critic:   ${r.critic.error || `${r.critic.elapsed}s`}`);
    if (r.rewrite) console.log(`    Rewrite:  ${r.rewrite.error || `${r.rewrite.elapsed}s`}`);
  }

  const summaryFile = path.join(outputDir, `${timestamp}_comparison.md`);
  fs.writeFileSync(summaryFile, summary);

  console.log(`\nResults saved to: ${outputDir}`);
  console.log(`Summary: ${summaryFile}`);
}

main().catch((e) => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
