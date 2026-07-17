import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BudgetService {
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

  private async ensureBudgetItem(
    userId: string,
    weddingId: string,
    budgetItemId: string,
  ) {
    await this.ensureWedding(userId, weddingId);

    const item = await this.prisma.budgetItem.findFirst({
      where: { id: budgetItemId, weddingId },
    });
    if (!item) {
      throw new NotFoundException('Budget item not found');
    }

    return item;
  }

  async listBudgetItems(userId: string, weddingId: string) {
    await this.ensureWedding(userId, weddingId);

    return this.prisma.budgetItem.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addBudgetItem(
    userId: string,
    weddingId: string,
    dto: {
      title: string;
      category?: string;
      amount?: number;
      dueDate?: string;
      isPaid?: boolean;
      notes?: string;
    },
  ) {
    await this.ensureWedding(userId, weddingId);

    return this.prisma.budgetItem.create({
      data: {
        weddingId,
        title: dto.title,
        category: dto.category,
        amount: dto.amount ? dto.amount : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        isPaid: dto.isPaid ?? false,
        notes: dto.notes,
      },
    });
  }

  async updateBudgetItem(
    userId: string,
    weddingId: string,
    budgetItemId: string,
    dto: {
      title?: string;
      category?: string;
      amount?: number;
      dueDate?: string;
      isPaid?: boolean;
      notes?: string;
    },
  ) {
    await this.ensureBudgetItem(userId, weddingId, budgetItemId);

    return this.prisma.budgetItem.update({
      where: { id: budgetItemId },
      data: {
        title: dto.title,
        category: dto.category,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        isPaid: dto.isPaid,
        notes: dto.notes,
      },
    });
  }

  async deleteBudgetItem(
    userId: string,
    weddingId: string,
    budgetItemId: string,
  ) {
    await this.ensureBudgetItem(userId, weddingId, budgetItemId);
    await this.prisma.budgetItem.delete({ where: { id: budgetItemId } });

    return { id: budgetItemId, deleted: true };
  }
}
