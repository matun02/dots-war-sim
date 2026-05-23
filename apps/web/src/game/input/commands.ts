import type {
  Command,
  PlayerId,
  EntityId,
  CityId,
  UnitKind,
  Vec2,
} from '@dots-war-sim/core';

export interface InputCollector {
  selectedIds: EntityId[];
  select(ids: EntityId[]): void;
  moveCommand(to: Vec2): void;
  setProductionCommand(cityId: CityId, production: UnitKind): void;
  flush(): Command[];
}

export function createInputCollector(player: PlayerId): InputCollector {
  let buffer: Command[] = [];
  let selectedIds: EntityId[] = [];

  return {
    get selectedIds(): EntityId[] {
      return selectedIds;
    },

    select(ids: EntityId[]): void {
      selectedIds = ids;
      buffer.push({ type: 'select', player, ids });
    },

    moveCommand(to: Vec2): void {
      if (selectedIds.length === 0) return;
      buffer.push({ type: 'move', player, ids: [...selectedIds], to });
    },

    setProductionCommand(cityId: CityId, production: UnitKind): void {
      buffer.push({ type: 'set-production', player, cityId, production });
    },

    flush(): Command[] {
      const cmds = buffer;
      buffer = [];
      return cmds;
    },
  };
}
