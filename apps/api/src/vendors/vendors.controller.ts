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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { VendorsService } from './vendors.service';

@ApiTags('vendors')
@Controller()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Public()
  @Get('vendors')
  @ApiOperation({ summary: 'List active vendors' })
  listVendors(@Query() query: any) {
    return this.vendorsService.listVendors(query);
  }

  @Public()
  @Get('categories')
  listCategories() {
    return this.vendorsService.listCategories();
  }

  @Public()
  @Get('categories/:slug')
  getCategory(@Param('slug') slug: string, @Query() query: any) {
    return this.vendorsService.getCategory(slug, query);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Get('vendors/me/dashboard')
  getMyDashboard(@Req() req: any) {
    return this.vendorsService.getMyDashboard(req.user.id);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Get('vendors/me')
  getMyVendor(@Req() req: any) {
    return this.vendorsService.getMyVendor(req.user.id);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Get('vendors/me/inquiries')
  getMyInquiries(@Req() req: any) {
    return this.vendorsService.getMyInquiries(req.user.id);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('vendor-inquiries/:inquiryId')
  updateInquiry(
    @Req() req: any,
    @Param('inquiryId') inquiryId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updateInquiry(req.user.id, inquiryId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER')
  @Post('vendors')
  createVendor(@Req() req: any, @Body() dto: any) {
    return this.vendorsService.createOrUpdateVendor(req.user.id, dto);
  }

  @Public()
  @Get('vendors/:vendorId')
  @ApiOperation({ summary: 'Get vendor details' })
  getVendor(@Param('vendorId') vendorId: string) {
    return this.vendorsService.getVendor(vendorId);
  }

  @Public()
  @Post('vendors/:vendorId/inquiries')
  createInquiry(@Param('vendorId') vendorId: string, @Body() dto: any) {
    return this.vendorsService.createInquiry(vendorId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('vendors/:vendorId')
  updateVendor(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updateVendor(req.user.id, vendorId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('vendors/:vendorId/verification')
  submitVerification(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.submitVerification(req.user.id, vendorId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('vendors/:vendorId/portfolio')
  addPortfolioItem(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.addPortfolioItem(req.user.id, vendorId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Delete('portfolio/:portfolioId')
  deletePortfolioItem(
    @Req() req: any,
    @Param('portfolioId') portfolioId: string,
  ) {
    return this.vendorsService.deletePortfolioItem(req.user.id, portfolioId);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('vendors/:vendorId/teams')
  addTeam(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.addTeam(req.user.id, vendorId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('teams/:teamId')
  updateTeam(
    @Req() req: any,
    @Param('teamId') teamId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updateTeam(req.user.id, teamId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('vendors/:vendorId/services')
  addService(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.addService(req.user.id, vendorId, dto);
  }

  @Public()
  @Get('vendors/:vendorId/services')
  listServices(@Param('vendorId') vendorId: string) {
    return this.vendorsService.listServices(vendorId);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('services/:serviceId')
  updateService(
    @Req() req: any,
    @Param('serviceId') serviceId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updateService(req.user.id, serviceId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Delete('services/:serviceId')
  deleteService(@Req() req: any, @Param('serviceId') serviceId: string) {
    return this.vendorsService.deleteService(req.user.id, serviceId);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('services/:serviceId/packages')
  addPackage(
    @Req() req: any,
    @Param('serviceId') serviceId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.addPackage(req.user.id, serviceId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('packages/:packageId')
  updatePackage(
    @Req() req: any,
    @Param('packageId') packageId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updatePackage(req.user.id, packageId, dto);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Post('vendors/:vendorId/availability')
  addAvailability(
    @Req() req: any,
    @Param('vendorId') vendorId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.addAvailability(req.user.id, vendorId, dto);
  }

  @Public()
  @Get('vendors/:vendorId/availability')
  listAvailability(@Param('vendorId') vendorId: string) {
    return this.vendorsService.listAvailability(vendorId);
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Patch('availability/:availabilityId')
  updateAvailability(
    @Req() req: any,
    @Param('availabilityId') availabilityId: string,
    @Body() dto: any,
  ) {
    return this.vendorsService.updateAvailability(
      req.user.id,
      availabilityId,
      dto,
    );
  }

  @ApiBearerAuth()
  @Roles('VENDOR_OWNER', 'VENDOR_STAFF')
  @Delete('availability/:availabilityId')
  deleteAvailability(
    @Req() req: any,
    @Param('availabilityId') availabilityId: string,
  ) {
    return this.vendorsService.deleteAvailability(req.user.id, availabilityId);
  }
}
