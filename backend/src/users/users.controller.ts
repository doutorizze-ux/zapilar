
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly vehiclesService: VehiclesService
    ) { }

    // --- Rotas de Perfil (UserLogado) - Devem vir antes de :id ---

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
    async updateProfile(@Request() req, @Body() body: { storeName?: string; phone?: string; slug?: string; primaryColor?: string; address?: string; storeDescription?: string }) {
        console.log('--------------------------------------------------');
        console.log('[UsersController] PATCH /profile called');
        console.log('[UsersController] User:', req.user);

        const updates: any = {};
        if (body.storeName !== undefined) updates.storeName = body.storeName;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.slug !== undefined) updates.slug = body.slug;
        if (body.primaryColor !== undefined) updates.primaryColor = body.primaryColor;
        if (body.address !== undefined) updates.address = body.address;
        if (body.storeDescription !== undefined) updates.storeDescription = body.storeDescription;

        return this.usersService.updateById(req.user.userId, updates);
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

    @UseGuards(JwtAuthGuard)
    @Post('cover')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `cover-${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new Error('File not found');
        const coverUrl = `/uploads/${file.filename}`;
        return this.usersService.updateById(req.user.userId, { coverUrl });
    }

    // --- Public Storefront Route --
    @Get('public/:slug')
    async getPublicStore(@Param('slug') slug: string) {
        const user = await this.usersService.findBySlug(slug);
        if (!user) {
            throw new Error('Store not found');
        }

        const vehicles = await this.vehiclesService.findAll(user.id);

        return {
            store: {
                name: user.storeName,
                logoUrl: user.logoUrl,
                coverUrl: user.coverUrl,
                phone: user.phone,
                primaryColor: user.primaryColor || '#000000',
                email: user.email,
                address: user.address,
                description: user.storeDescription
            },
            vehicles: vehicles
        };
    }

    // --- Rotas de Admin (Genéricas ou Parametrizadas) ---

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get()
    async findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() body: any) {
        return this.usersService.updateById(id, body);
    }

    // TEMP: Force Reset to ensure access - Re-added for Production fix
    @Post('force-reset-admin')
    async forceReset() {
        // Resets to 'admin'
        return this.usersService.seedAdmin(true);
    }
}
