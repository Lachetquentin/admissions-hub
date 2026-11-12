// PostToolUse hook: run the project's tests after every edit.
// Silent when there is nothing to run; exit 2 feeds failures back to Claude.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pkgPath = join(root, "package.json");
if (!existsSync(pkgPath)) process.exit(0);

const test = JSON.parse(readFileSync(pkgPath, "utf8")).scripts?.test;
if (!test || /no test specified/.test(test)) process.exit(0);

const run = spawnSync("npm", ["test", "--silent"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
  env: { ...process.env, CI: "true" },
});
if (run.status === 0) process.exit(0);

const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
process.stderr.write(`npm test failed (exit ${run.status}):\n${output.slice(-3000)}\n`);
process.exit(2);
