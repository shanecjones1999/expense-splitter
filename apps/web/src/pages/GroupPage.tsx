import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type {
  CreateExpenseBody,
  Expense,
  Group,
  GroupBalance,
  Settlement,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { AppNav } from '../components/AppNav';
import { ExpenseForm } from '../components/ExpenseForm';
import { useUserDirectory } from '../hooks/useUserDirectory';
import { formatDate, formatMoney, initials } from '../lib/format';

export function GroupPage() {
  const { groupId = '' } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<GroupBalance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [settling, setSettling] = useState(false);

  const memberIds = useMemo(
    () => (group?.members ?? []).map((member) => member.userId),
    [group],
  );
  /**
   * Collects extra user IDs involved in group expenses and settlements, beyond regular group members.
   * - From each expense, includes the user who paid (paidByUserId) and all users involved in splits.
   * - From each settlement, includes both the payer (fromUserId) and the recipient (toUserId).
   * This ensures that the user directory covers all users who have participated in group financial actions,
   * even if they are not listed as group members.
   */
  const extraIds = useMemo(
    () => [
      // From expenses: paidByUserId and split userIds
      ...expenses.flatMap((expense) => [
        expense.paidByUserId,
        ...expense.splits.map((split) => split.userId),
      ]),
      // From settlements: fromUserId and toUserId
      ...settlements.flatMap((settlement) => [
        settlement.fromUserId,
        settlement.toUserId,
      ]),
    ],
    [expenses, settlements],
  );
  const { nameOf, emailOf } = useUserDirectory([...memberIds, ...extraIds]);

  const myBalance =
    balances.find((balance) => balance.userId === user?.id)?.netBalance ?? 0;

  useEffect(() => {
    if (!groupId) {
      return;
    }
    let cancelled = false;

    async function load() {
      try {
        const [nextGroup, nextExpenses, nextBalances, nextSettlements] =
          await Promise.all([
            api.getGroup(groupId),
            api.listExpenses(groupId),
            api.getBalances(groupId),
            api.listSettlements(groupId),
          ]);
        if (cancelled) {
          return;
        }
        setGroup(nextGroup);
        setExpenses(nextExpenses);
        setBalances(nextBalances);
        setSettlements(nextSettlements);
        if (nextGroup.members?.length) {
          setSettleTo(
            (current) =>
              current ||
              nextGroup.members?.find((member) => member.userId !== user?.id)
                ?.userId ||
              '',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load group');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId, user?.id]);

  async function refreshBalancesSoon() {
    const refresh = async () => {
      const next = await api.getBalances(groupId);
      setBalances(next);
    };
    await refresh();
    window.setTimeout(() => {
      void refresh();
    }, 700);
  }

  async function handleAddExpense(body: CreateExpenseBody) {
    const expense = await api.createExpense(groupId, body);
    setExpenses((current) => [expense, ...current]);
    await refreshBalancesSoon();
  }

  async function handleDeleteExpense(expenseId: string) {
    setError(null);
    try {
      await api.deleteExpense(expenseId);
      setExpenses((current) =>
        current.filter((expense) => expense.id !== expenseId),
      );
      await refreshBalancesSoon();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove expense',
      );
    }
  }

  async function handleAddMember(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setAddingMember(true);
    try {
      const next = await api.addMember(groupId, memberEmail.trim());
      setGroup(next);
      setMemberEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    setError(null);
    try {
      const next = await api.removeMember(groupId, userId);
      setGroup(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
    }
  }

  async function handleSettle(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const amount = Number(settleAmount);
    if (!settleTo || !Number.isFinite(amount) || amount < 0.01) {
      setError('Pick someone and an amount to settle');
      return;
    }
    setSettling(true);
    try {
      const settlement = await api.createSettlement(groupId, {
        toUserId: settleTo,
        amount,
        note: settleNote.trim() || undefined,
      });
      setSettlements((current) => [settlement, ...current]);
      setSettleAmount('');
      setSettleNote('');
      await refreshBalancesSoon();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not record settlement',
      );
    } finally {
      setSettling(false);
    }
  }

  if (!group) {
    return (
      <div className="page">
        <AppNav />
        {error ? (
          <p className="error">{error}</p>
        ) : (
          <p className="muted">Opening group…</p>
        )}
      </div>
    );
  }

  const members = group.members ?? [];
  const others = members.filter((member) => member.userId !== user?.id);

  return (
    <div className="page">
      <AppNav crumb={group.name} />
      <div className="card balance-hero">
        <p className="kicker" style={{ color: '#d7e4d4' }}>
          {group.name} · {group.currency}
        </p>
        <p className="amount">
          {myBalance >= 0
            ? `You are owed ${formatMoney(myBalance, group.currency)}`
            : `You owe ${formatMoney(Math.abs(myBalance), group.currency)}`}
        </p>
        <div className="chips">
          {balances.length === 0 ? (
            <span className="chip">No balances yet</span>
          ) : (
            balances.map((balance) => (
              <span key={balance.userId} className="chip">
                {nameOf(balance.userId)} {balance.netBalance >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(balance.netBalance), group.currency)}
              </span>
            ))
          )}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="layout">
        <section className="card panel stack">
          <div>
            <p className="kicker">Expenses</p>
            <h2>The running tab</h2>
          </div>
          {members.length > 0 && user ? (
            <ExpenseForm
              members={members}
              currentUserId={user.id}
              nameOf={nameOf}
              onSubmit={handleAddExpense}
            />
          ) : null}
          {expenses.length === 0 ? (
            <p className="empty">
              No expenses yet. Add dinner, rent, or a round of drinks.
            </p>
          ) : (
            <div className="ledger">
              {expenses.map((expense) => (
                <div key={expense.id} className="ledger-row">
                  <div>
                    <strong>{expense.description}</strong>
                    <div className="muted">
                      {formatDate(expense.expenseDate)} · paid by{' '}
                      {nameOf(expense.paidByUserId)} · {expense.splitType}
                    </div>
                  </div>
                  <strong>{formatMoney(expense.amount, group.currency)}</strong>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => void handleDeleteExpense(expense.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="stack">
          <section className="card panel stack">
            <div>
              <p className="kicker">People</p>
              <h2>Members</h2>
            </div>
            {members.map((member) => (
              <div key={member.id} className="member-row">
                <div className="row">
                  <span className="avatar">
                    {initials(nameOf(member.userId))}
                  </span>
                  <div>
                    <div>
                      {nameOf(member.userId)}{' '}
                      {member.role === 'owner' ? '· owner' : ''}
                    </div>
                    <div className="muted">{emailOf(member.userId) ?? '…'}</div>
                  </div>
                </div>
                {member.userId !== group.createdBy ? (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => void handleRemoveMember(member.userId)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            <form className="stack" onSubmit={handleAddMember}>
              <label className="field">
                <span>Add by email</span>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="friend@example.com"
                  required
                />
              </label>
              <button className="btn" type="submit" disabled={addingMember}>
                {addingMember ? 'Adding…' : 'Add member'}
              </button>
            </form>
          </section>

          <section className="card panel stack">
            <div>
              <p className="kicker">Settle up</p>
              <h2>Record a payment</h2>
            </div>
            {others.length === 0 ? (
              <p className="muted">Invite someone before you can settle.</p>
            ) : (
              <form className="stack" onSubmit={handleSettle}>
                <label className="field">
                  <span>You paid</span>
                  <select
                    value={settleTo}
                    onChange={(event) => setSettleTo(event.target.value)}
                  >
                    {others.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {nameOf(member.userId)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={settleAmount}
                    onChange={(event) => setSettleAmount(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>Note</span>
                  <input
                    value={settleNote}
                    onChange={(event) => setSettleNote(event.target.value)}
                    placeholder="Venmo, cash, covered coffee…"
                  />
                </label>
                <button className="btn" type="submit" disabled={settling}>
                  {settling ? 'Saving…' : 'Record settlement'}
                </button>
              </form>
            )}
            {settlements.length > 0 ? (
              <div className="ledger">
                {settlements.map((settlement) => (
                  <div key={settlement.id} className="muted">
                    {nameOf(settlement.fromUserId)} paid{' '}
                    {nameOf(settlement.toUserId)}{' '}
                    {formatMoney(settlement.amount, group.currency)}
                    {settlement.note ? ` · ${settlement.note}` : ''}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
