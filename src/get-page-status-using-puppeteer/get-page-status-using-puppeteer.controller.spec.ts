import { Test, TestingModule } from '@nestjs/testing';
import { GetPageStatusUsingPuppeteerController } from './get-page-status-using-puppeteer.controller';

describe('GetPageStatusUsingPuppeteerController', () => {
  let controller: GetPageStatusUsingPuppeteerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetPageStatusUsingPuppeteerController],
    }).compile();

    controller = module.get<GetPageStatusUsingPuppeteerController>(GetPageStatusUsingPuppeteerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
