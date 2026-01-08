import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
