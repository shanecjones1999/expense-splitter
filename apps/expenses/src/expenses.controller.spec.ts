import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let expensesController: ExpensesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: {},
        },
      ],
    }).compile();

    expensesController = app.get<ExpensesController>(ExpensesController);
  });

  it('should be defined', () => {
    expect(expensesController).toBeDefined();
  });
});
