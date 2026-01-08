import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Análise',
  RESOLVED = 'Resolvido',
}

@Entity()
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({
    type: 'simple-enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
