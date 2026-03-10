# Drizzle ORM Tips & Gotchas

## 循环引用外键 {#circular-reference-fk}

**问题**：当两个表互相引用时（如 tasks.awardedBidId → bids.id，bids.taskId → tasks.id），不能在 schema.ts 中用 inline `.references()` 定义外键约束。Drizzle 在加载 schema 时会因循环依赖而报错或生成不正确的 migration。

**解决方案**：在 schema.ts 中只定义列（不加 `.references()`），然后在 migration SQL 中手动添加 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...`。

```typescript
// schema.ts — 只定义列，不加 .references()
awardedBidId: uuid('awarded_bid_id'),  // 不写 .references(() => bids.id)
```

```sql
-- migration SQL — 手动添加 FK
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_awarded_bid
  FOREIGN KEY (awarded_bid_id) REFERENCES bids(id);
```

**适用场景**：任何两表之间存在双向引用的情况。

## defaultNow() 不会自动更新 {#updated-at-on-update}

**问题**：Drizzle 的 `.defaultNow()` 或 `.default(sql\`now()\`)` 只在 INSERT 时生效，UPDATE 时不会自动更新。PostgreSQL 本身也不支持 `ON UPDATE CURRENT_TIMESTAMP`（那是 MySQL 特性）。

**解决方案**：在 schema 定义中使用 Drizzle 的 `.$onUpdate()` hook：

```typescript
updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
```

这样每次调用 Drizzle 的 `.update()` 方法时，`updatedAt` 会自动设置为当前时间。

**注意**：`$onUpdate` 是 Drizzle ORM 层面的 hook，不是数据库层面的 trigger。直接用 SQL 更新（不通过 Drizzle）不会触发它。如果需要数据库层面的自动更新，需要创建 PostgreSQL trigger。

## Drizzle Relations vs Foreign Keys {#relations-vs-fk}

Drizzle 的 `relations()` 定义（用于 query builder 的 `.with()` 等）和 `.references()` 外键约束是两个独立的概念：
- `relations()` 是 ORM 层面的关联定义，不生成 DDL
- `.references()` 是数据库层面的外键约束，会生成 DDL

两者可以独立存在。对于循环引用的情况，可以只定义 `relations()` 而不定义 `.references()`，外键约束通过 migration SQL 手动添加。
