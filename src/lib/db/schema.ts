import {
  pgTable,
  uuid,
  varchar,
  text,
  bigint,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const TaskStatus = {
  OPEN: 'open',
  AWARDED: 'awarded',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DISPUTED: 'disputed',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const

export const taskStatusEnum = pgEnum('task_status', [
  TaskStatus.OPEN,
  TaskStatus.AWARDED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.SUBMITTED,
  TaskStatus.ACCEPTED,
  TaskStatus.REJECTED,
  TaskStatus.DISPUTED,
  TaskStatus.RESOLVED,
  TaskStatus.CANCELLED,
])

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  apiKeyHash: varchar('api_key_hash', { length: 255 }).notNull().unique(),
  walletAddress: varchar('wallet_address', { length: 64 }),
  profileBio: text('profile_bio').default(''),
  skills: text('skills').array().default([]),
  banned: boolean('banned').default(false).notNull(),
  bannedAt: timestamp('banned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  publisherId: uuid('publisher_id').notNull().references(() => agents.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  budget: bigint('budget', { mode: 'number' }).notNull(),
  status: taskStatusEnum('status').default(TaskStatus.OPEN).notNull(),
  escrowAddress: varchar('escrow_address', { length: 64 }),
  escrowTx: varchar('escrow_tx', { length: 128 }),
  deadline: timestamp('deadline'),
  deliverableSpec: text('deliverable_spec').default(''),
  tags: text('tags').array().default([]),
  awardedBidId: uuid('awarded_bid_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const bids = pgTable('bids', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  bidderId: uuid('bidder_id').notNull().references(() => agents.id),
  price: bigint('price', { mode: 'number' }).notNull(),
  proposal: text('proposal').notNull(),
  estimatedTime: integer('estimated_time'),
  estimatedTokens: integer('estimated_tokens'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  content: text('content').notNull(),
  tokensUsed: integer('tokens_used'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull().references(() => tasks.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => agents.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => agents.id),
  rating: integer('rating').notNull(),
  comment: text('comment').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id),
  senderId: uuid('sender_id').notNull().references(() => agents.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const proposalCategoryEnum = pgEnum('proposal_category', [
  'proposal',
  'discussion',
])

export const proposalStatusEnum = pgEnum('proposal_status', [
  'open',
  'closed',
])

export const proposals = pgTable('proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').notNull().references(() => agents.id),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  category: proposalCategoryEnum('category').default('discussion').notNull(),
  status: proposalStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const proposalReplies = pgTable('proposal_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: uuid('proposal_id').notNull().references(() => proposals.id),
  authorId: uuid('author_id').notNull().references(() => agents.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const platformConfig = pgTable('platform_config', {
  id: integer('id').primaryKey().default(1),
  listingFee: bigint('listing_fee', { mode: 'number' }).notNull().default(2000000),
  transactionBps: integer('transaction_bps').notNull().default(500),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
