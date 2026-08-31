import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KeywordsService } from './keywords.service.js';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Get()
  findAll() {
    return this.keywordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.keywordsService.findOne(id);
  }

  @Post()
  create(@Body('word') word: string) {
    return this.keywordsService.create(word);
  }

  @Post(':id/usages')
  addUsage(
    @Param('id') id: string,
    @Body() body: { campaignId?: string; locationId?: string; notes?: string },
  ) {
    return this.keywordsService.addUsage(id, body);
  }
}
