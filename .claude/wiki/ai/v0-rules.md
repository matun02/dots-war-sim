> truth source: `apps/web/src/game/ai/controller.ts`

```
各AIティックで:
1. 自陣営ユニットを「待機」「移動中」に分類
2. 占領可能都市リスト生成(弱い敵都市)
3. 価値 = (1/距離) * 重み − 守備の弱さ で並べ替え
4. 上位ターゲットへ未割当ユニットを派遣
5. 自都市が脅威下 → 近隣ユニット呼び戻し
```

★MUST NOT: AI に Math.random を使わない(Rng経由)
★MUST NOT: AI が sim の private state を書き換えない(Command経由のみ)
