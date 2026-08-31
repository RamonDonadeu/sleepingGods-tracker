import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Get(':id/map')
  getMap(@Param('id') id: string) {
    return this.campaignsService.getMap(id);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.campaignsService.complete(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.campaignsService.getSummary(id);
  }
}
