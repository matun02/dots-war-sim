> truth source: `packages/core/src/sim/constants.ts`

| 項目 | 値 |
|---|---|
| プレイヤー数 | 2 (Self vs AI) |
| マップサイズ | 64×36 セル |
| Tick rate | 30 Hz |
| 都市数 | 5〜8 |
| ユニット種別 | light + heavy |
| 補給上限 | 1都市あたり5ユニット |
| 試合制限 | 20分 (36000 tick) |
| 初期ユニット | 各プレイヤー10体（既定 light。spawn の `kind` で light/heavy を指定可。heavy は平地のみ配置可） |
