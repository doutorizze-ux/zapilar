import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum UserRole {
    ADMIN = 'admin',
    STORE_OWNER = 'store_owner',
    STORE_USER = 'store_user',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string; // WhatsApp number for human handover

    @Column({ nullable: true })
    document: string; // CPF or CNPJ


    @Column()
    passwordHash: string; // Will store bcrypt hash

    @Column({
        type: 'simple-enum',
        enum: UserRole,
        default: UserRole.STORE_OWNER,
    })
    role: UserRole;

    @Column({ nullable: true })
    storeName: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    asaasCustomerId: string;

    @Column({ nullable: true })
    subscriptionId: string;

    @Column({ nullable: true })
    planId: string;


    // @ManyToOne(() => Store, { nullable: true })
    // store: Store;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
