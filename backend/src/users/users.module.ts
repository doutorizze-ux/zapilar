import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]), forwardRef(() => VehiclesModule)],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
