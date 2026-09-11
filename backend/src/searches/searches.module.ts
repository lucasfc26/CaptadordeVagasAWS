import { Module } from '@nestjs/common';
import { SearchesService } from './searches.service';
import { SearchesController } from './searches.controller';

@Module({
  controllers: [SearchesController],
  providers: [SearchesService],
  exports: [SearchesService],
})
export class SearchesModule {}
