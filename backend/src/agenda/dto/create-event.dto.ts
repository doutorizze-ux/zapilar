import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateEventDto {
    @IsString()
    title: string;

    @IsDateString()
    start: string; // ISO String

    @IsDateString()
    @IsOptional()
    end?: string; // ISO String

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    location?: string;
}
