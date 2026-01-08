import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,
  ) {}

  create(userId: string, data: Partial<Faq>) {
    const faq = this.faqRepository.create({ ...data, userId });
    return this.faqRepository.save(faq);
  }

  findAll(userId: string) {
    return this.faqRepository.find({ where: { userId } });
  }

  async update(id: string, userId: string, data: Partial<Faq>) {
    await this.faqRepository.update({ id, userId }, data);
    return this.faqRepository.findOne({ where: { id } });
  }

  remove(id: string, userId: string) {
    return this.faqRepository.delete({ id, userId });
  }

  // New method for matching logic
  async findMatch(userId: string, message: string): Promise<string | null> {
    const faqs = await this.findAll(userId);
    const lowerMsg = message.toLowerCase();

    // Find first FAQ where the question is contained in the message (or vice versa?)
    // Usually, if user asks "qual o endereço", we match "endereço".
    // Let's loop.
    for (const faq of faqs) {
      if (!faq.active) continue;
      const trigger = faq.question.toLowerCase();
      // If the user message contains the trigger phrase
      if (lowerMsg.includes(trigger)) {
        return faq.answer;
      }
    }
    return null;
  }
}
