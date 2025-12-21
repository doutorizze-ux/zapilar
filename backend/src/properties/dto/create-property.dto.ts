import { PropertyType } from '../entities/vehicle.entity';

export class CreatePropertyDto {
    title: string;
    type: PropertyType;
    price: number;
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
