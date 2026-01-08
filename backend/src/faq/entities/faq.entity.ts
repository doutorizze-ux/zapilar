import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  question: string; // The trigger phrase

  @Column('text')
  answer: string; // The response

  @Column({ default: true })
  active: boolean;
}
