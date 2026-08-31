import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.findOrCreate(dto);
  }

  @Get('by-number/:number')
  findByNumber(@Param('number') number: string) {
    return this.locationsService.findByNumber(decodeURIComponent(number));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('campaignId') campaignId?: string) {
    if (campaignId) {
      return this.locationsService.getCampaignState(id, campaignId);
    }
    return this.locationsService.findOne(id);
  }

  @Get(':id/knowledge')
  getKnowledge(@Param('id') id: string) {
    return this.locationsService.getKnowledge(id);
  }
}
