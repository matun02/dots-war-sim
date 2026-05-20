# ドキュメント更新 commit & push スキル

`.claude/TASKS.md` や `.claude/CLAUDE.md` の更新を commit して push するスキルです。
ドキュメントファイルの編集が完了した後に呼び出してください。

---

## 手順

### 1. 対象ファイルを確認する

`git status` で変更されたドキュメントファイルを確認する。
対象は `.claude/` 配下のドキュメントファイルのみ:

- `.claude/TASKS.md`
- `.claude/CLAUDE.md`
- その他 `.claude/` 配下の `.md` ファイル（SETUP.md、DESIGN.md など）

ドキュメント以外の変更（ソースコード、設定ファイル）が混在している場合は、ドキュメントだけを個別にステージングする。

### 2. ステージングする

変更されたドキュメントファイルだけを `git add` する:

```bash
git add .claude/TASKS.md .claude/CLAUDE.md
```

他の `.claude/*.md` ファイルも変更されていれば一緒に追加してよい。

### 3. コミットメッセージを作成する

フォーマット:

```
docs(claude): update project docs for {TASK_ID} completion
```

**例:**
```
docs(claude): update project docs for P1-T5 completion
```

複数タスクを一度に更新した場合:
```
docs(claude): update project docs for P1-T5, P1-T6 completion
```

タスク完了以外の更新（誤字修正、構成変更など）:
```
docs(claude): fix typo in TASKS.md P1-T3 section
docs(claude): add setup instructions for Windows ARM
```

### 4. コミットする

```bash
git commit -m "$(cat <<'EOF'
docs(claude): update project docs for {TASK_ID} completion

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Co-Authored-By はプロジェクトの慣習に合わせる。不要であれば省略してよい。

### 5. プッシュする

```bash
git push
```

push 前に、リモートとの差分がないか確認する。
conflict がある場合は push せずユーザーに報告する。

---

## 注意事項

- ソースコードの変更と混ぜない。ドキュメント更新は独立したコミットにする
- 実装コミットの直後にドキュメントコミットを作る流れが標準
- force push は絶対にしない
- ブランチ名の指定がある場合はそれに従う（デフォルトは現在のブランチ）
