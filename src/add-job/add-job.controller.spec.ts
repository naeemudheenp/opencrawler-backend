import { Test, TestingModule } from '@nestjs/testing';
import { AddJobController } from './add-job.controller';

describe('AddJobController', () => {
  let controller: AddJobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddJobController],
    }).compile();

    controller = module.get<AddJobController>(AddJobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
