import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';
import { KeywordsModule } from './keywords/keywords.module.js';
import { KnowledgeModule } from './knowledge/knowledge.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SearchModule } from './search/search.module.js';
import { TotemsModule } from './totems/totems.module.js';
import { VisitsModule } from './visits/visits.module.js';

@Module({
  imports: [
    PrismaModule,
    CampaignsModule,
    LocationsModule,
    VisitsModule,
    KeywordsModule,
    TotemsModule,
    SearchModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
