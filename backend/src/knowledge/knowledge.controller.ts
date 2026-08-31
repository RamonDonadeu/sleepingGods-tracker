import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { OutcomeInput } from '../common/game-effects.js';
import { KnowledgeService } from './knowledge.service.js';

@Controller('campaigns/:campaignId/locations/:locationId/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  getStructured(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.knowledgeService.getStructured(campaignId, locationId);
  }

  @Post('visit')
  markVisited(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.knowledgeService.markVisited(campaignId, locationId);
  }

  @Post('access')
  addAccess(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body() body: { keyword: string; destination: string },
  ) {
    return this.knowledgeService.addAccess(campaignId, locationId, body);
  }

  @Post('mandatory')
  addMandatoryEvent(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body()
    body: {
      eventKind: 'STAT_TEST' | 'COMBAT' | 'TEXT';
      description?: string;
      stat?: string;
      value?: number;
      successKind?: 'REWARD' | 'GOTO' | 'TOTEM';
      successReward?: string;
      successTotemId?: string;
      successDestination?: string;
      failureText?: string;
      failurePenalties?: Record<string, string>;
      failureDestination?: string;
    },
  ) {
    return this.knowledgeService.addMandatoryEvent(campaignId, locationId, body);
  }

  @Post('option')
  addOption(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body()
    body: {
      isStatTest?: boolean;
      stat?: string;
      value?: number;
      outcome?: OutcomeInput & { destination?: string };
      success?: OutcomeInput & { destination?: string };
      failure?: OutcomeInput & { destination?: string };
      label?: string;
    },
  ) {
    return this.knowledgeService.addOption(campaignId, locationId, body);
  }

  @Post('failure')
  addFailure(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body() body: { destination: string; parentOptionId?: string },
  ) {
    return this.knowledgeService.addFailure(campaignId, locationId, body);
  }

  @Post('reward')
  addReward(
    @Param('campaignId') campaignId: string,
    @Param('locationId') locationId: string,
    @Body() body: { reward: string },
  ) {
    return this.knowledgeService.addReward(campaignId, locationId, body);
  }
}

@Controller('knowledge')
export class KnowledgeDeleteController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.knowledgeService.deleteEntry(id);
  }
}
