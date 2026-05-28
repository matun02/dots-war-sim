> truth source: `packages/core/src/sim/hash.ts`

- 再生: 同seed・同マップ・同inputsをtickで流す
- フレーム末で`hashState(state)`チェック(desync検知)
- ハッシュ: tick, units(pos×10, hp, owner), cities(owner, supplyUsed)を整数化→32bit xorフォールド
- idソート済みで計算(決定論)
