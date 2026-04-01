/**
 * Fix Python code block indentation in the python-archeologi course.
 *
 * Reads all lessons, finds <pre><code class="language-python"> blocks,
 * checks for syntax errors, and fixes them using fix_indent.py.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/fix-indentation.mjs
 */

import pg from "pg";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.cygykmizdjusppwlpwwv:bybbeh-8dawqu-racTaj@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString: DATABASE_URL });

const COURSE_ID = "cmnfw98yd00001wfcz3bzmai0"; // python-archeologi
const FIX_SCRIPT = new URL("./fix_indent.py", import.meta.url).pathname;

function decodeHtml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function encodeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

function checkSyntax(code) {
  writeFileSync("/tmp/_pycheck.py", code);
  const r = spawnSync(
    "python3",
    ["-c", "import ast; ast.parse(open('/tmp/_pycheck.py').read())"],
    { timeout: 5000, stdio: ["pipe", "pipe", "pipe"] }
  );
  return r.status === 0;
}

function fixCode(code) {
  writeFileSync("/tmp/_pyfix_in.py", code);
  const r = spawnSync("python3", [FIX_SCRIPT, "/tmp/_pyfix_in.py"], {
    timeout: 15000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const fixed = r.stdout?.toString() || code;
  const didFix = r.status === 0;
  return { fixed, didFix };
}

async function main() {
  console.log("Fetching lessons from python-archeologi course...");

  const lessons = await pool.query(`
    SELECT l.id, l.slug, l.content
    FROM "InteractiveLesson" l
    JOIN "InteractiveModule" m ON l."moduleId" = m.id
    WHERE m."courseId" = $1
    ORDER BY m."order", l."order"
  `, [COURSE_ID]);

  console.log(`Found ${lessons.rows.length} lessons.\n`);

  let totalBlocks = 0;
  let alreadyValid = 0;
  let fixedCount = 0;
  let cleanedCount = 0;
  let lessonsUpdated = 0;

  for (const row of lessons.rows) {
    const regex = /<pre><code class="language-python">([\s\S]*?)<\/code><\/pre>/g;
    let content = row.content;
    let modified = false;
    let match;
    let offset = 0;

    // Collect all blocks first
    const blocks = [];
    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        fullMatch: match[0],
        code: match[1],
        index: match.index,
      });
    }

    totalBlocks += blocks.length;

    for (const block of blocks) {
      const decoded = decodeHtml(block.code);

      if (checkSyntax(decoded)) {
        alreadyValid++;
        continue;
      }

      // Try to fix
      const { fixed, didFix } = fixCode(decoded);

      if (didFix && checkSyntax(fixed)) {
        fixedCount++;
      } else {
        // Even if not fully fixed, apply basic cleanup
        cleanedCount++;
      }

      // Always update the block (either fully fixed or at least cleaned)
      const encodedFixed = encodeHtml(fixed);
      const newBlock = `<pre><code class="language-python">${encodedFixed}</code></pre>`;

      if (newBlock !== block.fullMatch) {
        content = content.replace(block.fullMatch, newBlock);
        modified = true;
      }
    }

    if (modified) {
      await pool.query(
        `UPDATE "InteractiveLesson" SET content = $1 WHERE id = $2`,
        [content, row.id]
      );
      lessonsUpdated++;
      console.log(`  Updated: ${row.slug}`);
    }
  }

  console.log("\n=== Results ===");
  console.log(`Total Python code blocks: ${totalBlocks}`);
  console.log(`Already valid: ${alreadyValid}`);
  console.log(`Fixed (now valid): ${fixedCount}`);
  console.log(`Cleaned (still has issues): ${cleanedCount}`);
  console.log(`Lessons updated in DB: ${lessonsUpdated}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  pool.end();
  process.exit(1);
});
