import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const ACTIVE_OVERDUE_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'AWAITING_INFORMATION',
];

const VALID_TASK_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'AWAITING_INFORMATION',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
];

const TASK_TEMPLATES = [
  {
    phase: 'Initial planning',
    title: 'Finalize wedding scope',
    category: 'Planning',
    offset: 180,
    priority: 'CRITICAL',
    role: 'WEDDING_OWNER',
    why: 'A clear wedding scope prevents budget drift and last-minute confusion.',
    instructions: [
      'Confirm event list',
      'Set expected guest count',
      'Confirm city and date range',
      'Write the first planning notes',
    ],
    evidence: [],
    criteria: 'Wedding events, budget, and guest estimate are recorded.',
    approval: false,
  },
  {
    phase: 'Budget preparation',
    title: 'Prepare master budget',
    category: 'Budget',
    offset: 170,
    priority: 'CRITICAL',
    role: 'BUDGET_MANAGER',
    why: 'The budget decides which vendors, packages, and event choices are realistic.',
    instructions: [
      'List major cost categories',
      'Set category limits',
      'Add expected payment dates',
      'Share budget with the wedding owner',
    ],
    evidence: ['Budget sheet'],
    criteria: 'Budget items are entered and reviewed.',
    approval: true,
  },
  {
    phase: 'Guest-list preparation',
    title: 'Finalize guest estimate',
    category: 'Guests',
    offset: 150,
    priority: 'HIGH',
    role: 'GUEST_MANAGER',
    why: 'Guest count affects venue size, catering count, transport, and invitations.',
    instructions: [
      'Collect bride-side list',
      'Collect groom-side list',
      'Remove duplicates',
      'Mark invite priority',
    ],
    evidence: ['Guest list file'],
    criteria: 'Guest estimate is approved by the wedding owner.',
    approval: true,
  },
  {
    phase: 'Vendor discovery',
    title: 'Shortlist venue options',
    category: 'Vendors',
    offset: 140,
    priority: 'CRITICAL',
    role: 'VENDOR_COORDINATOR',
    why: 'Venue availability is often the first major constraint for desi weddings.',
    instructions: [
      'Find at least three venues',
      'Check date availability',
      'Compare capacity and location',
      'Upload quotations',
    ],
    evidence: ['Venue quotation'],
    criteria: 'At least three comparable venue options are documented.',
    approval: true,
  },
  {
    phase: 'Vendor comparison',
    title: 'Compare catering proposals',
    category: 'Catering',
    offset: 110,
    priority: 'HIGH',
    role: 'CATERING_COORDINATOR',
    why: 'Catering is guest-sensitive and usually one of the largest wedding costs.',
    instructions: [
      'Confirm estimated guest count',
      'Review at least three proposals',
      'Compare per-head price',
      'Check menu items',
      'Confirm staff and crockery',
      'Check taxes and additional charges',
      'Confirm tasting date',
      'Review cancellation terms',
      'Upload final quotation',
      'Submit selected caterer for approval',
    ],
    evidence: ['Final quotation'],
    criteria: 'Selected caterer is affordable and approved.',
    approval: true,
  },
  {
    phase: 'Outfit and shopping preparation',
    title: 'Track family shopping responsibilities',
    category: 'Shopping',
    offset: 90,
    priority: 'MEDIUM',
    role: 'SHOPPING_COORDINATOR',
    why: 'Shopping tasks often involve many family members and need early coordination.',
    instructions: [
      'List required outfits',
      'Assign buyers',
      'Set trial dates',
      'Record deposits and delivery dates',
    ],
    evidence: ['Receipt'],
    criteria: 'Shopping responsibilities and dates are visible to the family.',
    approval: false,
  },
  {
    phase: 'Invitation planning',
    title: 'Send invitations and track RSVPs',
    category: 'Guests',
    offset: 60,
    priority: 'HIGH',
    role: 'GUEST_MANAGER',
    why: 'Timely RSVPs keep catering and seating estimates accurate.',
    instructions: [
      'Prepare invitation message',
      'Send invitations',
      'Follow up no-response guests',
      'Update RSVP status',
    ],
    evidence: ['Invitation screenshot'],
    criteria: 'All priority guests are invited and tracked.',
    approval: false,
  },
  {
    phase: 'Final confirmations',
    title: 'Confirm vendor arrival plans',
    category: 'Operations',
    offset: 14,
    priority: 'CRITICAL',
    role: 'EVENT_DAY_COORDINATOR',
    why: 'Wedding-day execution depends on vendors arriving and setting up on time.',
    instructions: [
      'Confirm arrival time',
      'Confirm venue entrance',
      'Assign contact person',
      'Record backup contact',
      'Share final schedule',
    ],
    evidence: ['Vendor confirmation'],
    criteria: 'Every confirmed vendor has a documented arrival plan.',
    approval: false,
  },
  {
    phase: 'Wedding-week preparation',
    title: 'Run final family coordination meeting',
    category: 'Family coordination',
    offset: 7,
    priority: 'HIGH',
    role: 'WEDDING_OWNER',
    why: 'A final coordination meeting catches gaps before the wedding week becomes chaotic.',
    instructions: [
      'Review open tasks',
      'Resolve blockers',
      'Confirm event-day owners',
      'Share emergency contacts',
    ],
    evidence: [],
    criteria: 'Open critical tasks are either completed or reassigned.',
    approval: false,
  },
  {
    phase: 'Post-event completion',
    title: 'Collect receipts and close payments',
    category: 'Payments',
    offset: -7,
    priority: 'MEDIUM',
    role: 'BUDGET_MANAGER',
    why: 'Post-event closure keeps disputes, balances, and vendor reviews grounded in records.',
    instructions: [
      'Collect final receipts',
      'Record remaining payments',
      'Mark paid budget items',
      'Flag disputed charges',
    ],
    evidence: ['Receipt'],
    criteria: 'Payments and outstanding balances are recorded.',
    approval: true,
  },
];

@Injectable()
export class TasksService {
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

  private async ensureTask(userId: string, taskId: string) {
    const task = await this.prisma.weddingTask.findFirst({
      where: {
        id: taskId,
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
      include: {
        evidence: true,
        dependentTasks: { include: { dependsOnTask: true } },
        blockers: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async generatePlan(userId: string, weddingId: string) {
    const wedding = await this.ensureWedding(userId, weddingId);
    const events = await this.prisma.weddingEvent.findMany({
      where: { weddingId },
      orderBy: { date: 'asc' },
    });
    const plan = await this.prisma.weddingPlan.upsert({
      where: { weddingId },
      create: {
        weddingId,
        summary: {
          generatedFrom: 'rule-based-template',
          templateCount: TASK_TEMPLATES.length,
          eventCount: events.length,
        },
      },
      update: {
        generatedAt: new Date(),
        summary: {
          generatedFrom: 'rule-based-template',
          templateCount: TASK_TEMPLATES.length,
          eventCount: events.length,
        },
      },
    });

    await this.ensurePlanningTemplates();

    const anchorDate = wedding.startDate || this.daysFromNow(120);
    const createdTasks = [];

    for (const template of TASK_TEMPLATES) {
      const existing = await this.prisma.weddingTask.findFirst({
        where: { weddingId, title: template.title },
      });
      if (existing) {
        continue;
      }

      const dueDate = this.offsetFrom(anchorDate, template.offset);
      const task = await this.prisma.weddingTask.create({
        data: {
          weddingId,
          title: template.title,
          description: `${template.phase}: ${template.criteria}`,
          whyImportant: template.why,
          instructions: template.instructions,
          category: template.category,
          assignedRole: template.role as any,
          startDate: this.offsetFrom(dueDate, 7),
          dueDate,
          priority: template.priority as any,
          status: 'NOT_STARTED',
          requiredEvidence: template.evidence,
          completionCriteria: template.criteria,
          requiresApproval: template.approval,
          approvalStatus: 'NOT_REQUIRED',
          isCompleted: false,
        },
      });

      await this.createStepsAndReminders(
        task.id,
        template.instructions,
        dueDate,
      );
      createdTasks.push(task);
    }

    for (const event of events) {
      const title = `Prepare ${event.name} event-day checklist`;
      const existing = await this.prisma.weddingTask.findFirst({
        where: { weddingId, eventId: event.id, title },
      });
      if (existing) {
        continue;
      }

      const dueDate = event.date
        ? this.offsetFrom(event.date, 3)
        : this.offsetFrom(anchorDate, 10);
      const task = await this.prisma.weddingTask.create({
        data: {
          weddingId,
          eventId: event.id,
          title,
          description: `Confirm event-day details for ${event.name}.`,
          whyImportant:
            'Each event has its own venue, guest count, timing, and coordinator needs.',
          instructions: [
            'Confirm venue access',
            'Confirm coordinator contact',
            'Confirm vendor setup timing',
            'Share final schedule',
          ],
          category: 'Event operations',
          assignedRole: 'EVENT_DAY_COORDINATOR',
          startDate: this.offsetFrom(dueDate, 7),
          dueDate,
          priority: 'HIGH',
          status: 'NOT_STARTED',
          completionCriteria:
            'Event-day plan is ready and visible to the assigned coordinator.',
        },
      });
      await this.createStepsAndReminders(
        task.id,
        [
          'Confirm venue access',
          'Confirm coordinator contact',
          'Confirm vendor setup timing',
          'Share final schedule',
        ],
        dueDate,
      );
      createdTasks.push(task);
    }

    await this.createDefaultDependencies(weddingId);

    return {
      plan,
      createdTasks,
      totalTasks: await this.prisma.weddingTask.count({ where: { weddingId } }),
    };
  }

  async getPlan(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);
    await this.markOverdueTasks(weddingId);
    const [plan, tasks] = await Promise.all([
      this.prisma.weddingPlan.findUnique({ where: { weddingId } }),
      this.listTasks(userId, weddingId),
    ]);

    return {
      plan,
      phases: this.groupBy(tasks, (task: any) => task.category || 'Planning'),
      tasks,
    };
  }

  async getProgress(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);
    await this.markOverdueTasks(weddingId);
    const tasks = await this.prisma.weddingTask.findMany({
      where: { weddingId },
      include: {
        assignments: true,
        blockers: true,
        event: true,
        assignedUser: true,
      },
    });

    return this.calculateProgress(tasks);
  }

  private calculateProgress(tasks: any[]) {
    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === 'COMPLETED' || task.isCompleted,
    ).length;
    const overdue = tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate < new Date() &&
        task.status !== 'COMPLETED',
    ).length;
    const blocked = tasks.filter(
      (task) =>
        task.status === 'BLOCKED' ||
        task.blockers.some(
          (blocker: { status: string }) => blocker.status !== 'RESOLVED',
        ),
    ).length;
    const pendingApprovals = tasks.filter(
      (task) => task.approvalStatus === 'PENDING',
    ).length;

    return {
      overall: total ? Math.round((completed / total) * 100) : 0,
      total,
      completed,
      overdue,
      blocked,
      pendingApprovals,
      byCategory: this.progressBy(
        tasks,
        (task: any) => task.category || 'Planning',
      ),
      byEvent: this.progressBy(
        tasks,
        (task: any) => task.event?.name || 'General planning',
      ),
      byFamilyRole: this.progressBy(
        tasks,
        (task: any) => task.assignedRole || 'UNASSIGNED',
      ),
      byMember: this.progressBy(tasks, (task: any) =>
        this.memberProgressKey(task),
      ),
      overdueTaskPercentage: total ? Math.round((overdue / total) * 100) : 0,
    };
  }

  async listTasks(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);
    await this.markOverdueTasks(weddingId);
    return this.prisma.weddingTask.findMany({
      where: { weddingId },
      include: {
        event: true,
        steps: { orderBy: { sortOrder: 'asc' } },
        evidence: true,
        comments: { orderBy: { createdAt: 'desc' } },
        blockers: { orderBy: { createdAt: 'desc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
        reminders: { orderBy: { remindAt: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        assignments: { orderBy: { assignedAt: 'desc' } },
        assignedUser: { select: { id: true, fullName: true, email: true } },
        dependentTasks: { include: { dependsOnTask: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addTask(userId: string, weddingId: string, dto: any) {
    await this.ensureWedding(userId, weddingId);
    const status = this.normalizeStatus(dto.status);
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    const instructions = Array.isArray(dto.instructions)
      ? dto.instructions
      : [];

    const task = await this.prisma.weddingTask.create({
      data: {
        weddingId,
        eventId: dto.eventId,
        title: dto.title,
        description: dto.description,
        whyImportant: dto.whyImportant,
        instructions,
        category: dto.category,
        assignedUserId: dto.assignedUserId,
        assignedRole: dto.assignedRole,
        assignee: dto.assignee,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate,
        priority: dto.priority || 'MEDIUM',
        status: status as any,
        requiredEvidence: Array.isArray(dto.requiredEvidence)
          ? dto.requiredEvidence
          : [],
        completionCriteria: dto.completionCriteria,
        requiresApproval: dto.requiresApproval ?? false,
        approvalStatus: 'NOT_REQUIRED',
        isCompleted: status === 'COMPLETED',
      },
    });

    await this.createStepsAndReminders(task.id, instructions, dueDate);
    if (Array.isArray(dto.dependsOnTaskIds)) {
      await this.prisma.taskDependency.createMany({
        data: dto.dependsOnTaskIds.map((dependsOnTaskId: string) => ({
          taskId: task.id,
          dependsOnTaskId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getTask(userId, task.id);
  }

  async getTask(userId: string, taskId: string) {
    await this.ensureTask(userId, taskId);
    return this.prisma.weddingTask.findUnique({
      where: { id: taskId },
      include: {
        event: true,
        steps: { orderBy: { sortOrder: 'asc' } },
        evidence: true,
        comments: { orderBy: { createdAt: 'desc' } },
        approvals: true,
        reminders: true,
        blockers: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        assignments: { orderBy: { assignedAt: 'desc' } },
        assignedUser: { select: { id: true, fullName: true, email: true } },
        dependentTasks: { include: { dependsOnTask: true } },
      },
    });
  }

  async updateTask(userId: string, taskId: string, dto: any) {
    const task = await this.ensureTask(userId, taskId);
    const nextStatus = dto.status
      ? this.normalizeStatus(dto.status)
      : undefined;

    const updated = await this.prisma.weddingTask.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        whyImportant: dto.whyImportant,
        instructions: Array.isArray(dto.instructions)
          ? dto.instructions
          : undefined,
        category: dto.category,
        assignedUserId: dto.assignedUserId,
        assignedRole: dto.assignedRole,
        assignee: dto.assignee,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        status: nextStatus as any,
        requiredEvidence: Array.isArray(dto.requiredEvidence)
          ? dto.requiredEvidence
          : undefined,
        completionCriteria: dto.completionCriteria,
        requiresApproval: dto.requiresApproval,
        approvalStatus: dto.approvalStatus,
        isCompleted:
          dto.isCompleted ??
          (nextStatus ? nextStatus === 'COMPLETED' : undefined),
      },
    });

    if (nextStatus && nextStatus !== task.status) {
      await this.recordStatus(taskId, task.status, nextStatus, userId);
    }

    return updated;
  }

  async assignTask(userId: string, taskId: string, dto: any) {
    const task = await this.ensureTask(userId, taskId);
    if (dto.userId) {
      await this.ensureWeddingMember(task.weddingId, dto.userId);
    }

    const updated = await this.prisma.weddingTask.update({
      where: { id: taskId },
      data: {
        assignedUserId: dto.userId,
        assignedRole: dto.role,
        assignee: dto.assigneeName,
      },
    });

    await this.prisma.taskAssignment.create({
      data: {
        taskId,
        userId: dto.userId,
        role: dto.role,
        assigneeName: dto.assigneeName,
      },
    });

    return updated;
  }

  async changeStatus(userId: string, taskId: string, status: string) {
    const task = await this.ensureTask(userId, taskId);
    const nextStatus = this.normalizeStatus(status);
    if (!VALID_TASK_STATUSES.includes(nextStatus)) {
      throw new BadRequestException('Invalid task status');
    }

    await this.recordStatus(taskId, task.status, nextStatus, userId);

    return this.prisma.weddingTask.update({
      where: { id: taskId },
      data: {
        status: nextStatus as any,
        isCompleted: nextStatus === 'COMPLETED',
        approvalStatus:
          nextStatus === 'COMPLETED' && !task.requiresApproval
            ? 'NOT_REQUIRED'
            : undefined,
      },
    });
  }

  async completeTask(userId: string, taskId: string) {
    const task = await this.ensureTask(userId, taskId);
    const incompleteDependencies = task.dependentTasks.filter(
      (dependency) => dependency.dependsOnTask.status !== 'COMPLETED',
    );
    if (incompleteDependencies.length) {
      throw new BadRequestException('Complete dependent tasks first');
    }

    if (task.requiredEvidence.length > 0 && task.evidence.length === 0) {
      throw new BadRequestException(
        'Evidence is required before completing this task',
      );
    }

    if (task.requiresApproval && task.approvalStatus !== 'APPROVED') {
      await this.prisma.taskApproval.create({
        data: {
          taskId,
          reviewerId: userId,
          status: 'PENDING',
          comment: 'Submitted for approval',
        },
      });
      await this.recordStatus(taskId, task.status, 'AWAITING_APPROVAL', userId);
      return this.prisma.weddingTask.update({
        where: { id: taskId },
        data: { status: 'AWAITING_APPROVAL', approvalStatus: 'PENDING' },
      });
    }

    await this.recordStatus(taskId, task.status, 'COMPLETED', userId);
    return this.prisma.weddingTask.update({
      where: { id: taskId },
      data: { status: 'COMPLETED', isCompleted: true },
    });
  }

  async addEvidence(userId: string, taskId: string, dto: any) {
    await this.ensureTask(userId, taskId);
    return this.prisma.taskEvidence.create({
      data: {
        taskId,
        uploadedById: userId,
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        notes: dto.notes,
      },
    });
  }

  async addComment(userId: string, taskId: string, dto: any) {
    await this.ensureTask(userId, taskId);
    return this.prisma.taskComment.create({
      data: {
        taskId,
        authorId: userId,
        comment: dto.comment,
      },
    });
  }

  async addBlocker(userId: string, taskId: string, dto: any) {
    const task = await this.ensureTask(userId, taskId);
    const blocker = await this.prisma.taskBlocker.create({
      data: {
        taskId,
        blockerType: dto.blockerType || 'GENERAL',
        reason: dto.reason,
        description: dto.description,
        responsiblePerson: dto.responsiblePerson,
        expectedResolutionDate: dto.expectedResolutionDate
          ? new Date(dto.expectedResolutionDate)
          : undefined,
      },
    });

    await this.recordStatus(taskId, task.status, 'BLOCKED', userId);
    await this.prisma.weddingTask.update({
      where: { id: taskId },
      data: { status: 'BLOCKED' },
    });

    return blocker;
  }

  async approveTask(userId: string, taskId: string, comment?: string) {
    const task = await this.ensureTask(userId, taskId);
    await this.ensureTaskApprover(userId, task.weddingId);
    if (!task.requiresApproval || task.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Task is not awaiting approval');
    }

    await this.prisma.taskApproval.create({
      data: {
        taskId,
        reviewerId: userId,
        status: 'APPROVED',
        comment,
        decidedAt: new Date(),
      },
    });
    await this.recordStatus(taskId, task.status, 'COMPLETED', userId);

    return this.prisma.weddingTask.update({
      where: { id: taskId },
      data: {
        approvalStatus: 'APPROVED',
        status: 'COMPLETED',
        isCompleted: true,
      },
    });
  }

  async rejectTask(userId: string, taskId: string, comment?: string) {
    const task = await this.ensureTask(userId, taskId);
    await this.ensureTaskApprover(userId, task.weddingId);
    if (!task.requiresApproval || task.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Task is not awaiting approval');
    }

    await this.prisma.taskApproval.create({
      data: {
        taskId,
        reviewerId: userId,
        status: 'REJECTED',
        comment,
        decidedAt: new Date(),
      },
    });
    await this.recordStatus(taskId, task.status, 'IN_PROGRESS', userId);

    return this.prisma.weddingTask.update({
      where: { id: taskId },
      data: {
        approvalStatus: 'REJECTED',
        status: 'IN_PROGRESS',
        isCompleted: false,
      },
    });
  }

  async deleteTask(userId: string, taskId: string) {
    await this.ensureTask(userId, taskId);
    await this.prisma.$transaction([
      this.prisma.taskDependency.deleteMany({
        where: { OR: [{ taskId }, { dependsOnTaskId: taskId }] },
      }),
      this.prisma.taskStep.deleteMany({ where: { taskId } }),
      this.prisma.taskAssignment.deleteMany({ where: { taskId } }),
      this.prisma.taskEvidence.deleteMany({ where: { taskId } }),
      this.prisma.taskComment.deleteMany({ where: { taskId } }),
      this.prisma.taskApproval.deleteMany({ where: { taskId } }),
      this.prisma.taskReminder.deleteMany({ where: { taskId } }),
      this.prisma.taskBlocker.deleteMany({ where: { taskId } }),
      this.prisma.taskStatusHistory.deleteMany({ where: { taskId } }),
      this.prisma.weddingTask.delete({ where: { id: taskId } }),
    ]);

    return { id: taskId, deleted: true };
  }

  async myTasks(userId: string) {
    return this.prisma.weddingTask.findMany({
      where: {
        OR: [
          { assignedUserId: userId },
          {
            wedding: { members: { some: { userId, role: { not: 'VIEWER' } } } },
          },
        ],
        status: { not: 'COMPLETED' },
      },
      include: { wedding: true, event: true },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });
  }

  async myApprovals(userId: string) {
    return this.prisma.weddingTask.findMany({
      where: {
        approvalStatus: 'PENDING',
        wedding: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: { in: ['WEDDING_OWNER', 'BUDGET_MANAGER'] },
                },
              },
            },
          ],
        },
      },
      include: { wedding: true, approvals: true },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  private async ensurePlanningTemplates() {
    const template = await this.prisma.planningTemplate.upsert({
      where: { id: 'default-desi-wedding-template' },
      create: {
        id: 'default-desi-wedding-template',
        name: 'Default desi wedding planner',
        description: 'Rule-based MVP template for desi wedding planning.',
      },
      update: {},
    });

    for (const [index, item] of TASK_TEMPLATES.entries()) {
      const phase = await this.prisma.planningPhase.upsert({
        where: { id: `phase-${item.phase.toLowerCase().replaceAll(' ', '-')}` },
        create: {
          id: `phase-${item.phase.toLowerCase().replaceAll(' ', '-')}`,
          templateId: template.id,
          name: item.phase,
          sortOrder: index,
        },
        update: {},
      });

      await this.prisma.taskTemplate.upsert({
        where: {
          id: `task-template-${item.title.toLowerCase().replaceAll(' ', '-')}`,
        },
        create: {
          id: `task-template-${item.title.toLowerCase().replaceAll(' ', '-')}`,
          templateId: template.id,
          phaseId: phase.id,
          title: item.title,
          description: item.criteria,
          whyImportant: item.why,
          instructions: item.instructions,
          category: item.category,
          offsetDaysBeforeWedding: item.offset,
          priority: item.priority as any,
          assignedRole: item.role as any,
          requiredEvidence: item.evidence,
          completionCriteria: item.criteria,
          requiresApproval: item.approval,
        },
        update: {},
      });
    }
  }

  private async createStepsAndReminders(
    taskId: string,
    instructions: string[],
    dueDate?: Date,
  ) {
    if (instructions.length) {
      await this.prisma.taskStep.createMany({
        data: instructions.map((title, index) => ({
          taskId,
          title,
          sortOrder: index + 1,
        })),
      });
    }

    if (dueDate) {
      const reminderOffsets = [7, 3, 1, 0];
      await this.prisma.taskReminder.createMany({
        data: reminderOffsets.map((days) => ({
          taskId,
          remindAt: this.offsetFrom(dueDate, days),
        })),
      });
    }
  }

  private async createDefaultDependencies(weddingId: string) {
    const tasks = await this.prisma.weddingTask.findMany({
      where: { weddingId },
    });
    const byTitle = new Map(tasks.map((task) => [task.title, task.id]));
    const dependencyPairs = [
      ['Prepare master budget', 'Finalize wedding scope'],
      ['Finalize guest estimate', 'Finalize wedding scope'],
      ['Compare catering proposals', 'Finalize guest estimate'],
      ['Shortlist venue options', 'Prepare master budget'],
      ['Confirm vendor arrival plans', 'Shortlist venue options'],
      ['Run final family coordination meeting', 'Confirm vendor arrival plans'],
      [
        'Collect receipts and close payments',
        'Run final family coordination meeting',
      ],
    ];

    for (const [taskTitle, dependsOnTitle] of dependencyPairs) {
      const taskId = byTitle.get(taskTitle);
      const dependsOnTaskId = byTitle.get(dependsOnTitle);
      if (taskId && dependsOnTaskId) {
        await this.prisma.taskDependency.upsert({
          where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
          create: { taskId, dependsOnTaskId },
          update: {},
        });
      }
    }
  }

  private async recordStatus(
    taskId: string,
    fromStatus: any,
    toStatus: any,
    changedById: string,
  ) {
    await this.prisma.taskStatusHistory.create({
      data: { taskId, fromStatus, toStatus, changedById },
    });
  }

  private normalizeStatus(status?: string) {
    switch (status) {
      case 'PENDING':
        return 'NOT_STARTED';
      case 'DONE':
        return 'COMPLETED';
      default:
        return status || 'NOT_STARTED';
    }
  }

  private async markOverdueTasks(weddingId: string) {
    const now = new Date();
    const overdueTasks = await this.prisma.weddingTask.findMany({
      where: {
        weddingId,
        dueDate: { lt: now },
        status: { in: ACTIVE_OVERDUE_STATUSES as any },
      },
    });

    for (const task of overdueTasks) {
      await this.prisma.weddingTask.update({
        where: { id: task.id },
        data: { status: 'OVERDUE' },
      });
      await this.recordStatus(
        task.id,
        task.status,
        'OVERDUE',
        task.assignedUserId || task.weddingId,
      );
    }
  }

  private async ensureWeddingMember(weddingId: string, userId: string) {
    const member = await this.prisma.weddingMember.findFirst({
      where: {
        weddingId,
        userId,
        status: 'ACCEPTED',
        removedAt: null,
      },
    });
    if (!member) {
      throw new BadRequestException(
        'Assigned user must be an accepted wedding member',
      );
    }

    return member;
  }

  private async ensureTaskApprover(userId: string, weddingId: string) {
    const wedding = await this.prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                status: 'ACCEPTED',
                removedAt: null,
                role: { in: ['WEDDING_OWNER', 'BUDGET_MANAGER'] },
              },
            },
          },
        ],
      },
    });
    if (!wedding) {
      throw new BadRequestException(
        'Only wedding owners or budget managers can approve tasks',
      );
    }

    return wedding;
  }

  private memberProgressKey(task: any) {
    if (task.assignedUser?.fullName) {
      return task.assignedUser.fullName;
    }
    if (task.assignedUser?.email) {
      return task.assignedUser.email;
    }
    if (task.assignee) {
      return task.assignee;
    }
    if (task.assignedRole) {
      return task.assignedRole;
    }
    return 'UNASSIGNED';
  }

  private offsetFrom(date: Date, daysBefore: number) {
    const next = new Date(date);
    next.setDate(next.getDate() - daysBefore);
    return next;
  }

  private daysFromNow(days: number) {
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next;
  }

  private groupBy(items: any[], keyFn: (item: any) => string) {
    return items.reduce(
      (groups, item) => {
        const key = keyFn(item);
        groups[key] = groups[key] || [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, any[]>,
    );
  }

  private progressBy(tasks: any[], keyFn: (task: any) => string) {
    const grouped = this.groupBy(tasks, keyFn);
    return Object.fromEntries(
      (Object.entries(grouped) as Array<[string, any[]]>).map(
        ([key, items]) => {
          const completed = items.filter(
            (task: any) => task.status === 'COMPLETED' || task.isCompleted,
          ).length;
          return [
            key,
            {
              total: items.length,
              completed,
              progress: items.length
                ? Math.round((completed / items.length) * 100)
                : 0,
            },
          ];
        },
      ),
    );
  }
}
