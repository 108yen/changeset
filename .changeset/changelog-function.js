/** @type {import('@changesets/types').GetReleaseLine} */
async function getReleaseLine(changesets, type, options) {
  if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["./changelog-function.js", { "repo": "org/repo" }]'
      );
  }

  const { commit, summary } = changesets

  const commitLink = `https://github.com/${options.repo}/commit/${commit}`
  const changelog = `- [\`${commit.substring(0,7)}\`](${commitLink}): ${summary}`

  return changelog
}

/** @type {import('@changesets/types').GetDependencyReleaseLine} */
async function getDependencyReleaseLine(changesets, dependenciesUpdated,options) {
    if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["./changelog-function.js", { "repo": "org/repo" }]'
      );
    }
    if (dependenciesUpdated.length === 0) return "";

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            const { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit,
            });
            return links.commit;
          }
        })
      )
    )
      .filter((_) => _)
      .join(", ")}]:`;

    const updatedDepenenciesList = dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
    );

    return [changesetLink, ...updatedDepenenciesList].join("\n");
}

/** @type {import('@changesets/types').changelogFunctions} */
const changelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine
}

module.exports = changelogFunctions
