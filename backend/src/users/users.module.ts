import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { PropertiesModule } from '../properties/properties.module';
import { PlansModule } from '../plans/plans.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), forwardRef(() => PropertiesModule), PlansModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
