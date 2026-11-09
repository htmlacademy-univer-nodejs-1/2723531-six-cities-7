import type {Offer, User} from '../../types/index.js';

export type OfferPreview = Pick<Offer,
  'title' | 'price' | 'type' | 'isFavorite' | 'postDate' | 'city' |
  'previewImage' | 'isPremium' | 'rating' | 'commentCount'
> & {id: string};

export type OfferDetails = Omit<Offer, 'user'> & {
  id: string;
  user: Omit<User, 'password'> & {id: string};
};
