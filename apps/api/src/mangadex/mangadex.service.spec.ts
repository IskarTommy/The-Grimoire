import { Test, TestingModule } from '@nestjs/testing';
import { MangadexService } from './mangadex.service';

describe('MangadexService', () => {
  let service: MangadexService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MangadexService],
    }).compile();

    service = module.get<MangadexService>(MangadexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
