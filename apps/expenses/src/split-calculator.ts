import { BadRequestException } from '@nestjs/common';
import {
  CreateExpenseDto,
  ExpenseSplitInputDto,
  SplitType,
} from '@app/shared';

export interface ComputedSplit {
  userId: string;
  amount: number;
}

export function computeSplits(dto: CreateExpenseDto): ComputedSplit[] {
  switch (dto.splitType) {
    case SplitType.EQUAL:
      return computeEqualSplits(dto.amount, dto.splits);
    case SplitType.EXACT:
      return computeExactSplits(dto.amount, dto.splits);
    case SplitType.PERCENTAGE:
      return computePercentageSplits(dto.amount, dto.splits);
    default:
      throw new BadRequestException('Unsupported split type');
  }
}

function computeEqualSplits(
  total: number,
  splits: ExpenseSplitInputDto[],
): ComputedSplit[] {
  const memberIds = splits.map((split) => split.userId);
  const rawShare = total / memberIds.length;
  const roundedShares = distributeCents(total, memberIds.length);

  return memberIds.map((userId, index) => ({
    userId,
    amount: roundedShares[index] ?? round2(rawShare),
  }));
}

function computeExactSplits(
  total: number,
  splits: ExpenseSplitInputDto[],
): ComputedSplit[] {
  const computed = splits.map((split) => {
    if (split.amount === undefined) {
      throw new BadRequestException('Exact splits require amount per member');
    }
    return { userId: split.userId, amount: round2(split.amount) };
  });

  const sum = round2(computed.reduce((acc, split) => acc + split.amount, 0));
  if (sum !== round2(total)) {
    throw new BadRequestException('Exact split amounts must sum to expense total');
  }

  return computed;
}

function computePercentageSplits(
  total: number,
  splits: ExpenseSplitInputDto[],
): ComputedSplit[] {
  const percentages = splits.map((split) => {
    if (split.percentage === undefined) {
      throw new BadRequestException(
        'Percentage splits require percentage per member',
      );
    }
    return { userId: split.userId, percentage: split.percentage };
  });

  const sumPct = round2(
    percentages.reduce((acc, split) => acc + split.percentage, 0),
  );
  if (sumPct !== 100) {
    throw new BadRequestException('Percentages must sum to 100');
  }

  const rawAmounts = percentages.map((split) =>
    round2((total * split.percentage) / 100),
  );
  const adjusted = distributeCents(
    total,
    rawAmounts.length,
    rawAmounts.map((amount) => amount / total),
  );

  return percentages.map((split, index) => ({
    userId: split.userId,
    amount: adjusted[index] ?? rawAmounts[index],
  }));
}

function distributeCents(
  total: number,
  count: number,
  weights?: number[],
): number[] {
  const totalCents = Math.round(total * 100);
  const normalizedWeights =
    weights ??
    Array.from({ length: count }, () => 1 / count);

  const raw = normalizedWeights.map((weight) => totalCents * weight);
  const floored = raw.map((value) => Math.floor(value));
  let remainder = totalCents - floored.reduce((acc, value) => acc + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floored];
  for (const item of order) {
    if (remainder <= 0) {
      break;
    }
    result[item.index] += 1;
    remainder -= 1;
  }

  return result.map((cents) => round2(cents / 100));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
