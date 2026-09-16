import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MangadexService } from './mangadex.service';
import { MangadexController } from './mangadex.controller';

@Module({
    imports: [HttpModule],
    providers: [MangadexService],
    controllers: [MangadexController]
})
export class MangadexModule { }
