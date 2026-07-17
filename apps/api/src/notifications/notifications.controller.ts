import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  listNotifications(@Req() req: any) {
    return this.notificationsService.listNotifications(req.user.id);
  }

  @Get('notifications/unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationsService.unreadCount(req.user.id);
  }

  @Patch('notifications/:notificationId/read')
  markRead(@Req() req: any, @Param('notificationId') notificationId: string) {
    return this.notificationsService.markRead(req.user.id, notificationId);
  }

  @Post('notifications/mark-all-read')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Get('message-threads')
  listThreads(@Req() req: any) {
    return this.notificationsService.listThreads(req.user.id);
  }

  @Post('message-threads')
  createThread(@Req() req: any, @Body() dto: any) {
    return this.notificationsService.createThread(req.user.id, dto);
  }

  @Post('bookings/:bookingId/message-thread')
  createBookingThread(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.notificationsService.createBookingThread(
      req.user.id,
      bookingId,
    );
  }

  @Get('message-threads/:threadId/messages')
  listMessages(@Req() req: any, @Param('threadId') threadId: string) {
    return this.notificationsService.listMessages(req.user.id, threadId);
  }

  @Post('message-threads/:threadId/messages')
  sendMessage(
    @Req() req: any,
    @Param('threadId') threadId: string,
    @Body() dto: any,
  ) {
    return this.notificationsService.sendMessage(req.user.id, threadId, dto);
  }

  @Post('message-threads/:threadId/system-messages')
  systemMessage(
    @Req() req: any,
    @Param('threadId') threadId: string,
    @Body() dto: any,
  ) {
    return this.notificationsService.createSystemMessageForUser(
      req.user.id,
      threadId,
      dto.body,
      dto.metadata,
    );
  }

  @Post('message-threads/:threadId/read')
  markThreadRead(@Req() req: any, @Param('threadId') threadId: string) {
    return this.notificationsService.markThreadRead(req.user.id, threadId);
  }

  @Get('weddings/:weddingId/activity')
  weddingActivity(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.notificationsService.listWeddingActivity(
      req.user.id,
      weddingId,
    );
  }

  @Get('bookings/:bookingId/activity')
  bookingActivity(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.notificationsService.listBookingActivity(
      req.user.id,
      bookingId,
    );
  }
}
