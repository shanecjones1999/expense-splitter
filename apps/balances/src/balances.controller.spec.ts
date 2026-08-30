import { Test, TestingModule } from '@nestjs/testing';
import { InternalBalancesController } from './internal-balances.controller';
import { BalancesService } from './balances.service';

describe('InternalBalancesController', () => {
  let balancesController: InternalBalancesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InternalBalancesController],
      providers: [
        {
          provide: BalancesService,
          useValue: {},
        },
      ],
    }).compile();

    balancesController = app.get<InternalBalancesController>(
      InternalBalancesController,
    );
  });

  it('should be defined', () => {
    expect(balancesController).toBeDefined();
  });
});
