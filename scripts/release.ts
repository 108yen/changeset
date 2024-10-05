/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import { findPackages } from "find-packages";
import { getChangelogEntry } from "./utils";
import { GitHub, getOctokitOptions } from "@actions/github/lib/utils";
import { throttling } from "@octokit/plugin-throttling";
import * as github from "@actions/github";

const setupOctokit = (githubToken: string) => {
  return new (GitHub.plugin(throttling))(
    getOctokitOptions(githubToken, {
      throttle: {
        onRateLimit: (retryAfter, options: any, octokit, retryCount) => {
          console.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          );

          if (retryCount <= 2) {
            console.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onSecondaryRateLimit: (
          retryAfter,
          options: any,
          octokit,
          retryCount
        ) => {
          console.warn(
            `SecondaryRateLimit detected for request ${options.method} ${options.url}`
          );

          if (retryCount <= 2) {
            console.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
      },
    })
  );
};

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
      target_commitish: "release",
      ...github.context.repo,
    });
  } catch {
    console.error("Unexpected error, something wrong.");
  }
}

main();
