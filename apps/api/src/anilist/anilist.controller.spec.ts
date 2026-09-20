import { Test, TestingModule } from '@nestjs/testing';
import { AnilistController } from './anilist.controller';

describe('AnilistController', () => {
  let controller: AnilistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnilistController],
    }).compile();

    controller = module.get<AnilistController>(AnilistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
