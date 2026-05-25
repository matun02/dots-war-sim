type Brand<T, B extends string> = T & { readonly __brand: B };

export type EntityId = Brand<number, 'EntityId'>;
export type CityId = Brand<number, 'CityId'>;
export type PlayerId = Brand<number, 'PlayerId'>;

export interface Vec2 {
  x: number;
  y: number;
}

export type Terrain = 'plain' | 'mountain' | 'forest' | 'water';

export const TERRAIN_INDEX: Record<Terrain, number> = {
  plain: 0,
  mountain: 1,
  forest: 2,
  water: 3,
};

export type UnitKind = 'light' | 'heavy';

export interface Player {
  id: PlayerId;
  name: string;
  color: number;
  alive: boolean;
}

export interface City {
  id: CityId;
  pos: Vec2;
  owner: PlayerId;
  production: UnitKind;
  produceCooldownTicks: number;
  captureProgressTicks: number;
  capturingPlayer: PlayerId | null;
  supplyUsed: number;
}

export interface Unit {
  id: EntityId;
  owner: PlayerId;
  kind: UnitKind;
  homeCity: CityId;
  pos: Vec2;
  hp: number;
  path: Vec2[] | null;
  goal: Vec2 | null;
  attackCooldownTicks: number;
}

export interface MapDef {
  id: string;
  width: number;
  height: number;
  terrain: number[];
  cities: Readonly<Pick<City, 'id' | 'pos' | 'production'> & { owner?: PlayerId }>[];
  spawns: { player: PlayerId; cityId: CityId }[];
}

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
  | {
      type: 'victory';
      winner: PlayerId;
      reason: 'domination' | 'annihilation' | 'timeout';
    }
  | { type: 'draw' };

export type Command =
  | { type: 'select'; player: PlayerId; ids: EntityId[] }
  | { type: 'move'; player: PlayerId; ids: EntityId[]; to: Vec2 }
  | {
      type: 'line';
      player: PlayerId;
      ids: EntityId[];
      from: Vec2;
      to: Vec2;
    }
  | {
      type: 'set-production';
      player: PlayerId;
      cityId: CityId;
      production: UnitKind;
    };

export interface InputFrame {
  tick: number;
  commands: Command[];
}
