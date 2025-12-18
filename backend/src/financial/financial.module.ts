import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction])],
    controllers: [FinancialController],
    providers: [FinancialService],
})
export class FinancialModule { }
