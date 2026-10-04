export const HOUSING_TYPES = ['apartment', 'house', 'room', 'hotel'] as const;

export type HousingType = typeof HOUSING_TYPES[number];
