import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type GuestDto = {
  name: string;
  relation?: string;
  phone?: string;
  status?: string;
  side?: 'BRIDE' | 'GROOM' | 'SHARED';
  groupName?: string;
  adults?: number | string;
  children?: number | string;
  additionalEstimate?: number | string;
  dietaryNotes?: string;
  eventIds?: string[];
};

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  async listGuests(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);

    return this.prisma.guest.findMany({
      where: { weddingId },
      include: { eventInvitations: { include: { event: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addGuest(userId: string, weddingId: string, dto: GuestDto) {
    await this.ensureWedding(userId, weddingId);

    const guest = await this.prisma.guest.create({
      data: {
        weddingId,
        name: dto.name,
        relation: dto.relation,
        phone: dto.phone,
        status: dto.status || 'PENDING',
        side: dto.side || 'SHARED',
        groupName: dto.groupName,
        adults: this.toNonNegativeInt(dto.adults, 1),
        children: this.toNonNegativeInt(dto.children, 0),
        additionalEstimate: this.toNonNegativeInt(dto.additionalEstimate, 0),
        dietaryNotes: dto.dietaryNotes,
      },
    });

    for (const eventId of dto.eventIds || []) {
      await this.inviteGuestToEvent(userId, weddingId, guest.id, eventId, {});
    }

    return this.getGuest(userId, weddingId, guest.id);
  }

  async updateGuest(
    userId: string,
    weddingId: string,
    guestId: string,
    dto: Partial<GuestDto>,
  ) {
    await this.ensureGuest(userId, weddingId, guestId);

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        name: dto.name,
        relation: dto.relation,
        phone: dto.phone,
        status: dto.status,
        side: dto.side,
        groupName: dto.groupName,
        adults:
          dto.adults === undefined
            ? undefined
            : this.toNonNegativeInt(dto.adults, 0),
        children:
          dto.children === undefined
            ? undefined
            : this.toNonNegativeInt(dto.children, 0),
        additionalEstimate:
          dto.additionalEstimate === undefined
            ? undefined
            : this.toNonNegativeInt(dto.additionalEstimate, 0),
        dietaryNotes: dto.dietaryNotes,
      },
      include: { eventInvitations: { include: { event: true } } },
    });
  }

  async deleteGuest(userId: string, weddingId: string, guestId: string) {
    await this.ensureGuest(userId, weddingId, guestId);
    await this.prisma.guest.delete({ where: { id: guestId } });

    return { id: guestId, deleted: true };
  }

  async inviteGuestToEvent(
    userId: string,
    weddingId: string,
    guestId: string,
    eventId: string,
    dto: { notes?: string },
  ) {
    await this.ensureGuest(userId, weddingId, guestId);
    await this.ensureEvent(weddingId, eventId);

    return this.prisma.guestEventInvitation.upsert({
      where: { guestId_eventId: { guestId, eventId } },
      create: {
        guestId,
        eventId,
        rsvpStatus: 'INVITED',
        invitedAt: new Date(),
        notes: dto.notes,
      },
      update: {
        rsvpStatus: 'INVITED',
        invitedAt: new Date(),
        notes: dto.notes,
      },
      include: { guest: true, event: true },
    });
  }

  async updateRsvp(
    userId: string,
    weddingId: string,
    guestId: string,
    eventId: string,
    dto: {
      rsvpStatus: 'PENDING' | 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'MAYBE';
      notes?: string;
    },
  ) {
    await this.ensureGuest(userId, weddingId, guestId);
    await this.ensureEvent(weddingId, eventId);

    return this.prisma.guestEventInvitation.upsert({
      where: { guestId_eventId: { guestId, eventId } },
      create: {
        guestId,
        eventId,
        rsvpStatus: dto.rsvpStatus,
        respondedAt: this.isResponse(dto.rsvpStatus) ? new Date() : undefined,
        notes: dto.notes,
      },
      update: {
        rsvpStatus: dto.rsvpStatus,
        respondedAt: this.isResponse(dto.rsvpStatus) ? new Date() : undefined,
        notes: dto.notes,
      },
      include: { guest: true, event: true },
    });
  }

  async guestSummary(userId: string, weddingId: string, eventId?: string) {
    await this.ensureWedding(userId, weddingId);
    const guests = await this.prisma.guest.findMany({
      where: { weddingId },
      include: { eventInvitations: true },
    });

    return this.summarizeGuests(guests, eventId);
  }

  async cateringEstimate(userId: string, weddingId: string, dto: any) {
    const eventId = dto.eventId;
    const summary = await this.guestSummary(userId, weddingId, eventId);
    const acceptedOnly = dto.acceptedOnly !== false;
    const counts =
      acceptedOnly && eventId ? summary.acceptedCounts : summary.totalCounts;
    const additionalGuests = this.toNonNegativeInt(
      dto.additionalGuests,
      counts.additionalEstimate,
    );
    const adultRate = this.toNumber(dto.adultRate, 0);
    const childRate = this.toNumber(dto.childRate, adultRate * 0.6);
    const adultPortion = this.toNumber(dto.adultPortion, 1);
    const childPortion = this.toNumber(dto.childPortion, 0.6);
    const bufferPercent = this.toNumber(dto.bufferPercent, 10);

    const basePortions =
      counts.adults * adultPortion +
      counts.children * childPortion +
      additionalGuests * adultPortion;
    const recommendedPortions = Math.ceil(
      basePortions * (1 + bufferPercent / 100),
    );
    const expectedPeople = counts.adults + counts.children + additionalGuests;
    const plannedPlates = dto.plannedPlates
      ? this.toNonNegativeInt(dto.plannedPlates, recommendedPortions)
      : recommendedPortions;
    const costEstimate =
      counts.adults * adultRate +
      counts.children * childRate +
      additionalGuests * adultRate;

    const warnings: string[] = [];
    if (plannedPlates < Math.ceil(basePortions)) {
      warnings.push(
        'Shortage warning: planned plates are below expected portions.',
      );
    }
    if (plannedPlates > Math.ceil(basePortions * 1.25) || bufferPercent > 25) {
      warnings.push(
        'Waste warning: planned plates or buffer are unusually high.',
      );
    }

    return {
      eventId,
      counts,
      expectedPeople,
      basePortions,
      recommendedPortions,
      plannedPlates,
      costEstimate,
      perHeadEstimate: expectedPeople ? costEstimate / expectedPeople : 0,
      warnings,
    };
  }

  private async getGuest(userId: string, weddingId: string, guestId: string) {
    await this.ensureGuest(userId, weddingId, guestId);
    return this.prisma.guest.findUnique({
      where: { id: guestId },
      include: { eventInvitations: { include: { event: true } } },
    });
  }

  private async ensureWedding(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId, status: 'ACCEPTED', removedAt: null },
            },
          },
        ],
      },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    return wedding;
  }

  private async ensureGuest(
    userId: string,
    weddingId: string,
    guestId: string,
  ) {
    await this.ensureWedding(userId, weddingId);

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, weddingId },
    });
    if (!guest) {
      throw new NotFoundException('Guest not found');
    }

    return guest;
  }

  private async ensureEvent(weddingId: string, eventId: string) {
    const event = await this.prisma.weddingEvent.findFirst({
      where: { id: eventId, weddingId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private summarizeGuests(guests: any[], eventId?: string) {
    const relevantGuests = eventId
      ? guests.filter((guest) =>
          guest.eventInvitations?.some(
            (invitation: any) =>
              invitation.eventId === eventId &&
              invitation.rsvpStatus !== 'DECLINED',
          ),
        )
      : guests;
    const acceptedGuests = eventId
      ? guests.filter((guest) =>
          guest.eventInvitations?.some(
            (invitation: any) =>
              invitation.eventId === eventId &&
              invitation.rsvpStatus === 'ACCEPTED',
          ),
        )
      : relevantGuests;

    return {
      totalCounts: this.countGuests(relevantGuests),
      acceptedCounts: this.countGuests(acceptedGuests),
      bySide: this.groupBy(relevantGuests, 'side'),
      byGroup: this.groupBy(relevantGuests, 'groupName'),
      rsvp: this.rsvpCounts(guests, eventId),
    };
  }

  private countGuests(guests: any[]) {
    return guests.reduce(
      (summary, guest) => ({
        adults: summary.adults + Number(guest.adults || 0),
        children: summary.children + Number(guest.children || 0),
        additionalEstimate:
          summary.additionalEstimate + Number(guest.additionalEstimate || 0),
        households: summary.households + 1,
      }),
      { adults: 0, children: 0, additionalEstimate: 0, households: 0 },
    );
  }

  private groupBy(guests: any[], field: 'side' | 'groupName') {
    return guests.reduce(
      (groups, guest) => {
        const key = guest[field] || 'Ungrouped';
        groups[key] = this.countGuests([...(groups[key]?.guests || []), guest]);
        groups[key].guests = [...(groups[key].guests || []), guest];
        return groups;
      },
      {} as Record<string, any>,
    );
  }

  private rsvpCounts(guests: any[], eventId?: string) {
    const counts: Record<string, number> = {
      PENDING: 0,
      INVITED: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      MAYBE: 0,
    };
    for (const guest of guests) {
      for (const invitation of guest.eventInvitations || []) {
        if (!eventId || invitation.eventId === eventId) {
          counts[invitation.rsvpStatus] =
            (counts[invitation.rsvpStatus] || 0) + 1;
        }
      }
    }
    return counts;
  }

  private isResponse(status: string) {
    return ['ACCEPTED', 'DECLINED', 'MAYBE'].includes(status);
  }

  private toNonNegativeInt(value: unknown, fallback: number) {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(
        'Guest counts must be non-negative numbers',
      );
    }
    return Math.floor(parsed);
  }

  private toNumber(value: unknown, fallback: number) {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(
        'Estimator values must be non-negative numbers',
      );
    }
    return parsed;
  }
}
