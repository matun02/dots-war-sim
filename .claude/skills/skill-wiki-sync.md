# Wiki 差分同期スキル

タスク完了時に、コード変更に応じて wiki を同期更新するスキル。
`skill-task-completion.md` Step 2d から呼び出される。

共通ルール（マッピングテーブル・優先度・注意事項）は `wiki/conventions/wiki-maintenance.md` を参照。

---

## 1. 影響範囲を特定する

```bash
git diff --name-only HEAD~1
```

変更ファイルを `wiki/conventions/wiki-maintenance.md` のマッピングテーブルと照合し、影響する wiki ページを特定する。

影響する wiki がない → 完了。

---

## 2. 対象ページを Read して比較

各対象ページについて:
1. 冒頭の `> truth source: ...` のパスが正しいか確認
2. ページ内の定数値・処理フロー記述を、コードの現在値と比較
3. 差異があれば修正候補をリストアップ

---

## 3. 更新を適用

- 定数値変更 → 新しい値に書き換え（単位・tick換算も更新）
- ステップ順変更 → 番号振り直し + 責務テーブル更新
- 新機能追加 → 該当ページに追記。ページ新規作成時は index.md にも追加
- 機能削除 → 該当記述を削除。ページが空になったら削除 + index.md 更新

---

## 4. 検証

- [ ] 更新した全数値がコード上の値と一致
- [ ] 全 `> truth source` パスが実在する
- [ ] index.md にリンク切れがない

---

## 5. 判断に迷う場合

`wiki/conventions/wiki-maintenance.md` の「Truth source 優先度」セクションに従う。
