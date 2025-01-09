import { Test, TestingModule } from '@nestjs/testing';
import { FetchUsingUrlService } from './fetch-using-url.service';

describe('FetchUsingUrlService', () => {
  let service: FetchUsingUrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchUsingUrlService],
    }).compile();

    service = module.get<FetchUsingUrlService>(FetchUsingUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
