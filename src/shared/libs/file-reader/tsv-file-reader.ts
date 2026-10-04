import { readFileSync } from 'node:fs';
import type { FileReader } from './file-reader.interface.js';
import { AMENITIES, CITIES, HOUSING_TYPES, USER_TYPES } from '../../types/index.js';
import type { Offer } from '../../types/index.js';

export class TSVFileReader implements FileReader {
  private rawData: string | null = null;

  constructor(
    private readonly filename: string
  ) {}

  public read(): void {
    this.rawData = readFileSync(this.filename, { encoding: 'utf-8' });
  }

  private parseNumber(value: string, field: string): number {
    const parsedValue = Number(value);

    if (value === '' || !Number.isFinite(parsedValue)) {
      throw new Error(`Invalid number for ${field}: ${value}`);
    }

    return parsedValue;
  }

  private parseBoolean(value: string, field: string): boolean {
    if (value !== 'true' && value !== 'false') {
      throw new Error(`Invalid boolean for ${field}: ${value}`);
    }

    return value === 'true';
  }

  private parseEnum<T extends string>(value: string, allowedValues: readonly T[], field: string): T {
    const parsedValue = allowedValues.find((item) => item === value);

    if (parsedValue === undefined) {
      throw new Error(`Invalid value for ${field}: ${value}`);
    }

    return parsedValue;
  }

  public toArray(): Offer[] {
    if (this.rawData === null) {
      throw new Error('File was not read');
    }

    return this.rawData
      .split(/\r?\n/)
      .filter((row) => row.trim().length > 0)
      .map((line): Offer => {
        const columns = line.split('\t').map((value) => value.trim());

        if (columns.length !== 22) {
          throw new Error('Each offer must contain 22 columns.');
        }

        const [
          title, description, date, city, previewImage, images,
          isPremium, isFavorite, rating, housingType, bedrooms, maxAdults,
          price, amenities, name, email, avatarPath, password,
          userType, commentCount, latitude, longitude,
        ] = columns;

        const postDate = new Date(date);

        if (Number.isNaN(postDate.getTime())) {
          throw new Error(`Invalid publication date: ${date}`);
        }

        const photoPaths = images.split(';').map((image) => image.trim());

        if (photoPaths.length !== 6 || photoPaths.some((image) => image === '')) {
          throw new Error('Each offer must contain exactly 6 images.');
        }

        return {
          title,
          description,
          postDate,
          city: this.parseEnum(city, CITIES, 'city'),
          previewImage,
          images: photoPaths,
          isPremium: this.parseBoolean(isPremium, 'isPremium'),
          isFavorite: this.parseBoolean(isFavorite, 'isFavorite'),
          rating: this.parseNumber(rating, 'rating'),
          type: this.parseEnum(housingType, HOUSING_TYPES, 'housing type'),
          bedrooms: this.parseNumber(bedrooms, 'bedrooms'),
          maxAdults: this.parseNumber(maxAdults, 'maxAdults'),
          price: this.parseNumber(price, 'price'),
          amenities: amenities.split(';')
            .map((amenity) => this.parseEnum(amenity.trim(), AMENITIES, 'amenity')),
          user: {
            name,
            email,
            avatarPath: avatarPath || undefined,
            password,
            type: this.parseEnum(userType, USER_TYPES, 'user type'),
          },
          commentCount: this.parseNumber(commentCount, 'commentCount'),
          location: {
            latitude: this.parseNumber(latitude, 'latitude'),
            longitude: this.parseNumber(longitude, 'longitude'),
          },
        };
      });
  }
}
