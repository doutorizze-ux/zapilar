import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-vehicle.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) { }
