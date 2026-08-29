import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CreateExpenseBody, SplitType } from '../api/types';
import { todayISODate } from '../lib/format';

interface ExpenseFormProps {
  members: { userId: string }[];
  currentUserId: string;
  nameOf: (userId: string) => string;
  onSubmit: (body: CreateExpenseBody) => Promise<void>;
}

export function ExpenseForm({
  members,
  currentUserId,
  nameOf,
  onSubmit,
}: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidByUserId, setPaidByUserId] = useState(currentUserId);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [expenseDate, setExpenseDate] = useState(todayISODate());
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((member) => [member.userId, true])),
  );
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSelected((current) => {
      const next = { ...current };
      let changed = false;
      for (const member of members) {
        if (next[member.userId] === undefined) {
          next[member.userId] = true;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [members]);

  const chosenIds = useMemo(
    () => members.map((member) => member.userId).filter((id) => selected[id]),
    [members, selected],
  );

  function toggleMember(userId: string) {
    setSelected((current) => ({ ...current, [userId]: !current[userId] }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01) {
      setError('Enter an amount greater than 0');
      return;
    }
    if (chosenIds.length === 0) {
      setError('Pick at least one person to split with');
      return;
    }

    let splits: CreateExpenseBody['splits'];
    if (splitType === 'equal') {
      splits = chosenIds.map((userId) => ({ userId }));
    } else if (splitType === 'exact') {
      splits = chosenIds.map((userId) => ({
        userId,
        amount: Number(amounts[userId] || 0),
      }));
      const sum = splits.reduce((total, split) => total + (split.amount ?? 0), 0);
      if (Math.round(sum * 100) !== Math.round(parsedAmount * 100)) {
        setError('Exact amounts must add up to the expense total');
        return;
      }
    } else {
      splits = chosenIds.map((userId) => ({
        userId,
        percentage: Number(percentages[userId] || 0),
      }));
      const sum = splits.reduce(
        (total, split) => total + (split.percentage ?? 0),
        0,
      );
      if (Math.round(sum * 100) / 100 !== 100) {
        setError('Percentages must add up to 100');
        return;
      }
    }

    setPending(true);
    try {
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        paidByUserId,
        splitType,
        splits,
        expenseDate,
      });
      setDescription('');
      setAmount('');
      setAmounts({});
      setPercentages({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add expense');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <label className="field">
        <span>Description</span>
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Dinner, groceries, gas…"
          required
        />
      </label>
      <div className="row">
        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            required
          />
        </label>
      </div>
      <label className="field">
        <span>Paid by</span>
        <select
          value={paidByUserId}
          onChange={(event) => setPaidByUserId(event.target.value)}
        >
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {nameOf(member.userId)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Split</span>
        <select
          value={splitType}
          onChange={(event) => setSplitType(event.target.value as SplitType)}
        >
          <option value="equal">Equally</option>
          <option value="exact">Exact amounts</option>
          <option value="percentage">Percentages</option>
        </select>
      </label>
      <div className="split-list">
        {members.map((member) => (
          <label key={member.userId} className="split-item">
            <span className="row">
              <input
                type="checkbox"
                checked={!!selected[member.userId]}
                onChange={() => toggleMember(member.userId)}
              />
              {nameOf(member.userId)}
            </span>
            {splitType === 'exact' && selected[member.userId] ? (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amounts[member.userId] ?? ''}
                onChange={(event) =>
                  setAmounts((current) => ({
                    ...current,
                    [member.userId]: event.target.value,
                  }))
                }
              />
            ) : null}
            {splitType === 'percentage' && selected[member.userId] ? (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="%"
                value={percentages[member.userId] ?? ''}
                onChange={(event) =>
                  setPercentages((current) => ({
                    ...current,
                    [member.userId]: event.target.value,
                  }))
                }
              />
            ) : null}
          </label>
        ))}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add expense'}
      </button>
    </form>
  );
}
