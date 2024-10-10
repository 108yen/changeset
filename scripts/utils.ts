/* eslint-disable @typescript-eslint/no-explicit-any */
import remarkParse from "remark-parse";
import { unified } from "unified";
import { toString } from "mdast-util-to-string";
import remarkStringify from "remark-stringify";
import { GitHub, getOctokitOptions } from "@actions/github/lib/utils";
import { throttling } from "@octokit/plugin-throttling";

export const BumpLevels = {
  dep: 0,
  patch: 1,
  minor: 2,
  major: 3,
} as const;

export function getChangelogEntry(changelog: string, version: string) {
  const ast = unified().use(remarkParse).parse(changelog);

  let highestLevel: number = BumpLevels.dep;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodes = ast.children as Array<any>;
  let headingStartInfo:
    | {
        index: number;
        depth: number;
      }
    | undefined;
  let endIndex: number | undefined;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading") {
      const stringified: string = toString(node);
      const match = stringified.toLowerCase().match(/(major|minor|patch)/);
      if (match !== null) {
        const level = BumpLevels[match[0] as "major" | "minor" | "patch"];
        highestLevel = Math.max(level, highestLevel);
      }
      if (headingStartInfo === undefined && stringified === version) {
        headingStartInfo = {
          index: i,
          depth: node.depth,
        };
        continue;
      }
      if (
        endIndex === undefined &&
        headingStartInfo !== undefined &&
        headingStartInfo.depth === node.depth
      ) {
        endIndex = i;
        break;
      }
    }
  }
  if (headingStartInfo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ast.children = (ast.children as any).slice(
      headingStartInfo.index + 1,
      endIndex
    );
  }
  return {
    content: unified().use(remarkStringify).stringify(ast),
    highestLevel: highestLevel,
  };
}

export function setupOctokit(githubToken:string) {
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
}