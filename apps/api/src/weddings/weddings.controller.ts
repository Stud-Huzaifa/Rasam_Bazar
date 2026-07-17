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
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { CreateWeddingEventDto } from './dto/create-event.dto';
import { CreateMemberDto, UpdateMemberDto } from './dto/create-member.dto';
import { WeddingsService } from './weddings.service';

@ApiTags('weddings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class WeddingsController {
  constructor(private readonly weddingsService: WeddingsService) {}

  @Post('weddings')
  createWedding(@Req() req: any, @Body() dto: CreateWeddingDto) {
    return this.weddingsService.createWedding(req.user.id, dto);
  }

  @Get('weddings')
  listWeddings(@Req() req: any) {
    return this.weddingsService.listWeddings(req.user.id);
  }

  @Get('weddings/:weddingId/dashboard')
  getDashboard(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.weddingsService.getDashboard(req.user.id, weddingId);
  }

  @Get('weddings/:weddingId')
  getWedding(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.weddingsService.getWedding(req.user.id, weddingId);
  }

  @Patch('weddings/:weddingId')
  updateWedding(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body() dto: Partial<CreateWeddingDto>,
  ) {
    return this.weddingsService.updateWedding(req.user.id, weddingId, dto);
  }

  @Delete('weddings/:weddingId')
  archiveWedding(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.weddingsService.archiveWedding(req.user.id, weddingId);
  }

  @Post('weddings/:weddingId/events')
  addEvent(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body() dto: CreateWeddingEventDto,
  ) {
    return this.weddingsService.addEvent(req.user.id, weddingId, dto);
  }

  @Get('weddings/:weddingId/events')
  listEvents(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.weddingsService.listEvents(req.user.id, weddingId);
  }

  @Get('events/:eventId')
  getEvent(@Req() req: any, @Param('eventId') eventId: string) {
    return this.weddingsService.getEvent(req.user.id, eventId);
  }

  @Patch('events/:eventId')
  updateEvent(
    @Req() req: any,
    @Param('eventId') eventId: string,
    @Body() dto: Partial<CreateWeddingEventDto>,
  ) {
    return this.weddingsService.updateEvent(req.user.id, eventId, dto);
  }

  @Delete('events/:eventId')
  deleteEvent(@Req() req: any, @Param('eventId') eventId: string) {
    return this.weddingsService.deleteEvent(req.user.id, eventId);
  }

  @Post('weddings/:weddingId/members')
  addMember(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.weddingsService.addMember(req.user.id, weddingId, dto);
  }

  @Get('weddings/:weddingId/members')
  listMembers(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.weddingsService.listMembers(req.user.id, weddingId);
  }

  @Patch('weddings/:weddingId/members/:memberId')
  updateMember(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.weddingsService.updateMember(
      req.user.id,
      weddingId,
      memberId,
      dto,
    );
  }

  @Delete('weddings/:weddingId/members/:memberId')
  removeMember(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.weddingsService.removeMember(req.user.id, weddingId, memberId);
  }
}
