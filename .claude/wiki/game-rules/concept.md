> truth source: コード。食い違いはユーザーに確認。

- ジャンル: ミニマル RTS
- 視点: 2D トップダウン
- 操作: マウス(PC優先)、タッチ(モバイル)
- 目標セッション: 5〜10分。制限: 20分(36000 tick)
- 勝利条件: 都市の80%以上を支配(domination) or 全滅(annihilation)。判定は整数演算 `owned*5>=total*4`（`evaluate-game-end.ts`）。総都市数に応じてスケール（6都市→5、8都市→7 必要）
