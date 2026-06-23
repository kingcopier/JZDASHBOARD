import JSZip from 'jszip';

export interface ParsedSkill {
  name?: string;
  description?: string;
  body: string;   // SKILL.md markdown after the frontmatter block
  rawMd: string;  // full SKILL.md text
}

/**
 * Parse the simple YAML-ish frontmatter at the top of a SKILL.md.
 * Skills use flat `key: value` pairs (name, description), one per line —
 * so a tiny line parser is enough and we avoid pulling in a YAML dependency.
 */
function parseFrontmatter(md: string): { data: Record<string, string>; body: string } {
  const m = md.match(/^﻿?---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: md };

  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^["']|["']$/g, ''); // strip surrounding quotes
    if (key) data[key] = val;
  }
  return { data, body: m[2] };
}

/**
 * Read a .skill / .skills / .zip bundle and pull metadata out of its SKILL.md.
 * Finds the shallowest SKILL.md (root, or one nested folder like `big-bird/SKILL.md`).
 * Returns null if the file isn't a valid zip or contains no SKILL.md — the caller
 * then falls back to manual entry.
 */
export async function parseSkillBundle(file: File): Promise<ParsedSkill | null> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    return null; // not a valid zip archive
  }

  const candidates: { depth: number; entry: JSZip.JSZipObject }[] = [];
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    if (!/(^|\/)SKILL\.md$/i.test(path)) return;
    candidates.push({ depth: path.split('/').length, entry });
  });

  if (candidates.length === 0) return null;

  // Prefer the shallowest SKILL.md (root, then one nested folder deep).
  candidates.sort((a, b) => a.depth - b.depth);
  const rawMd = await candidates[0].entry.async('string');
  const { data, body } = parseFrontmatter(rawMd);
  return {
    name: data.name || undefined,
    description: data.description || undefined,
    body: body.trim(),
    rawMd,
  };
}
