このリポジトリは`changeset`とGithub Actionsの動作確認のためのリポジトリです。

## Github Actions

- version
- release
- test

### version

`version`ワークフローは`dev`ブランチにプッシュされた際に動作します。
`changesets/action@v1`を使用し、`changeset`が発行されていれば、新しいバージョンをリリースするためのコミットが含まれる`changeset-release/dev`ブランチを作成します。
リリースのコミットは`ci(changesets): update version`として作成されます。

### release

`release`ワークフローは`changeset-release/**`ブランチを`dev`ブランチにマージした際に動作します。
`dev`ブランチの変更を`main`ブランチにマージし、`main`ブランチでリリースを作成します。
リリースが作成されると、Github上の[Releases](https://github.com/108yen/changeset/releases)で確認できます。

> [!WARNING]
> `main`ブランチでのマージでコンフリクトが発生する可能性があるため、`dev`ブランチへのフォースプッシュは慎重に行う必要があります。

### test

`dev`ブランチへプッシュされた際に動作するテスト用のワークフローです。

