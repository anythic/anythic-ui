// Tags and creates a GitHub release for the published @anythic/ui version,
// if either is missing. changesets/action would do this, but it detects
// published packages from Changesets 2's publish output and misses
// Changesets 3's, so the release workflow runs this after it. Safe to run
// any number of times: it only creates what does not exist yet.
//
// Needs GH_TOKEN for the gh CLI and the full git history (fetch-depth: 0).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PACKAGE_DIR = "packages/ui";

const run = (command, args) =>
  execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const succeeds = (command, args) => {
  try {
    run(command, args);
    return true;
  } catch {
    return false;
  }
};

const { name, version } = JSON.parse(readFileSync(`${PACKAGE_DIR}/package.json`, "utf8"));
const tag = `${name}@${version}`;

// Only versions that actually reached npm get a tag and a release. A tag
// that `changeset publish` just created in this checkout is proof enough;
// otherwise ask npm, which can take a little while to list a new version.
const taggedByPublish = succeeds("git", ["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`]);
if (!taggedByPublish && !(await isOnNpm(`${name}@${version}`))) {
  console.log(`${tag} is not on npm; nothing to do.`);
  process.exit(0);
}

run("git", ["fetch", "--tags", "--quiet", "origin"]);
if (!succeeds("git", ["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`])) {
  // Tag the commit that set this version, not wherever main is now.
  const commit =
    run("git", [
      "log",
      "-1",
      "--format=%H",
      `-S"version": "${version}"`,
      "--",
      `${PACKAGE_DIR}/package.json`,
    ]) || "HEAD";
  run("git", ["tag", tag, commit]);
  console.log(`Tagged ${commit} as ${tag}.`);
}
if (!succeeds("git", ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tag}`])) {
  run("git", ["push", "origin", `refs/tags/${tag}`]);
  console.log(`Pushed ${tag}.`);
}

if (succeeds("gh", ["release", "view", tag])) {
  console.log(`Release ${tag} already exists.`);
  process.exit(0);
}
run("gh", [
  "release",
  "create",
  tag,
  "--verify-tag",
  "--title",
  tag,
  "--notes",
  changelogSection(version),
]);
console.log(`Created release ${tag}.`);

/** Whether npm lists the version, retrying for about two minutes. */
async function isOnNpm(spec) {
  for (const delay of [0, 5, 10, 20, 30, 60]) {
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    if (succeeds("npm", ["view", spec, "version"])) return true;
  }
  return false;
}

/** The body of `## <version>` in the package's CHANGELOG. */
function changelogSection(target) {
  const heading = `## ${target}\n`;
  const text = readFileSync(`${PACKAGE_DIR}/CHANGELOG.md`, "utf8");
  const start = text.indexOf(heading);
  if (start === -1) return `See ${PACKAGE_DIR}/CHANGELOG.md.`;
  const rest = text.slice(start + heading.length);
  const end = rest.search(/^## /m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}
