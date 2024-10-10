/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import { findPackages } from "find-packages";
import { getChangelogEntry, setupOctokit } from "./utils";
import * as github from "@actions/github";

async function main() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      console.error("Please add the GITHUB_TOKEN to the changesets action");
      return;
    }

    const octokit = setupOctokit(githubToken);

    const packages = await findPackages("./");
    const { version, name } = packages[0].manifest;

    if (!version || !name) {
      console.error("Version or name is undefined.");
      return;
    }

    const changelog = fs.readFileSync("CHANGELOG.md", "utf-8");

    const tagName = `${name}@${version}`;
    const { content } = getChangelogEntry(changelog, version);

    await octokit.rest.repos.createRelease({
      name: tagName,
      tag_name: tagName,
      body: content,
      // target_commitish: "release",
      ...github.context.repo,
    });
  } catch {
    console.error("Unexpected error, something wrong.");
  }
}

main();
