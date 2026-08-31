import { Module } from '@nestjs/common';
import { TotemsController } from './totems.controller.js';
import { TotemsService } from './totems.service.js';

@Module({
  controllers: [TotemsController],
  providers: [TotemsService],
})
export class TotemsModule {}
