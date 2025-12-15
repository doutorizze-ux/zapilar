import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    storeId: string; // The user own this chat

    @Column()
    contactId: string; // The customer phone number

    @Column()
    from: string; // 'me', 'bot', or customer phone

    @Column('text')
    body: string;

    @Column()
    senderName: string;

    @Column({ nullable: true })
    wamid: string; // WhatsApp Message ID for deduplication

    @Column({ default: false })
    isBot: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
