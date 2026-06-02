> truth source: `packages/core/src/sim/constants.ts` UNIT_STATS

| 属性 | Light | Heavy |
|---|---|---|
| 速度(セル/秒) | 2 | 1 |
| 攻撃力 | 100 | 300 |
| HP | 1500 | 7500 |
| 攻撃間隔 | 0.5s (15tick) | 1.0s (30tick) |
| 通行可能地形 | 山以外（平地・森・水・都市） | 山以外（平地・森・水・都市） |
| 補給コスト | 1 | 2 |
| 生産時間 | 2秒 (60tick) | 6秒 (180tick) |
| 視認半径(将来FoW) | 3 | 4 |

※ **HP・攻撃力は ×100 スケール**（決定論のため。地形攻撃倍率 ×0.75 等を整数で扱う）。補給コスト・各 tick 値は非スケール。

## 地形ルール（通行・移動コスト・移動速度・攻撃倍率）

> 出典: 移動コスト=`pathfinding/astar.ts`、移動速度=`sim/constants.ts` `TERRAIN_SPEED_PCT`＋`sim/steps/move-units.ts`、攻撃倍率=`sim/constants.ts` `TERRAIN_ATTACK_PCT`＋`sim/steps/resolve-combat.ts`、地形値=`sim/types.ts` `TERRAIN_INDEX`。詳細は `pathfinding/astar.md`。

- **通行可否**: **mountain のみ全ユニット通行不可（壁）**。平地・森・水・都市は light/heavy とも通行可。
- 一覧（`不可`=通行不能。速度%・攻撃%は**そのユニットが乗っている地形**で判定）:

| 地形 | 値 | light移動 | heavy移動 | light速度% | heavy速度% | light攻撃% | heavy攻撃% |
|---|---|---|---|---|---|---|---|
| plain | 0 | 1 | 1 | 100 | 100 | 100 | 100 |
| mountain | 1 | 不可 | 不可 | — | — | — | — |
| forest | 2 | 1 | 2 | 100 | 75 | 100 | 75 |
| water | 3 | 2 | 2 | 50 | 50 | 75 | 75 |

  - 都市マス: 地形ではなく別オブジェクト（地形値 plain=0）。移動1/1・速度100/100・攻撃100/100。
- **移動コスト**: A* の **経路選択** 用（heavy は森=2 で避けがち）。実移動の速さには直接効かない。
- **移動速度%**: 実移動速度 = `base速度 × (速度%/100)`。乗っているタイルの地形で補正（交戦減速とは**乗算で併用**）。water は light も 50% 減速。
- **攻撃倍率%**: ダメージ = `floor(attack × % / 100)`（round-half-up・整数）。**攻撃側ユニットが乗る地形**で決まる（heavy は森/水で×0.75、light は水で×0.75）。
- **地形値エンコード**: `terrain[y * width + x]` に `0=plain / 1=mountain / 2=forest / 3=water` を格納。
