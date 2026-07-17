import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BudgetService } from './budget.service';

@ApiTags('budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weddings/:weddingId/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  listBudgetItems(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.budgetService.listBudgetItems(req.user.id, weddingId);
  }

  @Post()
  addBudgetItem(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body()
    dto: {
      title: string;
      category?: string;
      amount?: number;
      dueDate?: string;
      isPaid?: boolean;
      notes?: string;
    },
  ) {
    return this.budgetService.addBudgetItem(req.user.id, weddingId, dto);
  }

  @Patch(':budgetItemId')
  updateBudgetItem(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('budgetItemId') budgetItemId: string,
    @Body()
    dto: {
      title?: string;
      category?: string;
      amount?: number;
      dueDate?: string;
      isPaid?: boolean;
      notes?: string;
    },
  ) {
    return this.budgetService.updateBudgetItem(
      req.user.id,
      weddingId,
      budgetItemId,
      dto,
    );
  }

  @Delete(':budgetItemId')
  deleteBudgetItem(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('budgetItemId') budgetItemId: string,
  ) {
    return this.budgetService.deleteBudgetItem(
      req.user.id,
      weddingId,
      budgetItemId,
    );
  }
}
