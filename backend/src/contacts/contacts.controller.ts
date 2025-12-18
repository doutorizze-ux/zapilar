import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
    constructor(private readonly service: ContactsService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateContactDto) {
        return this.service.create(req.user.userId, dto);
    }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: CreateContactDto) {
        return this.service.update(id, req.user.userId, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.service.remove(id, req.user.userId);
    }
}
