import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';

@ApiTags('proposals')
@ApiBearerAuth()
@Controller()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('service-requests/:requestId/proposals')
  createProposal(
    @Req() req: any,
    @Param('requestId') requestId: string,
    @Body() dto: any,
  ) {
    return this.proposalsService.createProposal(req.user.id, requestId, dto);
  }

  @Get('service-requests/:requestId/proposals')
  listRequestProposals(@Req() req: any, @Param('requestId') requestId: string) {
    return this.proposalsService.listRequestProposals(req.user.id, requestId);
  }

  @Get('service-requests/:requestId/proposals/compare')
  compareProposals(@Req() req: any, @Param('requestId') requestId: string) {
    return this.proposalsService.compareProposals(req.user.id, requestId);
  }

  @Get('vendors/me/proposals')
  listVendorProposals(@Req() req: any) {
    return this.proposalsService.listVendorProposals(req.user.id);
  }

  @Get('customer/proposals')
  listCustomerProposals(@Req() req: any) {
    return this.proposalsService.listCustomerProposals(req.user.id);
  }

  @Get('proposals/:proposalId')
  getProposal(@Req() req: any, @Param('proposalId') proposalId: string) {
    return this.proposalsService.getProposal(req.user.id, proposalId);
  }

  @Post('proposals/:proposalId/revisions')
  reviseProposal(
    @Req() req: any,
    @Param('proposalId') proposalId: string,
    @Body() dto: any,
  ) {
    return this.proposalsService.reviseProposal(req.user.id, proposalId, dto);
  }

  @Post('proposals/:proposalId/comments')
  addComment(
    @Req() req: any,
    @Param('proposalId') proposalId: string,
    @Body() dto: any,
  ) {
    return this.proposalsService.addComment(
      req.user.id,
      proposalId,
      dto.comment,
    );
  }

  @Post('proposals/:proposalId/shortlist')
  shortlist(@Req() req: any, @Param('proposalId') proposalId: string) {
    return this.proposalsService.setCustomerStatus(
      req.user.id,
      proposalId,
      'SHORTLISTED',
    );
  }

  @Post('proposals/:proposalId/request-revision')
  requestRevision(
    @Req() req: any,
    @Param('proposalId') proposalId: string,
    @Body() dto: any,
  ) {
    return this.proposalsService.requestRevision(
      req.user.id,
      proposalId,
      dto.comment,
    );
  }

  @Post('proposals/:proposalId/accept')
  accept(@Req() req: any, @Param('proposalId') proposalId: string) {
    return this.proposalsService.setCustomerStatus(
      req.user.id,
      proposalId,
      'ACCEPTED',
    );
  }

  @Post('proposals/:proposalId/reject')
  reject(
    @Req() req: any,
    @Param('proposalId') proposalId: string,
    @Body() dto: any,
  ) {
    return this.proposalsService.rejectProposal(
      req.user.id,
      proposalId,
      dto.comment,
    );
  }

  @Post('proposals/:proposalId/withdraw')
  withdraw(@Req() req: any, @Param('proposalId') proposalId: string) {
    return this.proposalsService.withdrawProposal(req.user.id, proposalId);
  }
}
