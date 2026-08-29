import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('group_balances')
export class GroupBalance {
  @PrimaryColumn({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'net_balance', type: 'decimal', precision: 12, scale: 2 })
  netBalance!: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
