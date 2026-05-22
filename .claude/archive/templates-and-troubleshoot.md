# 付録: テンプレート & トラブルシュート

> TASKS.md から分離した付録。タスク投入・PR 作成・トラブルシュート時に参照。

---

## 付録 A: タスク投入時のテンプレ

```text
@CLAUDE.md @DESIGN.md @TASKS.md を読みました。

これから {TASK_ID}: {TITLE} を実装します。

[TASKS.md の該当セクションをそのまま貼る]

着手前に:
1. 変更予定ファイル一覧
2. テスト計画
3. 想定される影響範囲

を提示してください。承認したら実装に進んでください。
```

---

## 付録 B: PR 提出時のテンプレ

```md
## TASK
{TASK_ID}: {TITLE}

## 何をするPRか


## なぜ必要か


## 動作確認
- [ ] pnpm typecheck
- [ ] pnpm test
- [ ] 手動: ...

## 影響範囲


## スクショ / 動画


## DoD
- [ ] TASKS.md の受け入れ基準を満たす
- [ ] CLAUDE.md 規約に違反していない
- [ ] core/sim を変更した場合は決定論テストを更新 or 維持
```

---

## 付録 C: トラブルシュート

| 症状 | 確認 |
|---|---|
| 決定論テストが落ちる | sim 内で Math.random / Date.now / Map iteration / Set iteration / Array.sort の不安定性が無いか |
| マルチプレイで desync | hash がいつから不一致か → 該当 tick の入力差を特定 |
| パスファインダーが重い | キャッシュ有無、heap の比較関数、再計算頻度 |
| FPS が出ない | ParticleContainer 使用、不要な clone、devtools profiler |
| バンドルが大きい | vite build --report、tree shaking、code split |
