import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlansService } from '../plans/plans.service';

@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly plansService: PlansService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    return this.propertiesService.create(createPropertyDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files found');

    const property = await this.propertiesService.findOne(id);
    if (!property) {
      throw new BadRequestException('Property not found');
    }

    if (property.userId !== req.user.userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (!property.images) property.images = [];

    files.forEach((file) => {
      if (property.images.length < 5) {
        const imageUrl = `/uploads/${file.filename}`;
        property.images.push(imageUrl);
      }
    });

    return this.propertiesService.update(id, { images: property.images }, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-doc')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/docs',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files found');

    const property = await this.propertiesService.findOne(id);
    if (!property) throw new BadRequestException('Property not found');

    if (property.userId !== req.user.userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (!property.documents) property.documents = [];

    files.forEach((file) => {
      const docUrl = `/uploads/docs/${file.filename}`;
      property.documents.push({
        name: file.originalname,
        url: docUrl,
        type: file.mimetype,
        date: new Date().toISOString(),
      });
    });

    return this.propertiesService.update(id, { documents: property.documents }, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.propertiesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.propertiesService.remove(id, req.user.userId);
  }
}
