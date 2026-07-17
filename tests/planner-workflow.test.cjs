require('ts-node/register/transpile-only');

const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { TasksService } = require('../apps/api/src/tasks/tasks.service');

class PlannerPrisma {
  constructor() {
    this.weddings = [
      {
        id: 'wedding-1',
        ownerId: 'owner-1',
        startDate: new Date(Date.now() + 90 * 86400000),
      },
    ];
    this.members = [
      {
        weddingId: 'wedding-1',
        userId: 'member-1',
        role: 'GUEST_MANAGER',
        status: 'ACCEPTED',
        removedAt: null,
      },
      {
        weddingId: 'wedding-1',
        userId: 'budget-1',
        role: 'BUDGET_MANAGER',
        status: 'ACCEPTED',
        removedAt: null,
      },
    ];
    this.tasks = [];
    this.dependencies = [];
    this.evidence = [];
    this.approvals = [];
    this.blockers = [];
    this.statusHistory = [];

    this.wedding = {
      findFirst: async ({ where }) =>
        this.weddings.find(
          (wedding) =>
            wedding.id === where.id &&
            (wedding.ownerId === this.currentUser ||
              this.members.some(
                (member) =>
                  member.weddingId === wedding.id &&
                  member.userId === this.currentUser &&
                  member.status === 'ACCEPTED' &&
                  member.removedAt === null &&
                  (!where.OR?.[1]?.members?.some?.role?.in ||
                    where.OR[1].members.some.role.in.includes(member.role)),
              )),
        ) || null,
    };

    this.weddingMember = {
      findFirst: async ({ where }) =>
        this.members.find(
          (member) =>
            member.weddingId === where.weddingId &&
            member.userId === where.userId &&
            member.status === where.status &&
            member.removedAt === where.removedAt,
        ) || null,
    };

    this.weddingTask = {
      findFirst: async ({ where }) => {
        const task = this.tasks.find((item) => item.id === where.id);
        if (!task) return null;
        return this.canAccess(this.currentUser, task.weddingId)
          ? this.withRelations(task)
          : null;
      },
      findMany: async ({ where = {} } = {}) => {
        let tasks = this.tasks.filter((task) =>
          where.weddingId ? task.weddingId === where.weddingId : true,
        );
        if (where.dueDate?.lt) {
          tasks = tasks.filter(
            (task) => task.dueDate && task.dueDate < where.dueDate.lt,
          );
        }
        if (where.status?.in) {
          tasks = tasks.filter((task) => where.status.in.includes(task.status));
        }
        return tasks.map((task) => this.withRelations(task));
      },
      update: async ({ where, data }) => {
        const task = this.tasks.find((item) => item.id === where.id);
        Object.assign(task, data);
        return this.withRelations(task);
      },
    };

    this.taskEvidence = {
      create: async ({ data }) => {
        const evidence = {
          id: `evidence-${this.evidence.length + 1}`,
          ...data,
        };
        this.evidence.push(evidence);
        return evidence;
      },
    };

    this.taskApproval = {
      create: async ({ data }) => {
        const approval = {
          id: `approval-${this.approvals.length + 1}`,
          ...data,
        };
        this.approvals.push(approval);
        return approval;
      },
    };

    this.taskStatusHistory = {
      create: async ({ data }) => {
        const item = {
          id: `history-${this.statusHistory.length + 1}`,
          ...data,
        };
        this.statusHistory.push(item);
        return item;
      },
    };
  }

  as(userId) {
    this.currentUser = userId;
    return this;
  }

  addTask(data) {
    const task = {
      id: `task-${this.tasks.length + 1}`,
      weddingId: 'wedding-1',
      title: 'Task',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      requiredEvidence: [],
      requiresApproval: false,
      approvalStatus: 'NOT_REQUIRED',
      isCompleted: false,
      blockers: [],
      ...data,
    };
    this.tasks.push(task);
    return task;
  }

  addDependency(taskId, dependsOnTaskId) {
    this.dependencies.push({
      id: `dependency-${this.dependencies.length + 1}`,
      taskId,
      dependsOnTaskId,
    });
  }

  canAccess(userId, weddingId) {
    const wedding = this.weddings.find((item) => item.id === weddingId);
    return (
      wedding?.ownerId === userId ||
      this.members.some(
        (member) =>
          member.weddingId === weddingId &&
          member.userId === userId &&
          member.status === 'ACCEPTED' &&
          member.removedAt === null,
      )
    );
  }

  withRelations(task) {
    return {
      ...task,
      evidence: this.evidence.filter((item) => item.taskId === task.id),
      blockers: this.blockers.filter((item) => item.taskId === task.id),
      approvals: this.approvals.filter((item) => item.taskId === task.id),
      statusHistory: this.statusHistory.filter(
        (item) => item.taskId === task.id,
      ),
      event: task.event,
      assignedUser: task.assignedUser,
      dependentTasks: this.dependencies
        .filter((dependency) => dependency.taskId === task.id)
        .map((dependency) => ({
          ...dependency,
          dependsOnTask: this.tasks.find(
            (item) => item.id === dependency.dependsOnTaskId,
          ),
        })),
    };
  }
}

async function run() {
  const prisma = new PlannerPrisma();
  const service = new TasksService(prisma.as('member-1'));

  const first = prisma.addTask({ title: 'Book venue' });
  const dependent = prisma.addTask({ title: 'Confirm floor plan' });
  prisma.addDependency(dependent.id, first.id);

  await assert.rejects(
    () => service.completeTask('member-1', dependent.id),
    BadRequestException,
  );
  await service.completeTask('member-1', first.id);
  await service.completeTask('member-1', dependent.id);
  assert.equal(
    prisma.tasks.find((task) => task.id === dependent.id).status,
    'COMPLETED',
  );

  const evidenceTask = prisma.addTask({
    title: 'Upload venue contract',
    requiredEvidence: ['Signed contract'],
  });
  await assert.rejects(
    () => service.completeTask('member-1', evidenceTask.id),
    BadRequestException,
  );
  await service.addEvidence('member-1', evidenceTask.id, {
    title: 'Signed contract',
    fileUrl: 'https://example.test/contract.pdf',
  });

  const approvalTask = prisma.addTask({
    title: 'Approve caterer',
    assignedUserId: 'member-1',
    assignedUser: { fullName: 'Family Member', email: 'member@test.local' },
    event: { name: 'Mehndi' },
    requiredEvidence: ['Quotation'],
    requiresApproval: true,
  });
  await service.addEvidence('member-1', approvalTask.id, {
    title: 'Quotation',
  });
  await service.completeTask('member-1', approvalTask.id);
  assert.equal(
    prisma.tasks.find((task) => task.id === approvalTask.id).status,
    'AWAITING_APPROVAL',
  );
  assert.equal(
    prisma.tasks.find((task) => task.id === approvalTask.id).approvalStatus,
    'PENDING',
  );
  await assert.rejects(
    () => service.approveTask('member-1', approvalTask.id),
    BadRequestException,
  );
  prisma.as('owner-1');
  await service.approveTask('owner-1', approvalTask.id, 'Looks good');
  assert.equal(
    prisma.tasks.find((task) => task.id === approvalTask.id).status,
    'COMPLETED',
  );

  const overdue = prisma.addTask({
    title: 'Overdue RSVP follow-up',
    status: 'IN_PROGRESS',
    dueDate: new Date(Date.now() - 2 * 86400000),
    assignedRole: 'GUEST_MANAGER',
    event: { name: 'Walima' },
  });
  const progress = await service.getProgress('owner-1', 'wedding-1');
  assert.equal(
    prisma.tasks.find((task) => task.id === overdue.id).status,
    'OVERDUE',
  );
  assert.equal(progress.overdue, 1);
  assert.ok(progress.overall > 0);
  assert.equal(progress.byEvent.Mehndi.completed, 1);
  assert.equal(progress.byMember['Family Member'].completed, 1);

  console.log('Planner workflow tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
