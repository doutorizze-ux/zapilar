import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from './entities/event.entity';
import { Availability } from './entities/availability.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Event)
    private repo: Repository<Event>,
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,
  ) {}

  create(userId: string, dto: CreateEventDto) {
    const event = this.repo.create({ ...dto, userId });
    return this.repo.save(event);
  }

  findAll(userId: string) {
    return this.repo.find({
      where: { userId },
      order: { start: 'ASC' },
    });
  }

  update(id: string, userId: string, dto: CreateEventDto) {
    return this.repo.update({ id, userId }, dto);
  }

  remove(id: string, userId: string) {
    return this.repo.delete({ id, userId });
  }

  getAvailability(userId: string) {
    return this.availabilityRepo.find({
      where: { userId, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async setAvailability(userId: string, slots: any[]) {
    // Clear existing
    await this.availabilityRepo.delete({ userId });
    // Create new entries
    const entities = slots.map((s) =>
      this.availabilityRepo.create({
        userId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }),
    );
    return this.availabilityRepo.save(entities);
  }

  async getAvailableSlots(userId: string, startDate: Date, endDate: Date) {
    const availabilities = await this.getAvailability(userId);
    const events = await this.repo.find({
      where: {
        userId,
        start: Between(startDate, endDate),
      },
    });

    const result: any[] = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dailyAvails = availabilities.filter((a) => a.dayOfWeek === dayOfWeek);

      if (dailyAvails.length > 0) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const timeSlots: string[] = [];

        for (const avail of dailyAvails) {
          const [hStart, mStart] = avail.startTime.split(':').map(Number);
          const [hEnd, mEnd] = avail.endTime.split(':').map(Number);

          let slotStart = hStart * 60 + mStart;
          const slotEnd = hEnd * 60 + mEnd;

          while (slotStart + 60 <= slotEnd) {
            const h = Math.floor(slotStart / 60);
            const m = slotStart % 60;
            const timeText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

            const slotStartObj = new Date(year, current.getMonth(), current.getDate(), h, m);
            const slotEndObj = new Date(slotStartObj.getTime() + 60 * 60 * 1000);

            const isBooked = events.some((e) => {
              const eStart = new Date(e.start);
              const eEnd = e.end ? new Date(e.end) : new Date(eStart.getTime() + 60 * 60 * 1000);
              return slotStartObj < eEnd && slotEndObj > eStart;
            });

            if (!isBooked) {
              timeSlots.push(timeText);
            }
            slotStart += 60; // 1 hr slot
          }
        }

        if (timeSlots.length > 0) {
          result.push({ date: dateStr, dayOfWeek, timeSlots });
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  }
}
