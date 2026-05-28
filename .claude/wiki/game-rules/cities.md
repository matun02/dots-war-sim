> truth source: `packages/core/src/sim/constants.ts`, `produce-units.ts`

- 静的オブジェクト（破壊不可、所有権のみ変化）
- 所有プレイヤーが`production`種別を`produceInterval`ごとに生産
- 補給枠(SUPPLY_MAX=5)満杯で生産停止
- 占領直後のクールダウンなし（直接フリップ方式）
- `City.owner`はnon-nullable (`PlayerId`)
