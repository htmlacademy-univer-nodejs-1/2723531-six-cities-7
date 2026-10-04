import type { City } from './city.type.js';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Location = Coordinates & {
  city: City;
};
