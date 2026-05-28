> truth source: `packages/core/src/sim/tick.ts`, `steps/*.ts`

処理順序:
1. `applyInputs` — InputFrame→Unit.goal更新
2. `recomputePaths` — A*再計算(goal変更時のみ, 1tick最大8件)
3. `moveUnits` — path追従移動
4. `resolveCombat` — 最寄り敵にダメージ
5. `removeDead` — HP<=0除去+補給枠解放
6. `separateUnits` — SpatialHash衝突分離(SEPARATION_DIST=0.6)
7. `updateCityCapture` — 都市占領進行
8. `produceUnits` — 都市生産
9. `evaluateGameEnd` — 勝敗判定

| ステップ | 入力 | 出力(state変更) |
|---|---|---|
| applyInputs | inputs | Unit.goal, selection |
| recomputePaths | Unit.goal | Unit.path |
| moveUnits | Unit.path, pos, kind | Unit.pos |
| resolveCombat | units, attackCooldown | unit.hp, attackCooldown |
| removeDead | units | units(filter)+City.supplyUsed |
| separateUnits | units | Unit.pos(分離) |
| cityCapture | units都市マス滞在 | City.captureProgress, owner |
| produceUnits | cities, players | units(追加) |
| evaluateGameEnd | players, cities, tick | state.result |
