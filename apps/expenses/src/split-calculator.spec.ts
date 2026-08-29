import { SplitType } from '@app/shared/enums/split-type.enum';
import { computeSplits } from './split-calculator';

describe('computeSplits', () => {
  it('splits equally among members', () => {
    const splits = computeSplits({
      groupId: 'g1',
      description: 'Dinner',
      amount: 90,
      paidByUserId: 'u1',
      splitType: SplitType.EQUAL,
      splits: [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }],
      expenseDate: '2026-08-28',
    });

    expect(splits).toHaveLength(3);
    expect(splits.reduce((sum, split) => sum + split.amount, 0)).toBe(90);
    expect(splits.every((split) => split.amount === 30)).toBe(true);
  });

  it('validates exact split totals', () => {
    expect(() =>
      computeSplits({
        groupId: 'g1',
        description: 'Taxi',
        amount: 50,
        paidByUserId: 'u1',
        splitType: SplitType.EXACT,
        splits: [
          { userId: 'u1', amount: 20 },
          { userId: 'u2', amount: 20 },
        ],
        expenseDate: '2026-08-28',
      }),
    ).toThrow('Exact split amounts must sum to expense total');
  });
});
