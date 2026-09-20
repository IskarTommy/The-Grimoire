import { Test, TestingModule } from '@nestjs/testing';
import { AnilistService } from './anilist.service';

describe('AnilistService', () => {
  let service: AnilistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnilistService],
    }).compile();

    service = module.get<AnilistService>(AnilistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
