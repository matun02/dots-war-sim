# DESIGN.md — War of Dots クローン 設計書

> 本書はゲーム本体・アーキテクチャ・データ構造・主要アルゴリズムの設計を定める。
> 上位文書: `CLAUDE.md`（規約） / 下位文書: `TASKS.md`（実装手順）

---

## 1. ゲーム設計

### 1.1 ゲームコンセプト
- ジャンル: ミニマル RTS
- 視点: 2D トップダウン
- 操作: マウス（PC優先）、タッチ対応（モバイル）
- セッション時間: 5〜10 分
- 勝利条件: 敵都市を全て占領 or 敵ユニット全滅

### 1.2 中核ゲームループ

```
[都市が時間経過でユニットを生産]
    ↓
[プレイヤーがユニットを選択]
    ↓
[移動命令（クリック）or 編成命令（ドラッグライン）]
    ↓
[ユニットが A* で目的地へ移動]
    ↓
[敵接触で戦闘 → 前線が動的に変動]
    ↓
[空き / 弱体な都市を占領]
    ↓
[ループ：勝利 / 敗北 / 継続]
```

### 1.3 ゲームルール（MVP）

| 項目 | 値 |
|---|---|
| プレイヤー数 | 2 (Self vs AI) |
| マップサイズ | 64 × 36 セル |
| Tick rate | 30 Hz |
| 都市数 | 5〜8 |
| ユニット種別 | light のみ |
| 補給上限 | 1都市あたり 5 ユニット |
| 試合制限時間 | 20 分（超過時は都市数比較） |

### 1.4 ユニット仕様

| 属性 | Light | Heavy（Phase2） |
|---|---|---|
| 速度（セル/秒） | 4 | 2 |
| 攻撃力 | 1 | 3 |
| HP | 1 | 5 |
| 攻撃間隔 | 0.5s | 1.0s |
| 通行可能地形 | 全地形 | 平地・都市のみ |
| 補給スロット消費 | 1 | 2 |
| 生産時間 | 2 秒 | 6 秒 |
| 視認半径（将来FoW用） | 3 | 4 |

### 1.5 都市仕様
- 静的オブジェクト（破壊不可、所有権のみが変わる）
- 所有プレイヤーが `production` 種別を `produceInterval` ごとに生産
- 補給枠（5）が埋まると生産停止
- 占領直後 5 秒間は生産クールダウン

### 1.6 占領ルール
- 都市マスに **敵ユニットのみが** 居る状態が **2 秒継続** → 中立化
- 中立化後、**いずれかの陣営のユニットが 1 秒滞在** → その陣営の所有に
- 都市マス内ではユニットも通常通り戦闘する

### 1.7 戦闘解決
- 各ユニットは攻撃範囲 `attackRange` 内の最寄りの敵を選ぶ
- `attackInterval` ごとに 1 攻撃（`attack` 値で HP を減らす）
- HP 0 で消滅、所属都市の補給枠も即 1 解放
- 同マスに混在しても問題ない（位置で連続戦闘）

---

## 2. アーキテクチャ概要

### 2.1 レイヤー図

```
┌────────────────────────────────────────────────────────┐
│                    UI (Svelte 5)                       │
│   メニュー / HUD / ポーズ / 結果画面 / 設定             │
└──────────────────────┬─────────────────────────────────┘
                       │ (props / store)
┌──────────────────────▼─────────────────────────────────┐
│                  Game Loop（loop.ts）                  │
│   30Hz tick + RAF render + 入力バッファ                 │
└─────┬──────────────┬───────────┬─────────────┬────────┘
      │              │           │             │
      ▼              ▼           ▼             ▼
┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│  Input   │  │  Render  │  │   AI    │  │   Net    │
│ (mouse,  │  │ (PixiJS) │  │(local)  │  │  (WS、    │
│  touch)  │  │          │  │         │  │  Phase3) │
└─────┬────┘  └────▲─────┘  └────┬────┘  └────┬─────┘
      │            │             │            │
      │ Commands   │ read state  │ Commands   │ Inputs
      ▼            │             ▼            ▼
┌────────────────────────────────────────────────────┐
│           packages/core/sim (純TS、決定論)         │
│  GameState | tick(state, inputs, rng) -> nextState │
└────────────────────────────────────────────────────┘
```

### 2.2 データフロー（一方向）

```
Input ──► Commands ──► InputFrame ──► tick() ──► GameState
                                                     │
                                                     ▼
                                              Render(read-only)
```

★MUST: `Render` / `Svelte UI` / `AI` は `GameState` を **読み取り専用** で扱う。

### 2.3 モジュール依存表

| モジュール | 依存可能 | 依存禁止 |
|---|---|---|
| `core/sim` | なし | DOM, Pixi, Svelte, Node, fetch |
| `core/pathfinding` | `core/sim/types` | 同上 |
| `core/rng` | なし | 同上 |
| `core/replay` | `core/sim`, `core/rng` | 同上 |
| `apps/web/game/render` | `core/*`, `pixi.js` | Svelte 内部 API |
| `apps/web/game/input` | `core/sim/types` | Pixi 直接操作禁止 |
| `apps/web/game/ai` | `core/sim`, `core/pathfinding` | Pixi, DOM |
| `apps/web/game/net` | `core/sim` | DOM |
| `apps/web/src/ui` | Svelte, stores | Pixi 直接 import 禁止 |

---

## 3. 主要データ構造

### 3.1 型定義（`packages/core/src/sim/types.ts`）

```ts
// Branded ID
type Brand<T, B> = T & { __brand: B };
export type EntityId = Brand<number, "EntityId">;
export type CityId   = Brand<number, "CityId">;
export type PlayerId = Brand<number, "PlayerId">;

export type Vec2 = { x: number; y: number };

export type Terrain = "plain" | "mountain" | "forest" | "water";
export type UnitKind = "light" | "heavy";

// プレイヤー
export interface Player {
  id: PlayerId;
  name: string;
  color: number;   // 0xRRGGBB
  alive: boolean;
}

// 都市
export interface City {
  id: CityId;
  pos: Vec2;
  owner: PlayerId | null;          // null = 中立
  production: UnitKind;
  produceCooldownTicks: number;    // 残 tick
  captureProgressTicks: number;    // 占領進行度
  capturingPlayer: PlayerId | null;
  supplyUsed: number;              // 現在の補給枠使用数
}

// ユニット
export interface Unit {
  id: EntityId;
  owner: PlayerId;
  kind: UnitKind;
  homeCity: CityId;                // 補給枠の親都市
  pos: Vec2;                       // 浮動小数だが整数演算で更新
  hp: number;
  path: Vec2[] | null;             // 残経路
  goal: Vec2 | null;
  attackCooldownTicks: number;
}

// マップ
export interface MapDef {
  id: string;
  width: number;
  height: number;
  terrain: Uint8Array;             // length = width * height
  cities: Readonly<Pick<City, "id" | "pos" | "production">>[];
  spawns: { player: PlayerId; cityId: CityId }[];
}

// ゲーム状態（決定論的：シリアライズ可能であること）
export interface GameState {
  tick: number;
  seed: number;
  map: MapDef;
  players: Player[];
  cities: City[];
  units: Unit[];
  nextEntityId: number;
  result: GameResult | null;
}

export type GameResult =
  | { type: "victory"; winner: PlayerId; reason: "domination" | "annihilation" | "timeout" }
  | { type: "draw" };

// 入力
export type Command =
  | { type: "select";  player: PlayerId; ids: EntityId[] }
  | { type: "move";    player: PlayerId; ids: EntityId[]; to: Vec2 }
  | { type: "line";    player: PlayerId; ids: EntityId[]; from: Vec2; to: Vec2 };

export interface InputFrame {
  tick: number;
  commands: Command[];
}
```

### 3.2 設計上の注意
- **`GameState` 全体は JSON シリアライズ可能であること**（リプレイ・送信のため）
- `Unit` / `City` は plain object（クラスではない）
- 大量データ（数千ユニット）対応時は **SoA（Structure of Arrays）** へリファクタ余地を残す

---

## 4. ゲームループ詳細

### 4.1 タイムスケール
- **TICK_DT = 1000 / 30 ≈ 33.33 ms**
- 1秒あたり 30 tick
- 速度系の値は **「単位/秒」を `*TICK_DT/1000` で適用**

### 4.2 ループ実装方針

```ts
const TICK_DT_MS = 1000 / 30;
const MAX_FRAME_DT = 250;  // 250ms 超は捨てる（タブ復帰時の暴発防止）

let acc = 0;
let last = performance.now();
let prev: GameState = structuredClone(initialState);
let cur:  GameState = initialState;

function frame(now: number) {
  const dt = Math.min(now - last, MAX_FRAME_DT);
  last = now;
  acc += dt;

  while (acc >= TICK_DT_MS) {
    prev = cur;
    const inputs = collectInputs();  // ローカル(or net)
    cur = tick(cur, inputs, rng);    // 純関数
    acc -= TICK_DT_MS;
  }

  render(prev, cur, acc / TICK_DT_MS);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

### 4.3 補間レンダ
- `Unit.pos` を `prev` と `cur` で線形補間して描画
- 戦闘エフェクト・占領進捗バーは `cur` のみ参照
- カメラの平滑追従も RAF 側で

---

## 5. シミュレーション（`core/sim/tick.ts`）

### 5.1 1tick の処理順

```ts
function tick(state: GameState, inputs: readonly InputFrame[], rng: Rng): GameState {
  let s = clone(state);
  s.tick++;

  // 1. 入力反映（選択・移動命令を Unit に書き込む）
  applyInputs(s, inputs);

  // 2. パス更新（goal が変わっていれば再計算）
  recomputePathsIfDirty(s);

  // 3. ユニット移動
  moveUnits(s);

  // 4. 戦闘（最寄り敵にダメージ）
  resolveCombat(s);

  // 5. 死亡処理（HP<=0 を除去、補給枠を解放）
  removeDeadUnits(s);

  // 6. 都市占領進行
  updateCityCapture(s);

  // 7. 都市生産
  produceUnits(s);

  // 8. 勝敗判定
  evaluateGameEnd(s);

  return s;
}
```

各ステップは別ファイル `core/sim/steps/<name>.ts` に分けて、tick.ts は orchestrator にする。

### 5.2 各ステップの責務

| ステップ | 入力 | 出力（state 変更箇所） |
|---|---|---|
| applyInputs | inputs | Unit.goal, selection |
| recomputePaths | Unit.goal | Unit.path |
| moveUnits | Unit.path, pos, kind | Unit.pos |
| resolveCombat | units, attackCooldown | unit.hp, attackCooldown |
| removeDead | units | units（フィルタ）+ City.supplyUsed |
| cityCapture | units の都市マス滞在 | City.capturingPlayer, captureProgressTicks, owner |
| produceUnits | cities, players | units（追加） |
| evaluateGameEnd | players, cities, tick | state.result |

---

## 6. 決定論的 RNG

### 6.1 アルゴリズム
- **mulberry32**（高品質・短実装・整数演算可）

```ts
// packages/core/src/rng.ts
export class Rng {
  private a: number;
  constructor(seed: number) { this.a = seed >>> 0; }
  next(): number {
    this.a = (this.a + 0x6D2B79F5) >>> 0;
    let t = this.a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }
  state(): number { return this.a; }
  static restore(s: number): Rng { const r = new Rng(0); (r as any).a = s >>> 0; return r; }
}
```

### 6.2 利用ルール
- ★MUST: sim 内で乱数が必要な箇所は **必ず** `Rng` 経由
- ★MUST NOT: `Math.random()` 使用
- RNG の `state()` も `GameState` に含めるか、初期 seed + tick 数で再現可能にする

---

## 7. パスファインディング

### 7.1 アルゴリズム選定

| ユニット数 | アルゴリズム |
|---|---|
| 〜100 | A*（per unit）+ パスキャッシュ（同じ start/goal）|
| 100〜500 | グループ A* + ローカル回避 |
| 500〜 | Flow Field（goal 単位でフィールドを計算）|

**MVP: A* + 1tick あたりの再計算上限**（例: 1tick で 8 ユニット分まで）。

### 7.2 A* 実装方針

```ts
// packages/core/src/pathfinding/astar.ts
export function findPath(
  map: MapDef,
  start: Vec2,
  goal: Vec2,
  kind: UnitKind,
): Vec2[] | null;
```

- グリッドは **4方向（または 8 方向 + 対角コスト √2）**
- ヒューリスティック: マンハッタン（4方向）or オクタイル（8方向）
- 通行コスト:
  - light: plain=1, forest=2, mountain=3, water=∞, city=1
  - heavy: plain=1, forest=∞, mountain=∞, water=∞, city=1
- 優先度キューは **binary heap**（自前実装可）
- 決定論のため、同コストの tie-break は **(y * width + x) 昇順**

### 7.3 最適化
1. **再計算抑制**: `Unit.goal` が変わっていなければ再計算しない
2. **キャッシュ**: 同一 (start_cell, goal_cell, kind) のパスを LRU でキャッシュ（小規模 64 件程度）
3. **段階導入**: A* → Hierarchical A* → Flow Field（必要になったら）

### 7.4 Phase 2 で WebWorker / WASM 化
- 重い場合は `apps/web/src/game/workers/path.worker.ts` を作り、メインスレッドから offload
- 将来 Rust + WASM への置換ポイント（同一インターフェース）

---

## 8. 影響マップ・前線

### 8.1 影響マップ（influence map）
- セル単位の値 `Int16Array(width * height)`
- 各陣営ごとに 1 枚
- ユニット位置に強度を加算 → 数回ガウシアン拡散
- AI 判断・前線描画に利用

### 8.2 計算頻度
- 毎 tick ではなく **5 tick ごと**（10 Hz）でも十分
- 描画用は補間で滑らかに見せる

### 8.3 前線描画
- 影響マップ `infl[A] - infl[B]` の **0 等高線**
- マーチングスクエア法で線を生成 → PixiJS の Graphics で描画

---

## 9. AI 設計

### 9.1 v0（MVP・ルールベース）

```ts
// 各 AI tick で:
// 1. 自陣営のユニットを「待機」「移動中」に分類
// 2. 占領可能都市リストを生成（中立 or 弱い敵）
// 3. 価値 = (1/距離) * 重み − 守備の弱さ で並べ替え
// 4. 上位ターゲットへ未割当ユニットの一部を派遣
// 5. 自都市が脅威下 → 近隣ユニットを呼び戻し
```

### 9.2 v1（Phase2・影響マップベース）
- 影響マップを使って「最も押し込まれている」境界を検出
- 押し返し方向にユニット投入
- 経済（都市数）と軍事（ユニット数）のバランスを評価関数で調整

### 9.3 難易度
- Easy: 思考遅延 (3 秒)、操作精度 70%
- Normal: 思考遅延 1 秒、精度 85%
- Hard: 即時、精度 95%

### 9.4 ★MUST NOT
- AI に Math.random を使わない（Rng 経由）
- AI が sim の private state を書き換えない（Command 経由のみ）

---

## 10. リプレイ

### 10.1 リプレイ形式

```ts
interface Replay {
  version: number;            // schema バージョン
  seed: number;               // RNG seed
  mapId: string;
  players: { id: PlayerId; name: string; type: "human" | "ai" }[];
  inputs: InputFrame[];       // tick 順
  finalTick: number;
  result: GameResult;
  createdAt: number;          // 保存時の wall clock（sim 外）
}
```

### 10.2 再生
- 同じ seed・同じマップ・同じ inputs を tick で流す
- フレーム末で `GameState` ハッシュをチェック（desync 検知）

### 10.3 ハッシュ
- `hash(state)` 関数を `core/sim/hash.ts` に実装
  - tick, units の (pos x10, hp, owner), cities の (owner, supplyUsed) を整数化して 32bit xor フォールド

---

## 11. ネットワーク（Phase3）

### 11.1 構成

```
[Client A]                                   [Client B]
   │                                              │
   │ WS                                         WS│
   ▼                                              ▼
┌────────────────────────────────────────────────────┐
│  Cloudflare Durable Object (1 試合 = 1 インスタンス) │
│   - 入力中継（Lockstep）                            │
│   - tick 番号同期                                   │
│   - 観戦者ブロードキャスト                          │
└────────────────────────────────────────────────────┘
```

### 11.2 Lockstep プロトコル（簡易）

```
[client]  send: { type: "input", tick: N, cmds: [...] }
[server]  collect 全プレイヤーの tick N 入力 → broadcast
[server]  send: { type: "frame", tick: N+2, inputs: { p0:[...], p1:[...] } }
                                  ↑ 2 tick の入力遅延でジッタを吸収
[client]  受信した frame を InputFrame として tick(N+2) で適用
```

### 11.3 desync 検知
- 各クライアントは `tick % 30 === 0` のタイミングで `hash(state)` を送る
- サーバが集約して一致確認
- 不一致なら全員に `desync` イベント → 試合中断 + ログ収集

### 11.4 切断対応
- 任意プレイヤーが N tick 連続で入力来ず → AI に切り替え or 敗北扱い
- ホスト概念なし（DO がオーソリ）

---

## 12. UI / UX

### 12.1 画面構成

```
+----------------------------------------------------+
| HUD: 都市数 | ユニット数 | 経過時間 | ⏸           |
|----------------------------------------------------|
|                                                    |
|              [ Game Canvas (PixiJS) ]              |
|                                                    |
|----------------------------------------------------|
| 選択中: 12 unit | 命令: Move (10, 18)              |
+----------------------------------------------------+
```

### 12.2 入力（PC）

| 操作 | 内容 |
|---|---|
| 左ドラッグ | 矩形選択 |
| 左クリック | 単体選択 |
| 右クリック | 選択ユニットへ移動命令 |
| 右ドラッグ（ライン） | 編成命令（線上に展開）|
| マウスホイール | ズーム |
| 中ドラッグ / 矢印 | カメラパン |
| Space | ポーズ |

### 12.3 入力（モバイル）

| 操作 | 内容 |
|---|---|
| タップ | 単体選択 |
| ロングプレス → ドラッグ | 矩形選択 |
| 二指タップ | 選択解除 |
| 二指ピンチ | ズーム |
| 二指ドラッグ | パン |
| 選択中タップ | 移動命令 |

### 12.4 アクセシビリティ
- カラーブラインド対応の陣営色（青 vs オレンジ など）
- 設定でハイコントラスト切替
- キーボードショートカット表示

---

## 13. アセット規約

| 種別 | 推奨 | 備考 |
|---|---|---|
| アイコン | Kenney "Game Icons" (CC0) | UI のボタン |
| 地形タイル | Kenney "Top-Down" / 自作 | 16x16 or 32x32 |
| ユニット | 単純な円・三角（Pixi Graphics）| アート負荷を避ける |
| SFX | freesound.org の CC0 | クリック・戦闘・占領 |
| BGM | OpenGameArt CC0 | 1〜2 曲ループ |
| フォント | Inter / Noto Sans JP | Self-hosted |

★MUST: ライセンスを `apps/web/public/assets/CREDITS.md` に記載。

---

## 14. ストレージ / 永続化

### 14.1 ローカル（クライアント）
- IndexedDB（`idb-keyval`）
  - `settings`: 音量、キーバインド
  - `recentReplays`: 直近 20 件
  - `playerProfile`: 匿名 UUID, 表示名（任意）

### 14.2 サーバ（Phase4 以降）
- D1（SQLite）: ランキング, レーティング履歴
- R2: リプレイファイル（gzip JSON）
- KV: マッチング用一時データ

---

## 15. パフォーマンス目標

| 指標 | 目標 | 計測方法 |
|---|---|---|
| 初回ロード（cold） | < 3 秒（4G想定）| Lighthouse |
| ゲーム中 FPS | 60 安定 | `stats.js` / chrome devtools |
| 同時ユニット数 | 200 まで 60 FPS、500 まで 30 FPS | プロファイラ |
| Tick 処理時間 | < 5 ms / tick (200 unit) | `performance.now()` 内部計測 |
| メモリ | < 200 MB | devtools |
| バンドル（gz） | < 500 KB（ゲーム本体）| `vite build --report` |

### 15.1 最適化チェックリスト
- [ ] PixiJS `ParticleContainer` で ユニットをバッチ
- [ ] ユニット / 弾 / エフェクトの Object Pool
- [ ] パスファインディング結果キャッシュ
- [ ] 影響マップは 5tick ごと
- [ ] 当たり判定は QuadTree or Spatial Hash
- [ ] 不要な structuredClone を避ける（部分更新で済むなら）
- [ ] アセット: WebP/AVIF、適切な圧縮、フォントは subset

---

## 16. セキュリティ

| 脅威 | 対応 |
|---|---|
| クライアントチート | Phase3: Lockstep（クライアント信頼）→ Phase5: server-side replay 検証 |
| Speed hack | tick 番号はサーバ基準 |
| Packet 改ざん | DO 側で zod スキーマ検証 |
| XSS | Svelte `@html` 禁止 |
| DDoS | Cloudflare 標準防御に依存 |
| 個人情報 | 認証は匿名 → OAuth、PII は最小限 |

---

## 17. テスト戦略

### 17.1 テストピラミッド

```
              /\
             /E2E\          1〜5 シナリオ（Playwright）
            /------\
           / Integ. \       10〜20 ケース（sim 全体の流れ）
          /----------\
         /    Unit    \     50〜200 ケース（pure 関数）
        /--------------\
```

### 17.2 必須テスト

| 対象 | テスト |
|---|---|
| RNG | seed → 同列で同じ乱数 |
| A* | 山を迂回 / 到達不能で null / 同コスト tie-break で決定論 |
| tick | 同入力で同出力（reset → 1000tick → hash 等価） |
| リプレイ | record → replay でハッシュ完全一致 |
| AI | 「中立都市があれば必ず奪いに行く」等の不変条件 |

### 17.3 E2E（Playwright）
- 起動 → スタート → AI に勝つ までを 1 本
- ポーズ → 再開 → 結果画面 まで 1 本
- 設定変更 → リロード → 設定維持 まで 1 本

---

## 18. ロードマップ概要（詳細は TASKS.md）

| Phase | 目標 | 期間目安 |
|---|---|---|
| 1 | シングルプレイ MVP | 4〜6 週 |
| 2 | AI 改善・Heavy ユニット・複数マップ | 2〜3 週 |
| 3 | マルチプレイ（Lockstep） | 4〜6 週 |
| 4 | ランキング・リプレイ共有・観戦 | 3〜4 週 |
| 5 | 本番運用・最適化・anti-cheat | 継続 |

---

## 19. 将来拡張ポイント

- **PWA 化**: Vite PWA プラグイン、Phase1 から入れて OK
- **Tauri デスクトップ化**: 同じ web 資産を再利用
- **Capacitor モバイルアプリ化**: 同上
- **Steam 配信**: Tauri → Steamworks SDK
- **Spectator Mode**: DO の read-only WS 経由
- **Mod**: マップ JSON 公開 → ルール DSL 検討

---

## 20. 用語

`CLAUDE.md` グロッサリ参照。

---

## 21. 変更履歴

| 日付 | バージョン | 変更 |
|---|---|---|
| 2026-05-19 | 1.0.0 | 初版作成 |
