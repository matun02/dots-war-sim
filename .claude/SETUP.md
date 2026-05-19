# SETUP.md — 開発環境セットアップ

> 本書は **新しい開発端末で本プロジェクトを動かすための実録手順** を記す。
> 想定: Windows 10/11、PowerShell 5.1+。macOS/Linux は補足あり。

---

## 1. 必要ツール

| ツール | バージョン | 役割 |
|---|---|---|
| Node.js | 22 以上 (現状 24.x も動作確認済) | ランタイム |
| pnpm | 9.15.0 | パッケージマネージャ |
| Git | 2.45+ | バージョン管理 |

`engines.node = ">=22"` を `package.json` で強制している。
`packageManager: "pnpm@9.15.0"` で pnpm バージョンも固定。

---

## 2. Windows での初回セットアップ手順（実録）

### 2.1 Node.js LTS のインストール

```powershell
winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
```

- 管理者権限不要
- インストール先は `C:\Program Files\nodejs\`
- 完了後、新しい PowerShell セッションを開くか、現セッションで以下を実行して PATH を更新：

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
```

### 2.2 PowerShell 実行ポリシーの変更（重要）

`npm.ps1` / `pnpm.ps1` 等のスクリプトを実行できるようにする。
**`CurrentUser` スコープなので管理者権限は不要。**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

> ⚠ これを行わないと `npm : File ... cannot be loaded because running scripts is disabled` で全コマンドが失敗する。

### 2.3 pnpm のインストール

**corepack ではなく `npm install -g` を使う**（後述のトラブル参照）。

```powershell
npm install -g pnpm@9.15.0
```

pnpm が `C:\Users\<user>\AppData\Roaming\npm\` に入る。

### 2.4 動作確認

```powershell
node --version    # v22 or v24
npm --version     # 10+
pnpm --version    # 9.15.0
```

### 2.5 リポジトリのクローン & 依存インストール

```powershell
git clone <repo>
cd war-of-dots
git config core.autocrlf false   # 既に設定済みのリポジトリならスキップ可
git config core.eol lf
pnpm install
```

### 2.6 動作起動

```powershell
pnpm dev                                 # ルートから (= apps/web の dev)
# または明示的に：
pnpm --filter @war-of-dots/web dev
```

`http://localhost:5173` を開いて "Hello War of Dots" が表示されれば成功。

---

## 3. ハマりどころと対処

### 3.1 corepack でエラー: `EPERM: operation not permitted, open 'C:\Program Files\nodejs\pnpm'`

**原因**: corepack は `C:\Program Files\nodejs\` に書き込もうとするが、ユーザー権限では書けない。

**対処**: corepack は使わず、`npm install -g pnpm@9.15.0` で入れる。

(macOS/Linux の Homebrew / nvm 系では corepack が正常に動くので、その場合はそちらを推奨)

### 3.2 PowerShell でスクリプト実行が拒否される

```
File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

**対処**: §2.2 の `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3.3 `pnpm test` で `apps/web` が "No test files found" → exit 1

**原因**: Vitest はテストファイルが 1 つも無いと exit code 1 で終了する。`apps/web` は P1-T1 時点でテスト 0 件。

**対処**: `apps/web/package.json` の test スクリプトに `--passWithNoTests` を付ける（既に対応済）：

```json
"test": "vitest run --passWithNoTests"
```

`packages/core` 側は実テストがあるのでフラグ不要。

### 3.4 winget が無い（古い Windows 10）

PowerShell で:

```powershell
# winget をインストール（Microsoft Store の "App Installer" を更新）
# または Node.js MSI を手動ダウンロード:
# https://nodejs.org/dist/v22.x/node-v22.x-x64.msi
```

### 3.5 改行コードの自動変換で diff が壊れる

`.gitattributes` で `* text=auto eol=lf` を設定済み。Windows でも全ファイル LF で保存される。
新規追加ファイルもエディタ側で LF に設定（`.editorconfig` で強制）。

---

## 4. macOS / Linux

```bash
# Node.js (Homebrew on macOS)
brew install node@22
# or fnm
fnm install 22 && fnm use 22

# pnpm
corepack enable
corepack prepare pnpm@9.15.0 --activate

# 以降は §2.5 と同じ
git clone <repo> && cd war-of-dots && pnpm install
```

corepack は macOS/Linux では問題なく動く。

---

## 5. 実際にインストールされたバージョン一覧（参考）

P1-T1 完了時点での lockfile 確定バージョン：

| パッケージ | バージョン |
|---|---|
| node | 24.15.0 (winget LTS) |
| pnpm | 9.15.0 |
| typescript | 5.9.3 |
| svelte | 5.16+ |
| @sveltejs/vite-plugin-svelte | 5.0.3 |
| vite | 6.0.5+ |
| vitest | 2.1.9 |
| eslint | 9.39.4 |
| prettier | 3.8.3 |
| svelte-check | 4.1.1 |
| typescript-eslint | 8.59.4 |

最新値は `pnpm-lock.yaml` を参照。

---

## 6. CI 環境

`.github/workflows/ci.yml` は以下を使用：
- Node.js: 22 (LTS)
- pnpm: 9.15.0
- runner: `ubuntu-latest`

ローカルが Node 24 でも、CI は Node 22 で検証されるので互換性に注意。

---

## 7. 補足: 推奨エディタ設定

VS Code を使う場合の推奨拡張機能（任意）：
- Svelte for VS Code (`svelte.svelte-vscode`)
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- EditorConfig (`editorconfig.editorconfig`)

`.vscode/settings.json` は **コミットしない**（個人設定のため `.gitignore` に登録済）。

---

## 8. 変更履歴

| 日付 | 変更 |
|---|---|
| 2026-05-19 | 初版（P1-T1 完了時の実録ベース） |
