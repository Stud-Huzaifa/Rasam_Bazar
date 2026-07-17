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
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('weddings/:weddingId/generate-plan')
  generatePlan(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.tasksService.generatePlan(req.user.id, weddingId);
  }

  @Get('weddings/:weddingId/plan')
  getPlan(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.tasksService.getPlan(req.user.id, weddingId);
  }

  @Get('weddings/:weddingId/progress')
  getProgress(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.tasksService.getProgress(req.user.id, weddingId);
  }

  @Get('users/me/tasks')
  myTasks(@Req() req: any) {
    return this.tasksService.myTasks(req.user.id);
  }

  @Get('users/me/approvals')
  myApprovals(@Req() req: any) {
    return this.tasksService.myApprovals(req.user.id);
  }

  @Get('weddings/:weddingId/tasks')
  listTasks(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.tasksService.listTasks(req.user.id, weddingId);
  }

  @Post('weddings/:weddingId/tasks')
  addTask(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.addTask(req.user.id, weddingId, dto);
  }

  @Get('tasks/:taskId')
  getTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.tasksService.getTask(req.user.id, taskId);
  }

  @Patch('tasks/:taskId')
  updateTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.updateTask(req.user.id, taskId, dto);
  }

  @Patch('weddings/:weddingId/tasks/:taskId')
  updateNestedTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.updateTask(req.user.id, taskId, dto);
  }

  @Post('tasks/:taskId/assign')
  assignTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.assignTask(req.user.id, taskId, dto);
  }

  @Post('tasks/:taskId/start')
  startTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.tasksService.changeStatus(req.user.id, taskId, 'IN_PROGRESS');
  }

  @Post('tasks/:taskId/complete')
  completeTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.tasksService.completeTask(req.user.id, taskId);
  }

  @Post('tasks/:taskId/evidence')
  addEvidence(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.addEvidence(req.user.id, taskId, dto);
  }

  @Post('tasks/:taskId/comments')
  addComment(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.addComment(req.user.id, taskId, dto);
  }

  @Post('tasks/:taskId/blockers')
  addBlocker(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.addBlocker(req.user.id, taskId, dto);
  }

  @Post('tasks/:taskId/approve')
  approveTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.approveTask(req.user.id, taskId, dto?.comment);
  }

  @Post('tasks/:taskId/reject')
  rejectTask(
    @Req() req: any,
    @Param('taskId') taskId: string,
    @Body() dto: any,
  ) {
    return this.tasksService.rejectTask(req.user.id, taskId, dto?.comment);
  }

  @Delete('weddings/:weddingId/tasks/:taskId')
  deleteNestedTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.tasksService.deleteTask(req.user.id, taskId);
  }

  @Delete('tasks/:taskId')
  deleteTask(@Req() req: any, @Param('taskId') taskId: string) {
    return this.tasksService.deleteTask(req.user.id, taskId);
  }
}
