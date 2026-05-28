> Phase 3 設計。未実装。

```
[Client A] --WS--> [CF Durable Object] <--WS-- [Client B]
                   1試合=1インスタンス
                   入力中継(Lockstep)
                   tick番号同期
                   観戦者broadcast
```

プロトコル:
1. client送信: `{ type: "input", tick: N, cmds: [...] }`
2. server: 全プレイヤーのtick N入力を収集→broadcast
3. server送信: `{ type: "frame", tick: N+2, inputs: { p0:[...], p1:[...] } }`
   - 2tick入力遅延でジッタ吸収
4. client: 受信frameをInputFrameとしてtick(N+2)で適用
