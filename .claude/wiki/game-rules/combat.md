> truth source: `packages/core/src/sim/steps/resolve-combat.ts`

- 各ユニットはattackRange内の最寄り敵を選択
- tie-break: EntityId昇順(全順序)
- attackIntervalTicksごとに1攻撃。ダメージ = `floor(attack × 地形攻撃% / 100)`（round-half-up・整数）
  - 攻撃%は**攻撃側の足元地形**で決まる（`TERRAIN_ATTACK_PCT`: heavy は森/水で×0.75、light は水で×0.75、その他×1）
- HP<=0で消滅、所属都市のsupplyUsed -= supplyCost
- ※ HP・attack は決定論のため ×100 スケール（小数倍率を整数で扱う）
