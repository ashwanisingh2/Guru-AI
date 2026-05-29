import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function runJavaScript(code, input = "") {
  await writeFile("/tmp/submission.js", code);
  const started = Date.now();
  const { stdout, stderr } = await exec("node", ["/tmp/submission.js"], {
    timeout: 4000,
    maxBuffer: 1024 * 1024,
    env: { INPUT: input }
  });
  return {
    stdout,
    stderr,
    runtimeMs: Date.now() - started,
    memoryMb: 0
  };
}
