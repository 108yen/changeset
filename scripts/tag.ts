import { findPackages } from "find-packages";
import { exec } from "@actions/exec";
import semver from "semver";
import * as core from "@actions/core";

async function main() {
  const packages = await findPackages("./");
  const { version } = packages[0].manifest;

  if (!version) {
    core.warning("Version is undefined.");
    return;
  }

  core.info(`Detected version: ${version}`);

  const tag = `v${version}`;
  const major = `v${semver.major(version)}`;
  const minor = `v${semver.major(version)}.${semver.minor(version)}`;

  // const { exitCode, stderr } = await getExecOutput(
  //   `git`,
  //   ["ls-remote", "--exit-code", "origin", "--tags", `refs/tags/${tag}`],
  //   {
  //     ignoreReturnCode: true,
  //   }
  // );

  // if (exitCode === 0) {
  //   core.setFailed(
  //     `Action is not being published because version ${tag} is already published`
  //   );
  //   return;
  // }

  // if (exitCode !== 2) {
  //   core.setFailed(`git ls-remote exited with ${exitCode}:\n${stderr}`);
  //   return;
  // }

  core.info("Detaching branch....");
  await exec("git", ["checkout", "--detach"]);
  //MEMO: `git add --force` add all files with ignore .gitignore
  //so I need to stage force only dist/ directory.
  await exec("git", ["add", "--force", "build"]);
  await exec("git", ["commit", "-m", tag, "--quiet"]);

  core.info("Creating tags...");
  await exec("git", ["tag", tag]);
  await exec("git", ["tag", minor]);
  await exec("git", ["tag", major]);

  core.info(`Push to ${major}.`);
  await exec("git", [
    "push",
    "--force",
    "--follow-tags",
    "origin",
    `HEAD:refs/heads/${major}`,
  ]);

  await exec("git", ["push", "--force", "origin", major]);
  await exec("git", ["push", "--force", "origin", minor]);
  await exec("git", ["push", "--force", "origin", tag]);

  //TODO: checkout release branch or no branch
  //TODO: commit changes
  //TODO: check existing tags
  //TODO: update tag or create tag
}

main();
