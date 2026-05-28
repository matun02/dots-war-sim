> truth source: `apps/web/src/game/render/frontline.ts`

- `infl[A] - infl[B]`の0等高線
- マーチングスクエア法(16ケーステーブル+線形補間)
- PixiJS Graphics: 白, 2px, alpha 0.3
- 前線=両軍の境界線(ユニットを囲むリングではない)
- 5tickごと更新(影響マップと同期)
- z-order: 地形 > 都市 > 前線 > ユニット
