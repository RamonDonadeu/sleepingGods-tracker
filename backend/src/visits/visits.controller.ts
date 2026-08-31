import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { LocationStatus } from '@prisma/client';
import { VisitsService } from './visits.service.js';
import { RegisterVisitDto } from './dto/register-visit.dto.js';

@Controller('campaigns/:campaignId/locations/:locationId')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post('visits')
  register(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body() dto: RegisterVisitDto,
  ) {
    return this.visitsService.registerVisit(campaignId, locationId, dto);
  }

  @Get('visits')
  list(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.visitsService.getVisits(campaignId, locationId);
  }

  @Patch('status')
  updateStatus(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body('status') status: LocationStatus,
  ) {
    return this.visitsService.updateStatus(campaignId, locationId, status);
  }
}
