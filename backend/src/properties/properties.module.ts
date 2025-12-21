import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Property } from './entities/property.entity';

import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([Property]), forwardRef(() => UsersModule), PlansModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule { }
