import * as v from 'valibot';

const CitySchema = v.object({
  id: v.number(),
  pos: v.object({
    x: v.number(),
    y: v.number(),
  }),
  production: v.picklist(['light', 'heavy']),
  owner: v.optional(v.number()),
});

const UnitKindSchema = v.picklist(['light', 'heavy']);

const SpawnSchema = v.object({
  player: v.number(),
  cityId: v.number(),
  kind: v.optional(UnitKindSchema),
  unitPositions: v.optional(
    v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        kind: v.optional(UnitKindSchema),
      }),
    ),
  ),
});

export const MapJsonSchema = v.pipe(
  v.object({
    id: v.pipe(v.string(), v.nonEmpty('id must be non-empty')),
    width: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'width must be >= 1'),
      v.maxValue(256, 'width must be <= 256'),
    ),
    height: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'height must be >= 1'),
      v.maxValue(256, 'height must be <= 256'),
    ),
    terrain: v.array(v.number()),
    cities: v.array(CitySchema),
    spawns: v.array(SpawnSchema),
  }),
);

export type MapJson = v.InferOutput<typeof MapJsonSchema>;
