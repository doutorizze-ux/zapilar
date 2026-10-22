import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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
  phone: string; // WhatsApp number for human handover and hot lead alerts

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

  @Column({ unique: true, nullable: true })
  slug: string; // URL friendly name (e.g. 'motors-v8')

  @Column({ nullable: true, default: '#00C2CB' })
  primaryColor: string; // Store branding color

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  coverUrl: string; // Banner/Cover image for the store

  @Column({ nullable: true })
  address: string; // Physical address of the store

  @Column('text', { nullable: true })
  storeDescription: string; // Slogan or About Us text

  // Configurações do Corretor / Consultor IA
  @Column({ nullable: true, default: 'Sofia' })
  aiAgentName: string;

  @Column({ default: true })
  notifyHotLeads: boolean; // Enviar alerta de lead quente no WhatsApp do corretor

  @Column('text', { nullable: true })
  aiCustomInstructions: string; // Instruções personalizadas da imobiliária para a IA

  @Column({ nullable: true })
  asaasCustomerId: string;

  @Column({ nullable: true })
  subscriptionId: string;

  @Column({ nullable: true })
  planId: string;

  @Column({ nullable: true })
  evolutionApiKey: string;

  @Column({ nullable: true })
  evolutionInstanceName: string;

  @Column({ nullable: true })
  lastSubscriptionNotification: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
