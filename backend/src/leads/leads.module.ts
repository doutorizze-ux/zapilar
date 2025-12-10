import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';

@Module({
    imports: [TypeOrmModule.forFeature([Lead])],
    providers: [LeadsService],
    exports: [LeadsService]
})
export class LeadsModule { }
