# Wiki 定期監査スキル

wiki 全体をソースコードと照合し、不整合を検出・報告するスキル。
「wikiを監査して」「wiki棚卸し」と指示されたときに実行。

共通ルール（マッピングテーブル・優先度・注意事項）は `wiki/conventions/wiki-maintenance.md` を参照。

---

## 1. truth source パス検証

全 wiki ページの冒頭 `> truth source: ...` を抽出し、記載パスが実在するか確認:
```bash
grep -r "truth source:" .claude/wiki/ --include="*.md"
```
存在しないパスがあれば報告。

---

## 2. 定数値スポットチェック

`constants.ts` の全定数を読み、以下の wiki ページの数値と照合:
- `game-rules/units.md` — UNIT_STATS の speed, attack, hp, intervals
- `game-rules/cities.md` — SUPPLY_MAX, POST_CAPTURE_COOLDOWN_TICKS
- `game-rules/capture.md` — CAPTURE_TICKS
- `game-rules/combat.md` — ATTACK_RANGE, ENGAGE_DISTANCE
- `game-rules/mvp-params.md` — TICK_RATE, GAME_TIME_LIMIT_TICKS
- `sim/tick-steps.md` — tick.ts のステップ順序

---

## 3. index.md リンク検証

全 index.md のリンク先ファイルが実在するか確認。
wiki/ 配下にファイルがあるのに index.md から参照されていないものがないか確認。

---

## 4. 不整合レポート

発見した不整合を以下の形式でユーザーに報告:
```
| # | wiki | 現在値 | コード値 | 推奨 |
|---|------|--------|----------|------|
| 1 | cities.md L6 | クールダウン100tick | 150tick | コード正→wiki修正 |
```

ユーザーの承認後に一括修正。
