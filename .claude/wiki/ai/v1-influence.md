> truth source: `apps/web/src/game/ai/controller.ts`

- 影響マップ(5tickキャッシュ)で前線を4セクターに分割
- 押し込まれたセクター(enemyPressure高)にユニット投入
- 都市数比率<0.4→経済拡張(弱い敵都市優先)
- 前線安定+都市3以上→heavy生産切替(set-productionコマンド)
- v0の防衛ロジック(脅威都市への呼び戻し)は維持
