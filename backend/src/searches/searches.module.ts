import { Module } from '@nestjs/common';
import { SearchesService } from './searches.service';
import { InspectApiService } from './inspect-api.service';
import { SearchesController } from './searches.controller';

@Module({
  controllers: [SearchesController],
  providers: [SearchesService, InspectApiService],
  exports: [SearchesService],
})
export class SearchesModule {}
