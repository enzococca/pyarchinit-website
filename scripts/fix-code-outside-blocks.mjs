/**
 * Fix Python course lessons: move orphaned Python code lines from <p> tags
 * into proper <pre><code class="language-python"> blocks.
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/fix-code-outside-blocks.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Heuristic: is this plain text a Python code line? ───────────────────────

function isPythonCode(text) {
  // Remove HTML entities and tags
  const clean = text
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

  if (!clean) return false;

  // Skip normal sentences: starts uppercase, ends with sentence punctuation, many words
  if (/^[A-Z][a-z].*[.!?]$/.test(clean) && clean.split(" ").length > 8) return false;

  // Skip lines that look like HTML attributes or URLs
  if (/^https?:\/\//.test(clean)) return false;
  if (/^<[a-z]/i.test(clean)) return false;

  // Skip lines that are only punctuation or very short non-code
  if (clean.length < 3) return false;

  // Python code patterns
  const patterns = [
    /^\s*\w+\s*=\s*[^=]/, // assignment (x = 10, but not ==)
    /^\s*\w+\s*\+=\s*/, // augmented assignment
    /^\s*\w+\s*-=\s*/,
    /^\s*\w+\.\w+\(/, // method call (obj.method()
    /^\s*\w+\(/, // function call like print(, len(
    /^\s*(import|from)\s+\w/, // import statements
    /^\s*(for|if|elif|else|while|def|class|return|try|except|finally|with|pass|break|continue|raise|yield|lambda|assert|del|global|nonlocal)\b/, // keywords
    /^\s*#/, // comments
    /\b(plt|np|pd|ax|fig|os|sys|json|csv|re|math|random|datetime|pathlib|io|shutil|zipfile|sqlite3|logging|argparse|collections|itertools|functools)\b\.\w+/, // common module usage
    /\b(qgis|QgsApplication|QgsVectorLayer|QgsProject|QgsField|QgsGeometry|QgsPoint|QgsFeature|QgsDataSourceUri|QgsRasterLayer|QgsCoordinateReferenceSystem)\b/, // QGIS API
    /^\s*\[.*\]\s*$/, // list literals
    /^\s*\{.*\}\s*$/, // dict/set literals
    /^\s*\(.*\)\s*$/, // tuple literals
    /^\s*"""/, // docstrings
    /^\s*'''/, // docstrings
    /^\s*@\w+/, // decorators
    /\bif\s+__name__\s*==/, // if __name__ == "__main__"
    /^\s*\w+\s*:\s*$/, // dict key or label
    /^\s*(True|False|None)\s*$/, // Python constants
    /^\s*\d+(\.\d+)?\s*$/, // bare numbers (likely code context)
    /^\s*print\s*\(/, // print function
    /^\s*input\s*\(/, // input function
    /^\s*len\s*\(/, // len function
    /^\s*range\s*\(/, // range
    /^\s*list\s*\(/, // list()
    /^\s*dict\s*\(/, // dict()
    /^\s*str\s*\(/, // str()
    /^\s*int\s*\(/, // int()
    /^\s*float\s*\(/, // float()
    /^\s*open\s*\(/, // open()
    /^\s*zip\s*\(/, // zip()
    /^\s*map\s*\(/, // map()
    /^\s*filter\s*\(/, // filter()
    /^\s*enumerate\s*\(/, // enumerate()
    /^\s*sorted\s*\(/, // sorted()
    /^\s*isinstance\s*\(/, // isinstance()
    /^\s*type\s*\(/, // type()
    /^\s*hasattr\s*\(/, // hasattr()
    /^\s*getattr\s*\(/, // getattr()
    /^\s*setattr\s*\(/, // setattr()
  ];

  return patterns.some((p) => p.test(clean));
}

// ─── Extract inner text from a <p> tag ──────────────────────────────────────

function extractPText(pTag) {
  const match = pTag.match(/^<p[^>]*>([\s\S]*?)<\/p>$/i);
  return match ? match[1] : pTag;
}

// ─── Extract code from a <pre><code...> block ────────────────────────────────

function extractCodeContent(block) {
  const match = block.match(/^<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>$/i);
  return match ? match[1] : block;
}

// ─── Parse HTML into tokens: code blocks, p tags, other ──────────────────────

function tokenize(html) {
  const tokens = [];
  // We'll parse tag by tag
  let remaining = html;
  let pos = 0;

  while (remaining.length > 0) {
    // Check for <pre><code ...>...</code></pre>
    const preMatch = remaining.match(/^(<pre><code(?:[^>]*)>[\s\S]*?<\/code><\/pre>)/i);
    if (preMatch) {
      tokens.push({ type: "code", raw: preMatch[1] });
      remaining = remaining.slice(preMatch[1].length);
      continue;
    }

    // Check for <p ...>...</p>
    const pMatch = remaining.match(/^(<p(?:[^>]*)>[\s\S]*?<\/p>)/i);
    if (pMatch) {
      tokens.push({ type: "p", raw: pMatch[1] });
      remaining = remaining.slice(pMatch[1].length);
      continue;
    }

    // Otherwise consume one character as "other"
    // But actually let's try to grab a full tag or text node
    const nextTag = remaining.match(/^(<[^>]+>)/);
    if (nextTag) {
      tokens.push({ type: "other", raw: nextTag[1] });
      remaining = remaining.slice(nextTag[1].length);
      continue;
    }

    // Text node - consume until next tag
    const textUntilTag = remaining.match(/^([^<]+)/);
    if (textUntilTag) {
      tokens.push({ type: "other", raw: textUntilTag[1] });
      remaining = remaining.slice(textUntilTag[1].length);
      continue;
    }

    // Fallback: consume one char
    tokens.push({ type: "other", raw: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}

// ─── Merge tokens, fixing orphaned code lines ────────────────────────────────

function fixOrphanedCodeLines(html) {
  const tokens = tokenize(html);
  let movedLines = 0;

  // Mark each <p> token as code or not
  for (const tok of tokens) {
    if (tok.type === "p") {
      const innerText = extractPText(tok.raw);
      tok.isCode = isPythonCode(innerText);
      tok.innerText = innerText;
    }
  }

  // Now merge:
  // Pass 1: merge code-<p> tokens into adjacent code blocks
  // We'll build a new token array
  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    const newTokens = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];

      if (tok.type === "p" && tok.isCode) {
        // Look at neighbors (skip whitespace-only "other" tokens)
        let prevCodeIdx = -1;
        let nextCodeIdx = -1;

        // Search backwards for adjacent code block
        for (let j = newTokens.length - 1; j >= 0; j--) {
          if (newTokens[j].type === "other" && /^\s*$/.test(newTokens[j].raw)) continue;
          if (newTokens[j].type === "code") {
            prevCodeIdx = j;
          }
          break;
        }

        // Search forwards for adjacent code block
        for (let j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type === "other" && /^\s*$/.test(tokens[j].raw)) continue;
          if (tokens[j].type === "code") {
            nextCodeIdx = j;
          }
          break;
        }

        const codeText = tok.innerText
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, " ");

        if (prevCodeIdx !== -1 && nextCodeIdx !== -1) {
          // Between two code blocks: merge prev + this + next
          const prevCode = extractCodeContent(newTokens[prevCodeIdx].raw);
          // Also consume the next code block from remaining tokens
          const nextCode = extractCodeContent(tokens[nextCodeIdx].raw);

          newTokens[prevCodeIdx] = {
            type: "code",
            raw: `<pre><code class="language-python">${prevCode}\n${codeText}\n${nextCode}</code></pre>`,
          };

          // Skip whitespace tokens between i+1 and nextCodeIdx
          // and skip nextCodeIdx itself
          // We do this by marking tokens[nextCodeIdx] as consumed
          tokens[nextCodeIdx] = { type: "consumed", raw: "" };

          movedLines++;
          changed = true;
          continue;
        } else if (prevCodeIdx !== -1) {
          // After a code block: append to it
          const prevCode = extractCodeContent(newTokens[prevCodeIdx].raw);
          newTokens[prevCodeIdx] = {
            type: "code",
            raw: `<pre><code class="language-python">${prevCode}\n${codeText}</code></pre>`,
          };
          movedLines++;
          changed = true;
          continue;
        } else if (nextCodeIdx !== -1) {
          // Before a code block: prepend to it
          const nextCode = extractCodeContent(tokens[nextCodeIdx].raw);
          tokens[nextCodeIdx] = {
            type: "code",
            raw: `<pre><code class="language-python">${codeText}\n${nextCode}</code></pre>`,
          };
          // Don't push the <p> token
          movedLines++;
          changed = true;
          continue;
        } else {
          // Standalone: wrap in its own code block
          newTokens.push({
            type: "code",
            raw: `<pre><code class="language-python">${codeText}</code></pre>`,
          });
          movedLines++;
          changed = true;
          continue;
        }
      }

      if (tok.type !== "consumed") {
        newTokens.push(tok);
      }
    }

    // Replace tokens for next iteration
    tokens.length = 0;
    tokens.push(...newTokens);
  }

  // Pass 2: merge consecutive code blocks (nothing or only whitespace between them)
  const mergedTokens = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type !== "code") {
      mergedTokens.push(tok);
      continue;
    }

    // Look ahead: collect consecutive code blocks separated only by whitespace
    let combined = extractCodeContent(tok.raw);
    let j = i + 1;
    while (j < tokens.length) {
      if (tokens[j].type === "other" && /^\s*$/.test(tokens[j].raw)) {
        j++;
        continue;
      }
      if (tokens[j].type === "code") {
        combined += "\n" + extractCodeContent(tokens[j].raw);
        j++;
        continue;
      }
      break;
    }
    i = j - 1;

    mergedTokens.push({
      type: "code",
      raw: `<pre><code class="language-python">${combined}</code></pre>`,
    });
  }

  // Reconstruct HTML
  const result = mergedTokens.map((t) => t.raw).join("");
  return { html: result, movedLines };
}

// ─── Also ensure all code blocks have the language-python class ──────────────

function fixCodeBlockClass(html) {
  return html.replace(/<pre><code(?!\s+class)/g, '<pre><code class="language-python"');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Fix orphaned Python code lines in all lessons ===\n");

  // Load the course
  const course = await prisma.interactiveCourse.findUnique({
    where: { slug: "python-archeologi" },
    include: {
      modules: {
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) throw new Error("Course 'python-archeologi' not found!");

  const allLessons = course.modules.flatMap((m) => m.lessons);
  console.log(`Found ${allLessons.length} lessons across ${course.modules.length} modules.\n`);

  let totalFixed = 0;
  let totalMovedLines = 0;

  for (const lesson of allLessons) {
    let html = lesson.content;

    // First: fix missing language class on existing code blocks
    html = fixCodeBlockClass(html);

    // Then: move orphaned code lines into code blocks
    const { html: fixedHtml, movedLines } = fixOrphanedCodeLines(html);

    if (fixedHtml !== lesson.content || movedLines > 0) {
      await prisma.interactiveLesson.update({
        where: { id: lesson.id },
        data: { content: fixedHtml },
      });

      totalFixed++;
      totalMovedLines += movedLines;
      console.log(`  [FIXED] ${lesson.title} — ${movedLines} code line(s) moved`);
    } else {
      console.log(`  [OK]    ${lesson.title}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Lessons fixed : ${totalFixed}`);
  console.log(`Code lines moved: ${totalMovedLines}`);
  console.log("Done!\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
