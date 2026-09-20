import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnilistService } from './anilist.service';
import { AnilistController } from './anilist.controller';

@Module({
  imports: [HttpModule],
  providers: [AnilistService],
  controllers: [AnilistController]
})
export class AnilistModule { }
