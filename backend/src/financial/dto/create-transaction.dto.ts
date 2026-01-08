import {
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  category: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
