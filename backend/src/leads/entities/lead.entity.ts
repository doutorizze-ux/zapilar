import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storeId: string; // The user (store owner) ID

  @Column()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column('text')
  lastMessage: string;

  @Column({ default: false })
  isHot: boolean;

  @Column({ nullable: true })
  interestSubject: string;

  // --- Qualification Fields (AI Driven) ---
  @Column({ nullable: true })
  budget: string;

  @Column({ nullable: true })
  financing: string; // 'Sim', 'Não', 'Em dúvida'

  @Column({ nullable: true })
  motivation: string; // 'Moradia', 'Investimento'

  @Column({ nullable: true })
  urgency: string; // 'Imediata', 'Próximos meses', 'Apenas pesquisando'

  @Column({ type: 'text', nullable: true })
  aiNotes: string; // Summary of customer profile

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
