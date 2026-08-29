import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let expensesController: ExpensesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [ExpensesService],
    }).compile();

    expensesController = app.get<ExpensesController>(ExpensesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(expensesController.getHello()).toBe('Hello World!');
    });
  });
});
