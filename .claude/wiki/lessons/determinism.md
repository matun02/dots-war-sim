> 完了タスクから抽出した教訓。

- boxブラー+Math.floor→エネルギー損失(整数truncation毎反復0.5/セル)。解決: 円形フォールオフで直接形状生成
- Array.sort tie-break: 必ずEntityId昇順で全順序
- AI Rngはsim Rngと別インスタンス(AI思考はsim外)
- 整数コスト演算で非決定論回避(浮動小数の順序依存集計を避ける)
- Int16Arrayは代入時に自動整数切り捨て。`Math.floor`も明示
- 拡散ループ: `new Int16Array(next)`でコピーし参照切断
- `for...in`禁止→`for...of` or インデックスfor
