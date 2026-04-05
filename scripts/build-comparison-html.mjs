#!/usr/bin/env node

/**
 * Builds a side-by-side HTML comparison page from analysis output files.
 *
 * Usage: node scripts/build-comparison-html.mjs --input <dir> --output <file>
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const inputDir = args[args.indexOf('--input') + 1] || '';
const outputFile = args[args.indexOf('--output') + 1] || '';

if (!inputDir || !outputFile) {
  console.error('Usage: node scripts/build-comparison-html.mjs --input <dir> --output <file.html>');
  process.exit(1);
}

// Discover model directories and find the best (most complete) run per model
const entries = fs.readdirSync(inputDir, { withFileTypes: true });
const modelDirs = entries.filter((e) => e.isDirectory());

// Group by model name (strip timestamp prefix)
const modelFiles = {};

for (const dir of modelDirs) {
  // Format: 2026-04-05T05-27-29_modelname
  const parts = dir.name.split('_');
  parts.shift(); // remove timestamp
  const modelKey = parts.join('_');

  if (!modelFiles[modelKey]) modelFiles[modelKey] = {};

  const dirPath = path.join(inputDir, dir.name);
  for (const file of ['analysis.md', 'harsh-critic.md', 'full-rewrite.md']) {
    const filePath = path.join(dirPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Only use if content is substantial (not a failed run)
      if (content.length > 200) {
        const key = file.replace('.md', '');
        // Keep the longest version (most complete)
        if (!modelFiles[modelKey][key] || content.length > modelFiles[modelKey][key].length) {
          modelFiles[modelKey][key] = content;
        }
      }
    }
  }
}

const modelNames = Object.keys(modelFiles);
console.log(`Found ${modelNames.length} models:`, modelNames.join(', '));

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(md) {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to <br>
    .replace(/\n/g, '<br />')
    ;
}

const sections = [
  { key: 'analysis', label: 'Standard Analysis' },
  { key: 'harsh-critic', label: 'Harsh Critic' },
  { key: 'full-rewrite', label: 'Full Rewrite' },
];

// Build tab content for each section
let tabButtons = '';
let tabContents = '';

for (let si = 0; si < sections.length; si++) {
  const section = sections[si];
  const active = si === 0 ? ' active' : '';

  tabButtons += `<button class="tab-btn${active}" onclick="showTab('${section.key}')" id="btn-${section.key}">${section.label}</button>`;

  let columns = '';
  for (const modelName of modelNames) {
    const content = modelFiles[modelName][section.key];
    const displayName = modelName.replace(/_/g, '/');
    if (content) {
      // Strip the header metadata (first few lines up to ---)
      const bodyStart = content.indexOf('---\n\n');
      const body = bodyStart !== -1 ? content.slice(bodyStart + 5) : content;
      columns += `
        <div class="model-column">
          <div class="model-header">${escapeHtml(displayName)}</div>
          <div class="model-content"><p>${markdownToHtml(escapeHtml(body))}</p></div>
        </div>`;
    } else {
      columns += `
        <div class="model-column">
          <div class="model-header">${escapeHtml(displayName)}</div>
          <div class="model-content"><p class="no-data">No data available for this phase.</p></div>
        </div>`;
    }
  }

  tabContents += `<div class="tab-content${active}" id="tab-${section.key}"><div class="comparison-grid">${columns}</div></div>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FilmIntern - Model Comparison</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f;
      color: #e0e0e0;
      line-height: 1.6;
    }
    .header {
      background: #1a1a1a;
      border-bottom: 1px solid #333;
      padding: 20px 32px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    }
    .header p {
      font-size: 13px;
      color: #888;
      margin-top: 4px;
    }
    .tabs {
      display: flex;
      gap: 0;
      background: #1a1a1a;
      border-bottom: 1px solid #333;
      padding: 0 32px;
    }
    .tab-btn {
      padding: 12px 24px;
      background: none;
      border: none;
      color: #888;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #ccc; }
    .tab-btn.active {
      color: #fff;
      border-bottom-color: #3b82f6;
    }
    .tab-content {
      display: none;
      padding: 24px 32px;
    }
    .tab-content.active { display: block; }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(${modelNames.length}, 1fr);
      gap: 20px;
    }
    .model-column {
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }
    .model-header {
      background: #252525;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 14px;
      color: #3b82f6;
      border-bottom: 1px solid #333;
    }
    .model-content {
      padding: 16px;
      max-height: calc(100vh - 200px);
      overflow-y: auto;
      font-size: 13px;
      line-height: 1.7;
    }
    .model-content h2 { font-size: 16px; color: #fff; margin: 20px 0 8px; }
    .model-content h3 { font-size: 14px; color: #ddd; margin: 16px 0 6px; }
    .model-content h4 { font-size: 13px; color: #ccc; margin: 12px 0 4px; }
    .model-content strong { color: #fff; }
    .model-content hr { border: none; border-top: 1px solid #333; margin: 16px 0; }
    .model-content li { margin-left: 20px; margin-bottom: 4px; }
    .model-content p { margin-bottom: 8px; }
    .no-data { color: #666; font-style: italic; }
    /* Scrollbar styling */
    .model-content::-webkit-scrollbar { width: 6px; }
    .model-content::-webkit-scrollbar-track { background: #1a1a1a; }
    .model-content::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FilmIntern — Model Comparison</h1>
    <p>The Farewell Dinner — Narrative Analysis &bull; ${new Date().toLocaleDateString()} &bull; Models: ${modelNames.map((n) => n.replace(/_/g, '/')).join(', ')}</p>
  </div>
  <div class="tabs">
    ${tabButtons}
  </div>
  ${tabContents}
  <script>
    function showTab(key) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + key).classList.add('active');
      document.getElementById('btn-' + key).classList.add('active');
    }
  </script>
</body>
</html>`;

fs.writeFileSync(outputFile, html);
console.log(`Comparison HTML written to: ${outputFile}`);
