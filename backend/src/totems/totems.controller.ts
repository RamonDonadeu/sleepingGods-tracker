import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TotemsService } from './totems.service.js';

@Controller()
export class TotemsController {
  constructor(private readonly totemsService: TotemsService) {}

  @Get('totems')
  findAll(@Query('campaignId') campaignId?: string) {
    return this.totemsService.findAll(campaignId);
  }

  @Get('totems/:id')
  findOne(@Param('id') id: string) {
    return this.totemsService.findOne(id);
  }

  @Post('totems')
  create(@Body() body: { name: string; notes?: string }) {
    return this.totemsService.create(body.name, body.notes);
  }

  @Patch('campaigns/:campaignId/totems/:totemId')
  setStatus(
    @Param('campaignId') campaignId: string,
    @Param('totemId') totemId: string,
    @Body('obtained') obtained: boolean,
  ) {
    return this.totemsService.setCampaignStatus(campaignId, totemId, obtained);
  }
}
