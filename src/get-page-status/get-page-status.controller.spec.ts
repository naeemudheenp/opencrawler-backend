import { Test, TestingModule } from '@nestjs/testing';
import { GetPageStatusController } from './get-page-status.controller';

describe('GetPageStatusController', () => {
  let controller: GetPageStatusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPageStatusController],
    }).compile();

    controller = module.get<GetPageStatusController>(GetPageStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
