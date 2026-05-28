> 完了タスクから抽出した教訓。

- 型駆動マイグレーション: City.owner型変更→全パッケージ波及。コンパイラが修正箇所を全て指摘
- SpatialHash pair dedup: `pairKey = min*100000 + max`でO(1)
- 隊形配置: 直交ベクトル`(-dirY, dirX)`で隊列方向自動判定。Rng不要の純幾何計算
- 2段階占領→直接フリップ化: コード量大幅削減(43行→25行)
- 選択状態: InputCollector内に保持で十分
- idb-keyval: createStoreでDB名とストア名を分離指定
- Rng: resetメソッドなし→seekToでは新インスタンス生成
- ウェブテスト: `globalThis`にデバッグフック→JS状態検証が最確実
- `?debug=1`デバッグモード常設推奨
