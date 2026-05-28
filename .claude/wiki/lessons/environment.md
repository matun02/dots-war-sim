> 完了タスクから抽出した教訓。

- corepackはWindows権限問題あり→`npm install -g pnpm`推奨
- PowerShell実行ポリシー設定(RemoteSigned)必須
- `vitest --passWithNoTests`必須(テスト0件パッケージ)
- esbuildは`-2 ** 31`パース不可→`-(2 ** 31)`に括弧
- `@vitest/coverage-v8`はvitestと同バージョン指定
- jsdomはdevDependencyに追加
- Cloudflare Pages: `--branch=main`でデプロイしないと本番URL未反映
- manualChunksでPixiJS分離→メインチャンク289KB→60KB
