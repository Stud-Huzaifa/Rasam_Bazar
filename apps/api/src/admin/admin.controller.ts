import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('users')
  listUsers(@Query() query: any) {
    return this.adminService.listUsers(query);
  }

  @Get('saved-views')
  savedViews() {
    return this.adminService.savedViews();
  }

  @Get('reports')
  reports() {
    return this.adminService.reports();
  }

  @Patch('users/:userId/status')
  updateUserStatus(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: any,
  ) {
    return this.adminService.updateUserStatus(req.user.id, userId, dto);
  }

  @Get('vendor-verifications')
  listVendorVerifications(@Query() query: any) {
    return this.adminService.listVendorVerifications(query);
  }

  @Get('vendors')
  listVendors(@Query() query: any) {
    return this.adminService.listVendors(query);
  }

  @Patch('vendor-verifications/:verificationId')
  reviewVendorVerification(
    @Req() req: any,
    @Param('verificationId') verificationId: string,
    @Body() dto: any,
  ) {
    return this.adminService.reviewVendorVerification(
      req.user.id,
      verificationId,
      dto,
    );
  }

  @Patch('vendors/:vendorId/status')
  updateVendorStatus(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.adminService.updateVendorStatus(req.user.id, vendorId, dto);
  }

  @Get('service-categories')
  serviceCategories(@Query() query: any) {
    return this.adminService.listServiceCategories(query);
  }

  @Get('listings')
  listings(@Query() query: any) {
    return this.adminService.listListings(query);
  }

  @Patch('listings/:listingId')
  moderateListing(
    @Req() req: any,
    @Param('listingId') listingId: string,
    @Body() dto: any,
  ) {
    return this.adminService.moderateListing(req.user.id, listingId, dto);
  }

  @Get('reviews')
  listReviews(@Query() query: any) {
    return this.adminService.listReviews(query);
  }

  @Get('bookings')
  listBookings(@Query() query: any) {
    return this.adminService.listBookings(query);
  }

  @Get('payments')
  listPayments(@Query() query: any) {
    return this.adminService.listPayments(query);
  }

  @Patch('reviews/:reviewId')
  moderateReview(
    @Req() req: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: any,
  ) {
    return this.adminService.moderateReview(req.user.id, reviewId, dto);
  }

  @Get('disputes')
  listDisputes(@Query() query: any) {
    return this.adminService.listDisputes(query);
  }

  @Get('incidents')
  listIncidents(@Query() query: any) {
    return this.adminService.listIncidents(query);
  }

  @Patch('incidents/:incidentId')
  moderateIncident(
    @Req() req: any,
    @Param('incidentId') incidentId: string,
    @Body() dto: any,
  ) {
    return this.adminService.moderateIncident(req.user.id, incidentId, dto);
  }

  @Patch('disputes/:disputeId')
  moderateDispute(
    @Req() req: any,
    @Param('disputeId') disputeId: string,
    @Body() dto: any,
  ) {
    return this.adminService.moderateDispute(req.user.id, disputeId, dto);
  }

  @Get('audit-logs')
  auditLogs(@Query() query: any) {
    return this.adminService.auditLogs(query);
  }
}
