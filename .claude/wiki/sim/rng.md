> truth source: `packages/core/src/rng.ts`

- アルゴリズム: mulberry32(高品質・短実装・整数演算)
- API: `Rng(seed)`, `next(): [0,1)`, `int(max)`, `state()`, `Rng.restore(s)`
- ★MUST: sim内乱数は必ずRng経由
- ★MUST NOT: `Math.random()`使用
- AI用RngはsimのRngと別インスタンス(AI思考はsim外)
