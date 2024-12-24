import { Test, TestingModule } from '@nestjs/testing';
import { AllhamullilahController } from './allhamullilah.controller';

describe('AllhamullilahController', () => {
  let controller: AllhamullilahController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllhamullilahController],
    }).compile();

    controller = module.get<AllhamullilahController>(AllhamullilahController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
