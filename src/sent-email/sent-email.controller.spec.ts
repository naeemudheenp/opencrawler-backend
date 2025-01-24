import { Test, TestingModule } from '@nestjs/testing';
import { SentEmailController } from './sent-email.controller';

describe('SentEmailController', () => {
  let controller: SentEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SentEmailController],
    }).compile();

    controller = module.get<SentEmailController>(SentEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
