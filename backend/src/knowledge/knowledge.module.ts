import { Module } from '@nestjs/common';
import {
  KnowledgeController,
  KnowledgeDeleteController,
} from './knowledge.controller.js';
import { KnowledgeService } from './knowledge.service.js';

@Module({
  controllers: [KnowledgeController, KnowledgeDeleteController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
