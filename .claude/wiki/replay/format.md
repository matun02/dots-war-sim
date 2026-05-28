> truth source: `packages/core/src/replay.ts`

```ts
interface Replay {
  version: number;
  seed: number;
  mapId: string;
  players: { id: PlayerId; name: string; type: "human" | "ai" }[];
  inputs: InputFrame[];
  finalTick: number;
  result: GameResult;
  createdAt: number; // wall clock(sim外)
}
```
