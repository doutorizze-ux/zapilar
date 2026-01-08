import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private repo: Repository<Contact>,
  ) {}

  create(userId: string, dto: CreateContactDto) {
    const contact = this.repo.create({ ...dto, userId });
    return this.repo.save(contact);
  }

  findAll(userId: string) {
    return this.repo.find({ where: { userId }, order: { name: 'ASC' } });
  }

  update(id: string, userId: string, dto: CreateContactDto) {
    return this.repo.update({ id, userId }, dto);
  }

  remove(id: string, userId: string) {
    return this.repo.delete({ id, userId });
  }
}
