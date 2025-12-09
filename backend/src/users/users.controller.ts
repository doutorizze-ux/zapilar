
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() body: any) {
        return this.usersService.updateById(id, body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findById(req.user.userId);
        if (user) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req, @Body() body: { storeName?: string; phone?: string }) {
        console.log('Update Profile Request for User ID:', req.user.userId);

        const updates: any = {};
        if (body.storeName !== undefined) updates.storeName = body.storeName;
        if (body.phone !== undefined) updates.phone = body.phone;

        const result = await this.usersService.updateById(req.user.userId, updates);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Post('logo')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `logo-${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File not found');
        const logoUrl = `/uploads/${file.filename}`;
        return this.usersService.updateById(req.user.userId, { logoUrl });
    }
}
