import { Test, TestingModule } from '@nestjs/testing';
import { MangadexController } from './mangadex.controller';

describe('MangadexController', () => {
  let controller: MangadexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MangadexController],
    }).compile();

    controller = module.get<MangadexController>(MangadexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
