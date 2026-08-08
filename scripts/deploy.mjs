import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { rename, rm } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const appName = "japanese-drama-memory";
const activeBuild = path.join(projectRoot, ".next");
const candidateBuild = path.join(projectRoot, ".next-deploy");
const previousBuild = path.join(projectRoot, ".next-previous");

function run(command, args, env = process.env) {
  execFileSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
}

function hasPm2App() {
  try {
    execFileSync("pm2", ["describe", appName], { cwd: projectRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const wasRunning = hasPm2App();

await rm(candidateBuild, { recursive: true, force: true });
run("pnpm", ["run", "build"], {
  ...process.env,
  NEXT_DIST_DIR: ".next-deploy",
});

let movedActiveBuild = false;
try {
  if (wasRunning) run("pm2", ["stop", appName]);
  await rm(previousBuild, { recursive: true, force: true });
  if (existsSync(activeBuild)) {
    await rename(activeBuild, previousBuild);
    movedActiveBuild = true;
  }
  await rename(candidateBuild, activeBuild);

  if (wasRunning) {
    run("pm2", ["restart", appName]);
  } else {
    run("pm2", ["start", "ecosystem.config.cjs", "--only", appName]);
  }

  await rm(previousBuild, { recursive: true, force: true });
} catch (error) {
  if (movedActiveBuild && existsSync(previousBuild)) {
    await rm(activeBuild, { recursive: true, force: true });
    await rename(previousBuild, activeBuild);
    try {
      if (wasRunning) run("pm2", ["restart", appName]);
    } catch {}
  }
  throw error;
}
