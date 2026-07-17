import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:bookingId/review')
  submitReview(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.submitReview(req.user.id, bookingId, dto);
  }

  @Patch('reviews/:reviewId')
  updateReview(
    @Req() req: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.updateReview(req.user.id, reviewId, dto);
  }

  @Post('reviews/:reviewId/vendor-response')
  vendorResponse(
    @Req() req: any,
    @Param('reviewId') reviewId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.respondToReview(
      req.user.id,
      reviewId,
      dto.response,
    );
  }

  @Get('customer/reviews')
  listCustomerReviews(@Req() req: any) {
    return this.reviewsService.listCustomerReviews(req.user.id);
  }

  @Get('vendor/reviews')
  listVendorReviews(@Req() req: any) {
    return this.reviewsService.listVendorReviews(req.user.id);
  }

  @Public()
  @Get('vendors/:vendorId/reviews')
  listPublicVendorReviews(@Param('vendorId') vendorId: string) {
    return this.reviewsService.listPublicVendorReviews(vendorId);
  }

  @Public()
  @Get('vendors/:vendorId/trust')
  vendorTrust(@Param('vendorId') vendorId: string) {
    return this.reviewsService.vendorTrust(vendorId);
  }

  @Get('vendor/trust')
  myVendorTrust(@Req() req: any) {
    return this.reviewsService.myVendorTrust(req.user.id);
  }

  @Post('bookings/:bookingId/disputes')
  openDispute(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.openDispute(req.user.id, bookingId, dto);
  }

  @Post('disputes/:disputeId/evidence')
  uploadDisputeEvidence(
    @Req() req: any,
    @Param('disputeId') disputeId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.uploadDisputeEvidence(
      req.user.id,
      disputeId,
      dto,
    );
  }

  @Post('disputes/:disputeId/vendor-response')
  vendorDisputeResponse(
    @Req() req: any,
    @Param('disputeId') disputeId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.vendorDisputeResponse(
      req.user.id,
      disputeId,
      dto,
    );
  }

  @Patch('disputes/:disputeId')
  updateDispute(
    @Req() req: any,
    @Param('disputeId') disputeId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.updateDispute(req.user.id, disputeId, dto);
  }

  @Post('bookings/:bookingId/incidents')
  createIncident(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.createIncident(req.user.id, bookingId, dto);
  }

  @Post('incidents/:incidentId/evidence')
  uploadIncidentEvidence(
    @Req() req: any,
    @Param('incidentId') incidentId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.uploadIncidentEvidence(
      req.user.id,
      incidentId,
      dto,
    );
  }

  @Post('incidents/:incidentId/vendor-response')
  vendorIncidentResponse(
    @Req() req: any,
    @Param('incidentId') incidentId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.vendorIncidentResponse(
      req.user.id,
      incidentId,
      dto,
    );
  }

  @Patch('incidents/:incidentId/resolve')
  resolveIncident(
    @Req() req: any,
    @Param('incidentId') incidentId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.resolveIncident(req.user.id, incidentId, dto);
  }

  @Post('incidents/:incidentId/escalate')
  escalateIncident(
    @Req() req: any,
    @Param('incidentId') incidentId: string,
    @Body() dto: any,
  ) {
    return this.reviewsService.escalateIncidentToDispute(
      req.user.id,
      incidentId,
      dto,
    );
  }
}
