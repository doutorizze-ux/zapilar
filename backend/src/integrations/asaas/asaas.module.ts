import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasService } from './asaas.service';

@Module({
  imports: [ConfigModule],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}
