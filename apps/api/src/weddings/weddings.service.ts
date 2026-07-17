import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { CreateWeddingEventDto } from './dto/create-event.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';

@Injectable()
export class WeddingsService {
  constructor(private prisma: PrismaService) {}

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

  private async ensureWeddingOwner(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: { id: weddingId, ownerId: userId },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    return wedding;
  }

  async createWedding(userId: string, dto: CreateWeddingDto) {
    const wedding = await this.prisma.wedding.create({
      data: {
        title: dto.title,
        brideName: dto.brideName,
        groomName: dto.groomName,
        city: dto.city,
        estimatedBudget: dto.estimatedBudget,
        estimatedGuestCount: dto.estimatedGuestCount,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        mainCoordinator: dto.mainCoordinator,
        notes: dto.notes,
        status: (dto.status as any) || 'DRAFT',
        ownerId: userId,
      },
    });

    await this.prisma.weddingMember.create({
      data: {
        weddingId: wedding.id,
        userId,
        email:
          (await this.prisma.user.findUnique({ where: { id: userId } }))
            ?.email || 'owner@local',
        role: 'WEDDING_OWNER',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return wedding;
  }

  async listWeddings(userId: string) {
    return this.prisma.wedding.findMany({
      where: {
        status: { not: 'ARCHIVED' },
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId, status: 'ACCEPTED', removedAt: null },
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWedding(userId: string, weddingId: string) {
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
      include: { events: { orderBy: { date: 'asc' } }, members: true },
    });

    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    return wedding;
  }

  async getDashboard(userId: string, weddingId: string) {
    const wedding = await this.ensureWedding(userId, weddingId);
    const [events, guests, budgetItems, tasks, members] = await Promise.all([
      this.prisma.weddingEvent.findMany({
        where: { weddingId },
        orderBy: { date: 'asc' },
      }),
      this.prisma.guest.findMany({ where: { weddingId } }),
      this.prisma.budgetItem.findMany({ where: { weddingId } }),
      this.prisma.weddingTask.findMany({ where: { weddingId } }),
      this.prisma.weddingMember.findMany({
        where: { weddingId, status: { not: 'REMOVED' } },
      }),
    ]);

    const plannedBudget = Number(wedding.estimatedBudget || 0);
    const committedAmount = budgetItems.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
    const paidAmount = budgetItems
      .filter((item) => item.isPaid)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const completedTasks = tasks.filter(
      (task) => task.status === 'COMPLETED' || task.isCompleted,
    ).length;
    const overdueTasks = tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate < new Date() &&
        task.status !== 'COMPLETED',
    ).length;
    const blockedTasks = tasks.filter(
      (task) => task.status === 'BLOCKED',
    ).length;
    const pendingApprovals = tasks.filter(
      (task) => task.approvalStatus === 'PENDING',
    ).length;

    return {
      wedding,
      countdownDays: wedding.startDate
        ? Math.max(
            0,
            Math.ceil((wedding.startDate.getTime() - Date.now()) / 86400000),
          )
        : null,
      progress: tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0,
      plannedBudget,
      committedAmount,
      paidAmount,
      outstandingAmount: committedAmount - paidAmount,
      remainingBudget: plannedBudget ? plannedBudget - committedAmount : 0,
      confirmedVendors: 0,
      pendingProposals: 0,
      upcomingTasks: tasks
        .filter((task) => task.status !== 'COMPLETED')
        .slice(0, 5),
      overdueTasks,
      blockedTasks,
      pendingApprovals,
      upcomingPayments: budgetItems
        .filter((item) => !item.isPaid && item.dueDate)
        .slice(0, 5),
      eventSchedule: events,
      weddingDayAlerts:
        overdueTasks || blockedTasks ? ['Planning risks need attention'] : [],
      counts: {
        events: events.length,
        guests: guests.length,
        confirmedGuests: guests.filter((guest) => guest.status === 'CONFIRMED')
          .length,
        tasks: tasks.length,
        members: members.length,
      },
    };
  }

  async updateWedding(
    userId: string,
    weddingId: string,
    dto: Partial<CreateWeddingDto>,
  ) {
    await this.ensureWeddingOwner(userId, weddingId);

    return this.prisma.wedding.update({
      where: { id: weddingId },
      data: {
        title: dto.title,
        brideName: dto.brideName,
        groomName: dto.groomName,
        city: dto.city,
        estimatedBudget: dto.estimatedBudget,
        estimatedGuestCount: dto.estimatedGuestCount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        mainCoordinator: dto.mainCoordinator,
        notes: dto.notes,
        status: dto.status as any,
      },
    });
  }

  async archiveWedding(userId: string, weddingId: string) {
    await this.ensureWeddingOwner(userId, weddingId);
    return this.prisma.wedding.update({
      where: { id: weddingId },
      data: { status: 'ARCHIVED' },
    });
  }

  async addEvent(
    userId: string,
    weddingId: string,
    dto: CreateWeddingEventDto,
  ) {
    await this.ensureWeddingOwner(userId, weddingId);

    return this.prisma.weddingEvent.create({
      data: {
        weddingId,
        name: dto.name,
        eventType: dto.eventType,
        date: dto.date ? new Date(dto.date) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue,
        city: dto.city,
        guestCount: dto.guestCount,
        eventBudget: dto.eventBudget,
        dressCode: dto.dressCode,
        notes: dto.notes,
        assignedCoordinator: dto.assignedCoordinator,
      },
    });
  }

  async listEvents(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);
    return this.prisma.weddingEvent.findMany({
      where: { weddingId },
      orderBy: { date: 'asc' },
    });
  }

  async getEvent(userId: string, eventId: string) {
    const event = await this.prisma.weddingEvent.findFirst({
      where: {
        id: eventId,
        wedding: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId, status: 'ACCEPTED', removedAt: null },
              },
            },
          ],
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(
    userId: string,
    eventId: string,
    dto: Partial<CreateWeddingEventDto>,
  ) {
    const event = await this.prisma.weddingEvent.findFirst({
      where: { id: eventId, wedding: { ownerId: userId } },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.weddingEvent.update({
      where: { id: eventId },
      data: {
        name: dto.name,
        eventType: dto.eventType,
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue,
        city: dto.city,
        guestCount: dto.guestCount,
        eventBudget: dto.eventBudget,
        dressCode: dto.dressCode,
        notes: dto.notes,
        assignedCoordinator: dto.assignedCoordinator,
      },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.weddingEvent.findFirst({
      where: { id: eventId, wedding: { ownerId: userId } },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    await this.prisma.weddingEvent.delete({ where: { id: eventId } });

    return { id: eventId, deleted: true };
  }

  async addMember(userId: string, weddingId: string, dto: CreateMemberDto) {
    await this.ensureWeddingOwner(userId, weddingId);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    return this.prisma.weddingMember.upsert({
      where: { weddingId_email: { weddingId, email: dto.email } },
      create: {
        weddingId,
        userId: user?.id,
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role,
        status: user ? 'ACCEPTED' : 'INVITED',
        acceptedAt: user ? new Date() : undefined,
      },
      update: {
        userId: user?.id,
        fullName: dto.fullName,
        role: dto.role,
        status: user ? 'ACCEPTED' : 'INVITED',
        removedAt: null,
      },
    });
  }

  async listMembers(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);
    return this.prisma.weddingMember.findMany({
      where: { weddingId, status: { not: 'REMOVED' } },
      orderBy: { invitedAt: 'asc' },
    });
  }

  async updateMember(
    userId: string,
    weddingId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ) {
    await this.ensureWeddingOwner(userId, weddingId);
    const member = await this.prisma.weddingMember.findFirst({
      where: { id: memberId, weddingId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.weddingMember.update({
      where: { id: memberId },
      data: {
        fullName: dto.fullName,
        role: dto.role,
        status: dto.status as any,
      },
    });
  }

  async removeMember(userId: string, weddingId: string, memberId: string) {
    await this.ensureWeddingOwner(userId, weddingId);
    const member = await this.prisma.weddingMember.findFirst({
      where: { id: memberId, weddingId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.weddingMember.update({
      where: { id: memberId },
      data: { status: 'REMOVED', removedAt: new Date() },
    });
  }
}
