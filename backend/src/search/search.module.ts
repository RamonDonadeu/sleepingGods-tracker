import { Module } from '@nestjs/common';
import { LocationsModule } from '../locations/locations.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';

@Module({
  imports: [LocationsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
