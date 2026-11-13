// Guards against dead links: every internal link in the app, and every page route named in the README, must point at a
// page that exists. (A link to /forms once shipped without app/forms/page.tsx and 404'd.)
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// All files under a folder with the given extensions.
function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(rel);
  }
  return out;
}

// Top-level routes that exist: "" for the home page, plus every folder in app/ that has a page.tsx.
const routes = new Set<string>([""]);
for (const entry of fs.readdirSync(path.join(root, "app"), { withFileTypes: true })) {
  if (entry.isDirectory() && fs.existsSync(path.join(root, "app", entry.name, "page.tsx"))) routes.add(entry.name);
}

// Paths that are not pages: API routes and files served from /public.
const NOT_PAGES = new Set(["api", "templates", "_next"]);

// First path segment of each internal href written in a source file, e.g. href="/scan?form=x" -> "scan".
function internalLinks(source: string): string[] {
  const found: string[] = [];
  const pattern = /href=(?:"|'|\{`)\/([a-z0-9-]*)/g;
  for (const m of Array.from(source.matchAll(pattern))) found.push(m[1]);
  return found;
}

describe("internal links", () => {
  const files = [...walk("app", [".tsx"]), ...walk("components", [".tsx"])];

  it("finds the app's pages", () => {
    expect(Array.from(routes)).toEqual(expect.arrayContaining(["", "scan", "speak", "fill", "privacy", "forms"]));
  });

  it.each(files)("%s links only to pages that exist", (file) => {
    const source = fs.readFileSync(path.join(root, file), "utf-8");
    for (const segment of internalLinks(source)) {
      if (NOT_PAGES.has(segment)) continue;
      expect(routes.has(segment), `${file} links to /${segment}, but app/${segment}/page.tsx does not exist`).toBe(
        true,
      );
    }
  });
});

describe("README", () => {
  it("only names page routes that exist", () => {
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf-8");
    // Routes written in backticks, like `/forms` or `/scan?form=<id>`.
    for (const m of Array.from(readme.matchAll(/`\/([a-z0-9-]+)(?:[?/][^`]*)?`/g))) {
      const segment = m[1];
      if (NOT_PAGES.has(segment)) continue;
      expect(routes.has(segment), `README.md names /${segment}, but app/${segment}/page.tsx does not exist`).toBe(true);
    }
  });
});
