// Make the AI Judge Laugh: Developer Excuses (Node 22, standard library only).
//
// The entry is one line: a funny excuse a developer gives when code breaks
// in production. This program carries the line from LINE.txt to the judge's
// inbox at /output/entry.txt, after running it through a small table of
// rules. A rule that fails stops the run with a message naming the rule,
// so a bad line never reaches the judge half-checked.
//
// Local dry run (no grader needed):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const botDir = resolve(process.env.MAKEFUN_BOT_DIR ?? "/bot");
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
const inputFile = join(botDir, "LINE.txt");
const outputFile = join(outDir, "entry.txt");

type Rule = {
  name: string;
  why: string;
  ok: (text: string) => boolean;
};

// Every rule the gate cares about, written out so each failure names itself.
const RULES: Rule[] = [
  {
    name: "length",
    why: "must be 1 to 200 characters",
    ok: (text) => text.length >= 1 && text.length <= 200,
  },
  {
    name: "non-blank",
    why: "must not be only white space",
    ok: (text) => text.trim().length > 0,
  },
  {
    name: "single-line",
    why: "must be a single line",
    ok: (text) => !/[\r\n]/.test(text),
  },
  {
    name: "no-control",
    why: "must not contain control characters",
    ok: (text) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text),
  },
  {
    name: "no-tabs",
    why: "must not contain tab characters",
    ok: (text) => !/\t/.test(text),
  },
  {
    name: "no-padding",
    why: "must not start or end with white space",
    ok: (text) => text === text.trim(),
  },
];

function loadExcuse(): string {
  let raw: string;
  try {
    raw = readFileSync(inputFile, "utf8");
  } catch {
    throw new Error(`cannot read the excuse at ${inputFile}`);
  }
  // A trailing newline is the file's, not the excuse's.
  return raw.replace(/\r?\n$/, "");
}

function main(): void {
  const excuse = loadExcuse();
  const failed = RULES.filter((rule) => !rule.ok(excuse));
  if (failed.length > 0) {
    const reasons = failed.map((rule) => `${rule.name} (${rule.why})`).join("; ");
    throw new Error(`excuse rejected at ${excuse.length} chars: ${reasons}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outputFile, excuse, "utf8");
  const roundTrip = readFileSync(outputFile, "utf8");
  if (roundTrip !== excuse) {
    throw new Error("round-trip check failed: entry.txt differs from LINE.txt");
  }
  console.log(`excuse accepted (${excuse.length} chars): ${excuse}`);
}

main();
