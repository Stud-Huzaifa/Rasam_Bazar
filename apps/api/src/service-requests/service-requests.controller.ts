import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags('service-requests')
@ApiBearerAuth()
@Controller()
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post('service-requests')
  createRequest(@Req() req: any, @Body() dto: any) {
    return this.serviceRequestsService.createRequest(req.user.id, dto);
  }

  @Get('service-requests')
  listRequests(@Req() req: any) {
    return this.serviceRequestsService.listRequests(req.user.id);
  }

  @Get('service-requests/:requestId')
  getRequest(@Req() req: any, @Param('requestId') requestId: string) {
    return this.serviceRequestsService.getRequest(req.user.id, requestId);
  }

  @Patch('service-requests/:requestId')
  updateRequest(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body() dto: any,
  ) {
    return this.serviceRequestsService.updateRequest(
      req.user.id,
      requestId,
      dto,
    );
  }

  @Post('service-requests/:requestId/publish')
  publishRequest(@Req() req: any, @Param('requestId') requestId: string) {
    return this.serviceRequestsService.publishRequest(req.user.id, requestId);
  }

  @Post('service-requests/:requestId/invite-vendor')
  inviteVendor(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body() dto: any,
  ) {
    return this.serviceRequestsService.inviteVendor(
      req.user.id,
      requestId,
      dto.vendorId,
      dto.note,
    );
  }

  @Post('service-requests/:requestId/close')
  closeRequest(@Req() req: any, @Param('requestId') requestId: string) {
    return this.serviceRequestsService.closeRequest(req.user.id, requestId);
  }

  @Get('service-requests/:requestId/matching-vendors')
  matchingVendors(@Req() req: any, @Param('requestId') requestId: string) {
    return this.serviceRequestsService.matchingVendors(req.user.id, requestId);
  }

  @Get('vendors/me/matching-requests')
  matchingRequests(@Req() req: any) {
    return this.serviceRequestsService.matchingRequestsForVendor(req.user.id);
  }
}
