import { PropertyType } from '../entities/property.entity';

export class CreatePropertyDto {
  title: string;
  type: PropertyType;
  price: number;
  city?: string;
  neighborhood?: string;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  description: string;
  images: string[];
  pool?: boolean;
  security?: boolean;
  elevator?: boolean;
  furnished?: boolean; // mobilado
  documents?: { name: string; url: string; type: string; date: string }[];
}
