import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class FinancialService {
    constructor(
        @InjectRepository(Transaction)
        private repo: Repository<Transaction>,
    ) { }

    create(userId: string, dto: CreateTransactionDto) {
        const transaction = this.repo.create({ ...dto, userId });
        return this.repo.save(transaction);
    }

    findAll(userId: string) {
        return this.repo.find({
            where: { userId },
            order: { date: 'DESC', createdAt: 'DESC' }
        });
    }

    update(id: string, userId: string, dto: CreateTransactionDto) {
        return this.repo.update({ id, userId }, dto);
    }

    remove(id: string, userId: string) {
        return this.repo.delete({ id, userId });
    }

    async getSummary(userId: string) {
        const transactions = await this.findAll(userId);
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            income,
            expense,
            balance: income - expense
        };
    }
}
