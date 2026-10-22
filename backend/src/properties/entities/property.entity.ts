import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum PropertyType {
  HOUSE = 'Casa',
  APARTMENT = 'Apartamento',
  LAND = 'Terreno',
  LOT = 'Lote',
  FARM = 'Fazenda',
  CHACARA = 'Chácara',
  COMMERCIAL = 'Comercial',
  OTHER = 'Outro',
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
    default: PropertyType.HOUSE,
  })
  type: PropertyType;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  cep: string;

  @Column()
  location: string;

  @Column('float', { nullable: true })
  area: number; // in m2 or alqueires

  @Column({ default: 'm2' })
  areaUnit: string; // 'm2' ou 'alqueire' (1 Alqueire Goiano = 4,84 ha = 48.400 m2)

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

  // Mercado Imobiliário de Goiás & Região
  @Column({ default: false })
  acceptsTrade: boolean; // Aceita Permuta (Carro, Imóvel menor, Gado)

  @Column({ nullable: true })
  tradeDetails: string; // Ex: "Pega Hilux/SW4 ou lote no Jardins"

  @Column({ default: false })
  isGatedCommunity: boolean; // Condomínio Fechado (Jardins, Alphaville, Aldeia do Vale, etc.)

  @Column({ nullable: true })
  condoName: string; // Ex: "Jardins Verona", "Alphaville Flamboyant"

  @Column({ nullable: true })
  ruralAptitude: string; // 'Agricultura', 'Pecuária', 'Dupla Aptidão', 'Lazer'

  @Column({ default: false })
  ruralHasWater: boolean; // Represa, Rio, Nascente

  @Column({ default: false })
  ruralCarGeo: boolean; // CAR e GEO averbados

  @Column({ default: false })
  directFinancing: boolean; // Financiamento direto construtora/loteadora

  @Column({ nullable: true })
  balloonInstallments: string; // Balões semestrais/anuais

  @ManyToOne(() => Store, { nullable: true })
  store: Store;

  @Column({ nullable: true })
  userId: string;

  // Compartilhamento
  @Column({ default: false })
  isShared: boolean;

  @Column({ nullable: true })
  shareCode: string; // Também usado como senha para venda

  @Column({ nullable: true })
  parentPropertyId: string;

  @Column({ default: false })
  isSold: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
