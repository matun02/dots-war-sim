> truth source: `packages/core/src/sim/steps/resolve-combat.ts`

- 各ユニットはattackRange内の最寄り敵を選択
- tie-break: EntityId昇順(全順序)
- attackIntervalTicksごとに1攻撃(attack値でHP減少)
- HP<=0で消滅、所属都市のsupplyUsed -= supplyCost
