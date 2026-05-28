> truth source: `packages/core/src/sim/steps/update-city-capture.ts`

- 直接フリップ方式（中間null状態なし）
- 都市マスに敵ユニットのみ→captureProgress加算
- CAPTURE_TICKS=90到達→即owner変更
- 味方ユニット存在or敵ユニット不在→progress 0リセット
