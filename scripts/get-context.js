#!/usr/bin/env node

/**
 * get-context — Context Mesh scope resolver
 *
 * Scans .md files in hub and local context directories,
 * extracts ## Scope sections, and returns matching files.
 *
 * Usage:
 *   node scripts/get-context.js <scope> [--hub <path>] [--local <path>] [--format bundle|list]
 *
 * Examples:
 *   node scripts/get-context.js api/auth
 *   node scripts/get-context.js "api/*" --hub ../context-hub/context --format bundle
 *   node scripts/get-context.js "*" --format list
 */

const fs = require("fs");
const path = require("path");

// ── CLI parsing ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    scope: null,
    hub: null,
    local: "./context",
    format: "bundle",
  };

  let i = 0;
  while (i < args.length) {
    if (args[i] === "--hub" && args[i + 1]) {
      result.hub = args[++i];
    } else if (args[i] === "--local" && args[i + 1]) {
      result.local = args[++i];
    } else if (args[i] === "--format" && args[i + 1]) {
      result.format = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      printUsage();
      process.exit(0);
    } else if (!args[i].startsWith("--")) {
      result.scope = args[i];
    }
    i++;
  }

  if (!result.scope) {
    console.error("Error: scope argument is required.\n");
    printUsage();
    process.exit(1);
  }

  return result;
}

function printUsage() {
  console.log(`Usage: get-context <scope> [options]

Arguments:
  scope              Scope to search for (e.g. api/auth, "api/*", "*")

Options:
  --hub <path>       Path to the hub context/ directory
  --local <path>     Path to the local context/ directory (default: ./context)
  --format <mode>    Output format: "bundle" (default) or "list"
  -h, --help         Show this help

Examples:
  get-context api/auth
  get-context "api/*" --hub ../context-hub/context
  get-context "*" --format list`);
}

// ── File scanning ────────────────────────────────────────────────────────────

function scanMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

// ── Scope extraction ─────────────────────────────────────────────────────────

function extractScopes(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const scopes = [];

  let inScopeSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect ## Scope heading (exact match, case-insensitive)
    if (/^##\s+scope\s*$/i.test(trimmed)) {
      inScopeSection = true;
      continue;
    }

    // Exit scope section on next heading
    if (inScopeSection && /^##\s+/.test(trimmed)) {
      break;
    }

    if (inScopeSection) {
      // Parse list items: "- api/auth" or "* api/auth"
      const match = trimmed.match(/^[-*]\s+(.+)/);
      if (match) {
        const scope = match[1].trim().replace(/`/g, "");
        if (scope) scopes.push(scope);
      }
    }
  }

  return scopes;
}

// ── Scope matching ───────────────────────────────────────────────────────────

function scopeMatches(fileScope, queryScope) {
  // Global wildcard matches everything
  if (fileScope === "*") return true;
  if (queryScope === "*") return true;

  // Exact match
  if (fileScope === queryScope) return true;

  // File has wildcard: api/* matches query api/auth
  if (fileScope.endsWith("/*")) {
    const prefix = fileScope.slice(0, -2); // "api"
    if (queryScope === prefix || queryScope.startsWith(prefix + "/")) {
      return true;
    }
  }

  // Query has wildcard: api/* matches file api/auth
  if (queryScope.endsWith("/*")) {
    const prefix = queryScope.slice(0, -2); // "api"
    if (fileScope === prefix || fileScope.startsWith(prefix + "/")) {
      return true;
    }
    // Also match file wildcards like api/* when querying api/*
    if (fileScope.endsWith("/*") && fileScope.slice(0, -2) === prefix) {
      return true;
    }
  }

  return false;
}

// ── Category ordering ────────────────────────────────────────────────────────

const CATEGORY_ORDER = {
  decisions: 0,
  constraints: 1,
  architecture: 2,
  playbooks: 3,
};

function getCategoryWeight(filePath) {
  for (const [category, weight] of Object.entries(CATEGORY_ORDER)) {
    if (filePath.includes(`/${category}/`) || filePath.includes(`\\${category}\\`)) {
      return weight;
    }
  }
  return 99;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const config = parseArgs(process.argv);

  const hubFiles = [];
  const localFiles = [];

  // Scan hub
  if (config.hub) {
    const hubDir = path.resolve(config.hub);
    if (!fs.existsSync(hubDir)) {
      console.error(`Warning: Hub directory not found: ${hubDir}`);
    } else {
      const files = scanMarkdownFiles(hubDir);
      for (const f of files) {
        const scopes = extractScopes(f);
        const matches = scopes.some((s) => scopeMatches(s, config.scope));
        if (matches) {
          hubFiles.push({ path: f, scopes, source: "hub", relPath: path.relative(hubDir, f) });
        }
      }
    }
  }

  // Scan local
  const localDir = path.resolve(config.local);
  if (!fs.existsSync(localDir)) {
    console.error(`Warning: Local directory not found: ${localDir}`);
  } else {
    const files = scanMarkdownFiles(localDir);
    for (const f of files) {
      const scopes = extractScopes(f);
      const matches = scopes.some((s) => scopeMatches(s, config.scope));
      if (matches) {
        localFiles.push({ path: f, scopes, source: "local", relPath: path.relative(localDir, f) });
      }
    }
  }

  // Sort: hub first, then by category order, then alphabetically
  const sortFn = (a, b) => {
    const catA = getCategoryWeight(a.path);
    const catB = getCategoryWeight(b.path);
    if (catA !== catB) return catA - catB;
    return a.relPath.localeCompare(b.relPath);
  };

  hubFiles.sort(sortFn);
  localFiles.sort(sortFn);

  const allFiles = [...hubFiles, ...localFiles];

  if (allFiles.length === 0) {
    console.log(`No context files found for scope: ${config.scope}`);
    process.exit(0);
  }

  // Output
  if (config.format === "list") {
    console.log(`\n📋 Context files for scope: ${config.scope}\n`);
    console.log("─".repeat(60));
    for (const f of allFiles) {
      const scopeStr = f.scopes.join(", ");
      console.log(`  [${f.source}] ${f.relPath}  (${scopeStr})`);
    }
    console.log("─".repeat(60));
    console.log(`\nTotal: ${allFiles.length} file(s)\n`);
  } else {
    // Bundle mode
    const parts = [];
    for (const f of allFiles) {
      const content = fs.readFileSync(f.path, "utf-8");
      parts.push(`===== FILE: ${f.source} > ${f.relPath} =====`);
      parts.push(content);
      parts.push("");
    }
    console.log(parts.join("\n"));
  }
}

main();
