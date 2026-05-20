import type { Command, PlayerId, EntityId, Vec2 } from '@war-of-dots/core';

export interface InputCollector {
  selectedIds: EntityId[];
  select(ids: EntityId[]): void;
  moveCommand(to: Vec2): void;
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

    flush(): Command[] {
      const cmds = buffer;
      buffer = [];
      return cmds;
    },
  };
}
