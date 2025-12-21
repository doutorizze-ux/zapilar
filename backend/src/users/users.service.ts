
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    async seedAdmin(force = false) {
        const adminEmail = 'admin@zapilar.com.br';
        const adminUser = await this.usersRepository.findOne({ where: { email: adminEmail } });

        if (!adminUser) {
            console.log('Seeding default admin user...');
            await this.create(adminEmail, 'admin', 'Zapilar Admin', UserRole.ADMIN);
        } else if (force) {
            console.log('Forcing Admin Password Reset...');
            const salt = await bcrypt.genSalt();
            const passwordHash = await bcrypt.hash('admin', salt);
            await this.usersRepository.update({ email: adminEmail }, { passwordHash });
            return { success: true, message: 'Admin password reset to: admin' };
        }
    }

    async create(email: string, password: string, storeName?: string, role: UserRole = UserRole.STORE_OWNER, document?: string): Promise<User> {
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const user = this.usersRepository.create({
            email,
            passwordHash,
            storeName,
            role,
            document
        });

        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findOne(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async update(email: string, updateData: Partial<User>): Promise<User> {
        await this.usersRepository.update({ email }, updateData);
        const user = await this.findOne(email);
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateById(id: string, updateData: Partial<User>): Promise<User> {
        console.log(`[UsersService] Request to update User ID ${id} with:`, updateData);

        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            console.error(`[UsersService] User ID ${id} not found.`);
            throw new Error('User not found');
        }

        // Merge updates
        const updatedUser = this.usersRepository.merge(user, updateData);

        console.log(`[UsersService] Saving updated user entity:`, updatedUser);
        const result = await this.usersRepository.save(updatedUser);
        console.log(`[UsersService] Saved result:`, result);

        return result;
    }

    async findBySlug(slug: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { slug } });
    }
}
