import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faq } from './entities/faq.entity';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(Faq)
    private faqRepository: Repository<Faq>,
  ) { }

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

    // Normalização: remove acentos, símbolos e converte para minúsculo
    const normalize = (str: string) =>
      str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[?!!.,]/g, " ")
        .trim();

    const normalizedMsg = normalize(message);
    const msgWords = normalizedMsg.split(/\s+/).filter(w => w.length > 0);

    // Função para obter o radical (primeiras 4 letras de palavras longas)
    const getRadical = (word: string) => word.length > 4 ? word.substring(0, 4) : word;

    const msgRadicals = msgWords.map(getRadical);

    for (const faq of faqs) {
      if (!faq.active) continue;

      const normalizedQuestion = normalize(faq.question);
      const questionWords = normalizedQuestion.split(/\s+/).filter(w => w.length > 0);
      const questionRadicals = questionWords.map(getRadical);

      if (questionRadicals.length === 0) continue;

      // Conta quantas palavras/radicais da pergunta estão na mensagem do usuário
      let matches = 0;
      for (const qRad of questionRadicals) {
        if (msgRadicals.includes(qRad)) {
          matches++;
        }
      }

      const score = matches / questionRadicals.length;

      // Regra de Match: Score >= 0.5
      if (score >= 0.5) {
        return faq.answer;
      }
    }

    return null;
  }
}
