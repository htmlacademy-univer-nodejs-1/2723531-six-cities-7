import type { Amenity } from './amenity.type.js';
import type { City } from './city.type.js';
import type { HousingType } from './housing-type.type.js';
import type { Coordinates } from './location.type.js';
import type { User } from './user.type.js';

export type Offer = {
  title: string;
  description: string;
  postDate: Date;
  city: City;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  isFavorite: boolean;
  rating: number;
  type: HousingType;
  bedrooms: number;
  maxAdults: number;
  price: number;
  amenities: Amenity[];
  user: User;
  commentCount: number;
  location: Coordinates;
};
