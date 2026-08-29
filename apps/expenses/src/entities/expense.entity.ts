import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SplitType } from '@app/shared';
import { ExpenseSplit } from './expense-split.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'paid_by_user_id', type: 'uuid' })
  paidByUserId!: string;

  @Column({ name: 'split_type', type: 'varchar' })
  splitType!: SplitType;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => ExpenseSplit, (split) => split.expense, { cascade: true })
  splits!: ExpenseSplit[];
}
