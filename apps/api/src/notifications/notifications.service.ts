import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

type CollaborationThreadType =
  'BOOKING' | 'PROPOSAL' | 'DISPUTE' | 'SERVICE_REQUEST';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(dto: {
    recipientId: string;
    actorId?: string;
    type?: any;
    priority?: any;
    title: string;
    body?: string;
    actionUrl?: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    emailTo?: string;
    email?: boolean;
  }) {
    const recipient =
      dto.emailTo || dto.email === false
        ? null
        : await this.prisma.user.findUnique({
            where: { id: dto.recipientId },
            select: { email: true },
          });
    const emailTo = dto.emailTo || recipient?.email;
    const shouldEmail = dto.email !== false && Boolean(emailTo);
    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        actorId: dto.actorId,
        type: dto.type || 'GENERAL',
        priority: dto.priority || 'NORMAL',
        title: dto.title,
        body: dto.body,
        actionUrl: dto.actionUrl,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata,
        emailTo,
        emailStatus: shouldEmail
          ? process.env.RESEND_API_KEY
            ? 'QUEUED'
            : 'DEV_FALLBACK'
          : undefined,
        emailFallback: shouldEmail && !process.env.RESEND_API_KEY,
        deliveredAt: new Date(),
      },
    });
  }

  async createActivity(dto: {
    actorId?: string;
    weddingId?: string;
    bookingId?: string;
    type?: any;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }) {
    return this.prisma.activityEvent.create({
      data: {
        actorId: dto.actorId,
        weddingId: dto.weddingId,
        bookingId: dto.bookingId,
        type: dto.type || 'GENERAL',
        title: dto.title,
        body: dto.body,
        entityType: dto.entityType,
        entityId: dto.entityId,
        metadata: dto.metadata,
      },
    });
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      include: { actor: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string) {
    const [notifications, messages] = await Promise.all([
      this.prisma.notification.count({
        where: { recipientId: userId, readAt: null },
      }),
      this.unreadMessageCount(userId),
    ]);
    return { notifications, messages, total: notifications + messages };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, recipientId: userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: notification.readAt || new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    return this.unreadCount(userId);
  }

  async listThreads(userId: string) {
    return this.prisma.messageThread.findMany({
      where: { OR: [{ customerId: userId }, { vendor: { userId } }] },
      include: this.threadInclude(userId),
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createThread(userId: string, dto: any) {
    const context = await this.resolveThreadContext(userId, dto);
    const existing = await this.prisma.messageThread.findFirst({
      where: {
        customerId: context.customerId,
        vendorId: context.vendorId,
        bookingId: context.bookingId,
        proposalId: context.proposalId,
        disputeId: context.disputeId,
        serviceRequestId: context.serviceRequestId,
      },
    });
    if (existing) {
      return this.getThread(userId, existing.id);
    }

    const thread = await this.prisma.messageThread.create({
      data: {
        type: context.type,
        title: context.title,
        customerId: context.customerId,
        vendorId: context.vendorId,
        weddingId: context.weddingId,
        bookingId: context.bookingId,
        proposalId: context.proposalId,
        disputeId: context.disputeId,
        serviceRequestId: context.serviceRequestId,
        lastMessageAt: new Date(),
      },
    });

    await this.createSystemMessage(
      thread.id,
      `Conversation opened for ${context.title}.`,
      { entityType: context.entityType, entityId: context.entityId },
    );

    await this.createActivity({
      actorId: userId,
      weddingId: context.weddingId,
      bookingId: context.bookingId,
      type: 'MESSAGE',
      title: 'Message thread opened',
      body: context.title,
      entityType: 'MessageThread',
      entityId: thread.id,
    });

    return this.getThread(userId, thread.id);
  }

  async createBookingThread(userId: string, bookingId: string) {
    return this.createThread(userId, { bookingId });
  }

  async listMessages(userId: string, threadId: string) {
    await this.ensureThreadAccess(userId, threadId);
    await this.markThreadRead(userId, threadId);
    return this.prisma.message.findMany({
      where: { threadId },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, threadId: string, dto: any) {
    const thread = await this.ensureThreadAccess(userId, threadId);
    if (!dto.body?.trim()) {
      throw new BadRequestException('Message body is required');
    }

    const senderIsCustomer = thread.customerId === userId;
    const recipientId = senderIsCustomer
      ? thread.vendor?.userId
      : thread.customerId;
    const now = new Date();
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        body: dto.body.trim(),
        attachments: this.toStringArray(dto.attachments),
        customerReadAt: senderIsCustomer ? now : undefined,
        vendorReadAt: senderIsCustomer ? undefined : now,
      },
      include: {
        sender: { select: { id: true, fullName: true, email: true } },
      },
    });

    await this.prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: now },
    });

    if (recipientId) {
      await this.createNotification({
        recipientId,
        actorId: userId,
        type: 'MESSAGE',
        title: 'New message',
        body: dto.body.trim(),
        actionUrl: senderIsCustomer ? '/vendor/messages' : '/customer/messages',
        entityType: 'MessageThread',
        entityId: threadId,
      });
    }

    await this.createActivity({
      actorId: userId,
      weddingId: thread.weddingId || undefined,
      bookingId: thread.bookingId || undefined,
      type: 'MESSAGE',
      title: 'Message sent',
      body: dto.body.trim(),
      entityType: 'Message',
      entityId: message.id,
    });

    return message;
  }

  async createSystemMessage(threadId: string, body: string, metadata?: any) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { vendor: true },
    });
    if (!thread) {
      throw new NotFoundException('Message thread not found');
    }
    const now = new Date();
    const message = await this.prisma.message.create({
      data: {
        threadId,
        senderId: thread.customerId,
        body,
        attachments: [],
        isSystem: true,
        metadata,
        customerReadAt: now,
      },
    });
    await this.prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: now },
    });
    return message;
  }

  async createSystemMessageForUser(
    userId: string,
    threadId: string,
    body: string,
    metadata?: any,
  ) {
    await this.ensureThreadAccess(userId, threadId);
    return this.createSystemMessage(threadId, body, metadata);
  }

  async sendWorkflowNotification(dto: {
    recipientId: string;
    actorId?: string;
    type:
      | 'PROPOSAL_UPDATE'
      | 'BOOKING_UPDATE'
      | 'PAYMENT_UPDATE'
      | 'TASK_REMINDER'
      | 'SYSTEM';
    title: string;
    body?: string;
    actionUrl?: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    priority?: any;
  }) {
    return this.createNotification({ ...dto, email: true });
  }

  async markThreadRead(userId: string, threadId: string) {
    const thread = await this.ensureThreadAccess(userId, threadId);
    const senderIsCustomer = thread.customerId === userId;
    await this.prisma.message.updateMany({
      where: { threadId, senderId: { not: userId } },
      data: senderIsCustomer
        ? { customerReadAt: new Date() }
        : { vendorReadAt: new Date() },
    });
    return { threadId, read: true };
  }

  async listWeddingActivity(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: { id: weddingId, ownerId: userId },
    });
    if (!wedding) {
      throw new NotFoundException('Wedding not found');
    }

    return this.prisma.activityEvent.findMany({
      where: { weddingId },
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async listBookingActivity(userId: string, bookingId: string) {
    await this.ensureBookingAccess(userId, bookingId);
    return this.prisma.activityEvent.findMany({
      where: { bookingId },
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async getThread(userId: string, threadId: string) {
    await this.ensureThreadAccess(userId, threadId);
    return this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: this.threadInclude(userId),
    });
  }

  private async ensureThreadAccess(userId: string, threadId: string) {
    const thread = await this.prisma.messageThread.findFirst({
      where: {
        id: threadId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
      include: { vendor: true, customer: true },
    });
    if (!thread) {
      throw new NotFoundException('Message thread not found');
    }
    return thread;
  }

  private async resolveThreadContext(
    userId: string,
    dto: any,
  ): Promise<{
    type: CollaborationThreadType;
    title: string;
    customerId: string;
    vendorId?: string;
    weddingId?: string;
    bookingId?: string;
    proposalId?: string;
    disputeId?: string;
    serviceRequestId?: string;
    entityType: string;
    entityId: string;
  }> {
    if (dto.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: dto.bookingId,
          OR: [{ customerId: userId }, { vendor: { userId } }],
        },
        include: { vendor: true, serviceRequest: true },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      return {
        type: 'BOOKING',
        title: booking.title,
        customerId: booking.customerId,
        vendorId: booking.vendorId,
        weddingId: booking.weddingId,
        bookingId: booking.id,
        serviceRequestId: booking.serviceRequestId,
        entityType: 'Booking',
        entityId: booking.id,
      };
    }

    if (dto.proposalId) {
      const proposal = await this.prisma.proposal.findFirst({
        where: {
          id: dto.proposalId,
          OR: [
            { serviceRequest: { customerId: userId } },
            { vendor: { userId } },
          ],
        },
        include: { vendor: true, serviceRequest: true },
      });
      if (!proposal) throw new NotFoundException('Proposal not found');
      return {
        type: 'PROPOSAL',
        title: `Proposal conversation - ${proposal.serviceRequest.title}`,
        customerId: proposal.serviceRequest.customerId,
        vendorId: proposal.vendorId,
        weddingId: proposal.serviceRequest.weddingId,
        proposalId: proposal.id,
        serviceRequestId: proposal.serviceRequestId,
        entityType: 'Proposal',
        entityId: proposal.id,
      };
    }

    if (dto.disputeId) {
      const dispute = await this.prisma.bookingDispute.findFirst({
        where: {
          id: dto.disputeId,
          OR: [{ customerId: userId }, { vendor: { userId } }],
        },
        include: { booking: true, vendor: true },
      });
      if (!dispute) throw new NotFoundException('Dispute not found');
      return {
        type: 'DISPUTE',
        title: `Dispute conversation - ${dispute.reason}`,
        customerId: dispute.customerId,
        vendorId: dispute.vendorId,
        weddingId: dispute.booking.weddingId,
        bookingId: dispute.bookingId,
        disputeId: dispute.id,
        entityType: 'BookingDispute',
        entityId: dispute.id,
      };
    }

    if (dto.serviceRequestId) {
      const request = await this.prisma.serviceRequest.findFirst({
        where: {
          id: dto.serviceRequestId,
          OR: [
            { customerId: userId },
            {
              proposals: {
                some: { vendor: { userId } },
              },
            },
            {
              invitations: {
                some: { vendor: { userId } },
              },
            },
          ],
        },
        include: {
          proposals: { include: { vendor: true }, take: 1 },
          invitations: { include: { vendor: true }, take: 1 },
        },
      });
      if (!request) throw new NotFoundException('Service request not found');
      const vendorId =
        dto.vendorId ||
        request.proposals?.[0]?.vendorId ||
        request.invitations?.[0]?.vendorId;
      return {
        type: 'SERVICE_REQUEST',
        title: `Request conversation - ${request.title}`,
        customerId: request.customerId,
        vendorId,
        weddingId: request.weddingId,
        serviceRequestId: request.id,
        entityType: 'ServiceRequest',
        entityId: request.id,
      };
    }

    throw new BadRequestException(
      'A request, proposal, booking, or dispute is required',
    );
  }

  private async ensureBookingAccess(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ customerId: userId }, { vendor: { userId } }],
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private async unreadMessageCount(userId: string) {
    const threads = await this.prisma.messageThread.findMany({
      where: { OR: [{ customerId: userId }, { vendor: { userId } }] },
      include: { vendor: true },
    });

    const counts = await Promise.all(
      threads.map((thread) => {
        const userIsCustomer = thread.customerId === userId;
        return this.prisma.message.count({
          where: {
            threadId: thread.id,
            senderId: { not: userId },
            customerReadAt: userIsCustomer ? null : undefined,
            vendorReadAt: userIsCustomer ? undefined : null,
          },
        });
      }),
    );

    return counts.reduce((sum, count) => sum + count, 0);
  }

  private threadInclude(userId: string) {
    return {
      customer: { select: { id: true, fullName: true, email: true } },
      vendor: {
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      },
      booking: true,
      proposal: true,
      dispute: true,
      messages: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
            },
          },
        },
      },
    };
  }

  private toStringArray(value: unknown) {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string')
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return [];
  }
}
