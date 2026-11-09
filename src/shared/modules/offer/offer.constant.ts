export const DEFAULT_OFFER_COUNT = 60;
export const PREMIUM_OFFER_COUNT = 3;

export const OFFER_PREVIEW_FIELDS = 'title price type postDate city previewImage isPremium rating commentCount';

export const OFFER_UPDATE_FIELDS = [
  'title',
  'description',
  'postDate',
  'city',
  'previewImage',
  'images',
  'isPremium',
  'type',
  'bedrooms',
  'maxAdults',
  'price',
  'amenities',
  'location',
] as const;
