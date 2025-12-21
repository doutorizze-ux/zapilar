import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum PropertyType {
    HOUSE = 'Casa',
    APARTMENT = 'Apartamento',
    LAND = 'Terreno',
    FARM = 'Fazenda',
    COMMERCIAL = 'Comercial',
    OTHER = 'Outro'
}

@Entity('properties')
export class Property {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({
        type: 'simple-enum',
        enum: PropertyType,
        default: PropertyType.HOUSE
    })
    type: PropertyType;

    @Column('decimal', { precision: 12, scale: 2 })
    price: number;

    @Column()
    location: string;

    @Column('float', { nullable: true })
    area: number; // in m2

    @Column({ nullable: true })
    bedrooms: number;

    @Column({ nullable: true })
    bathrooms: number;

    @Column({ nullable: true })
    parkingSpaces: number;

    @Column('text')
    description: string;

    @Column('simple-json', { nullable: true })
    images: string[];

    @Column('simple-json', { nullable: true })
    documents: { name: string; url: string; type: string; date: string }[];

    // Common real estate features
    @Column({ default: false })
    pool: boolean;

    @Column({ default: false })
    security: boolean; // Portaria/Segurança

    @Column({ default: false })
    elevator: boolean;

    @Column({ default: false })
    furnished: boolean;

    @ManyToOne(() => Store)
    store: Store;

    @Column({ nullable: true })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
