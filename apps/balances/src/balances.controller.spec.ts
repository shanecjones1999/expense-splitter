import { Test, TestingModule } from '@nestjs/testing';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';

describe('BalancesController', () => {
  let balancesController: BalancesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BalancesController],
      providers: [BalancesService],
    }).compile();

    balancesController = app.get<BalancesController>(BalancesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(balancesController.getHello()).toBe('Hello World!');
    });
  });
});
