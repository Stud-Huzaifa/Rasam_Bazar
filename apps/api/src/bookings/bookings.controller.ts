import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('proposals/:proposalId/booking')
  createFromProposal(@Req() req: any, @Param('proposalId') proposalId: string) {
    return this.bookingsService.createFromProposalForCustomer(
      req.user.id,
      proposalId,
    );
  }

  @Get('customer/bookings')
  listCustomerBookings(@Req() req: any) {
    return this.bookingsService.listCustomerBookings(req.user.id);
  }

  @Get('vendor/bookings')
  listVendorBookings(@Req() req: any) {
    return this.bookingsService.listVendorBookings(req.user.id);
  }

  @Get('weddings/:weddingId/bookings')
  listWeddingBookings(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.bookingsService.listWeddingBookings(req.user.id, weddingId);
  }

  @Get('weddings/:weddingId/wedding-day')
  weddingDayOperations(@Req() req: any, @Param('weddingId') weddingId: string) {
    return this.bookingsService.listWeddingDayOperations(
      req.user.id,
      weddingId,
    );
  }

  @Get('bookings/:bookingId')
  getBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.getBooking(req.user.id, bookingId);
  }

  @Post('bookings/:bookingId/customer-confirm')
  customerConfirm(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.confirmCustomer(req.user.id, bookingId);
  }

  @Post('bookings/:bookingId/vendor-confirm')
  vendorConfirm(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.confirmVendor(req.user.id, bookingId);
  }

  @Post('bookings/:bookingId/start')
  startBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.setBookingStatus(
      req.user.id,
      bookingId,
      'IN_PROGRESS',
    );
  }

  @Post('bookings/:bookingId/complete')
  completeBooking(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.setBookingStatus(
      req.user.id,
      bookingId,
      'COMPLETED',
    );
  }

  @Post('bookings/:bookingId/operation-status')
  operationStatus(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.updateOperationStatus(
      req.user.id,
      bookingId,
      dto,
    );
  }

  @Post('bookings/:bookingId/cancel')
  cancelBooking(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.cancelBooking(
      req.user.id,
      bookingId,
      dto.reason,
    );
  }

  @Post('bookings/:bookingId/payments')
  addPayment(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.addPayment(req.user.id, bookingId, dto);
  }

  @Patch('bookings/:bookingId/payments/:paymentId')
  updatePayment(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.updatePayment(
      req.user.id,
      bookingId,
      paymentId,
      dto,
    );
  }

  @Post('bookings/:bookingId/payments/:paymentId/mark-paid')
  markPaymentPaid(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.markPaymentPaid(
      req.user.id,
      bookingId,
      paymentId,
      dto,
    );
  }

  @Post('bookings/:bookingId/payments/:paymentId/record')
  recordPayment(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.recordPayment(
      req.user.id,
      bookingId,
      paymentId,
      dto,
    );
  }

  @Post('bookings/:bookingId/payments/:paymentId/verify')
  verifyPayment(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: any,
  ) {
    return this.bookingsService.verifyPayment(
      req.user.id,
      bookingId,
      paymentId,
      dto,
    );
  }

  @Post('bookings/:bookingId/sync-budget')
  syncBudget(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.syncBookingBudget(req.user.id, bookingId);
  }
}
