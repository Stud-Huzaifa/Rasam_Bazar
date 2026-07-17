import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GuestsService } from './guests.service';

@ApiTags('guests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weddings/:weddingId/guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  listGuests(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.guestsService.listGuests(req.user.id, weddingId);
  }

  @Get('summary')
  guestSummary(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.guestsService.guestSummary(req.user.id, weddingId, eventId);
  }

  @Post('catering-estimate')
  cateringEstimate(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body() dto: any,
  ) {
    return this.guestsService.cateringEstimate(req.user.id, weddingId, dto);
  }

  @Post()
  addGuest(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Body()
    dto: { name: string; relation?: string; phone?: string; status?: string },
  ) {
    return this.guestsService.addGuest(req.user.id, weddingId, dto);
  }

  @Patch(':guestId')
  updateGuest(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('guestId') guestId: string,
    @Body()
    dto: { name?: string; relation?: string; phone?: string; status?: string },
  ) {
    return this.guestsService.updateGuest(req.user.id, weddingId, guestId, dto);
  }

  @Post(':guestId/events/:eventId/invite')
  inviteToEvent(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('guestId') guestId: string,
    @Param('eventId') eventId: string,
    @Body() dto: any,
  ) {
    return this.guestsService.inviteGuestToEvent(
      req.user.id,
      weddingId,
      guestId,
      eventId,
      dto,
    );
  }

  @Patch(':guestId/events/:eventId/rsvp')
  updateRsvp(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('guestId') guestId: string,
    @Param('eventId') eventId: string,
    @Body() dto: any,
  ) {
    return this.guestsService.updateRsvp(
      req.user.id,
      weddingId,
      guestId,
      eventId,
      dto,
    );
  }

  @Delete(':guestId')
  deleteGuest(
    @Req() req: any,
    @Param('weddingId') weddingId: string,
    @Param('guestId') guestId: string,
  ) {
    return this.guestsService.deleteGuest(req.user.id, weddingId, guestId);
  }
}
