import { pgTable, serial, text, varchar, boolean, timestamp, integer, pgEnum, decimal, primaryKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
export const userRole = pgEnum('user_role', ['fan', 'artist', 'agency']);
export const artistCategory = pgEnum('artist_category', ['senior_star', 'rising_star']);
export const campaignStatus = pgEnum('campaign_status', ['ongoing', 'funded', 'completed', 'cancelled']);
export const users = pgTable('users', {
    walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
    privyDid: varchar('privy_did', { length: 256 }).unique(),
    role: userRole('role').notNull().default('fan'),
    artistCategory: artistCategory('artist_category'),
    username: varchar('username', { length: 256 }).unique().notNull(),
    email: varchar('email', { length: 256 }).unique(),
    bio: text('bio'),
    profileImagUrl: text('profile_image_url'),
    socialMediaLinks: text('social_media_links'),
    createdAt: timestamp('created_at').notNull().default(sql `now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql `now()`),
}, (table) => ({
    pk: primaryKey({ columns: [table.walletAddress] }),
}));
export const usersRelations = relations(users, ({ many, one }) => ({
    campaigns: many(campaigns),
    investments: many(investments),
    artistToken: one(artistTokens, {
        fields: [users.walletAddress],
        references: [artistTokens.artistId,]
    }),
}));
export const artistTokens = pgTable('artist_tokens', {
    id: serial('id').primaryKey(),
    artistId: varchar('artist_id', { length: 42 }).references(() => users.walletAddress, { onDelete: 'cascade' }).notNull().unique(),
    tokenName: varchar('token_name', { length: 50 }).notNull(),
    tokenSymbol: varchar('token_symbol', { length: 10 }).notNull(),
    tokenAddress: varchar('token_address', { length: 42 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().default(sql `now()`),
});
export const artistTokensRelations = relations(artistTokens, ({ one, many }) => ({
    artist: one(users, {
        fields: [artistTokens.artistId],
        references: [users.walletAddress],
    }),
    campaigns: many(campaigns),
}));
export const campaigns = pgTable('campaigns', {
    id: serial('id').primaryKey(),
    artistId: varchar('artist_id', { length: 42 }).references(() => users.walletAddress).notNull(),
    tokenAddress: varchar('token_address', { length: 42 }).references(() => artistTokens.tokenAddress).notNull(),
    projectTitle: varchar('project_title', { length: 256 }).notNull(),
    shortDescription: varchar('short_description', { length: 256 }).notNull(),
    ipfsHash: varchar('ipfs_hash', { length: 256 }).notNull().unique(),
    targetFundingToken: decimal('target_funding_token').notNull(),
    currentFundingToken: decimal('current_funding_token').default('0'),
    profitSharePercentage: integer('profit_share_percentage').notNull(),
    campaignStatus: campaignStatus('campaign_status').notNull().default('ongoing'),
    coverImageUrl: text('cover_image_url'),
    deadline: timestamp('deadline').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql `now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql `now()`),
});
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
    artist: one(users, {
        fields: [campaigns.artistId],
        references: [users.walletAddress],
    }),
    investments: many(investments),
    updates: many(campaignUpdates),
}));
export const campaignUpdates = pgTable('campaign_updates', {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
    updateTitle: varchar('update_title', { length: 256 }).notNull(),
    content: text('content').notNull(),
    mediaUrl: text('media_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const campaignUpdatesRelations = relations(campaignUpdates, ({ one }) => ({
    campaign: one(campaigns, {
        fields: [campaignUpdates.campaignId],
        references: [campaigns.id],
    }),
}));
export const investments = pgTable('investments', {
    id: serial('id').primaryKey(),
    campaignId: integer('campaign_id').references(() => campaigns.id).notNull(),
    investorId: varchar('investor_id', { length: 42 }).references(() => users.walletAddress).notNull(),
    transactionHash: varchar('transaction_hash', { length: 66 }).notNull().unique(), // Hash transaksi mint/transfer
    investedAmountToken: decimal('invested_amount_token').notNull(),
    nftTokenId: integer('nft_token_id').notNull(),
    estimatedProfit: decimal('estimated_profit').default('0'),
    actualPayoutToken: decimal('actual_payout_token').default('0'),
    payoutStatus: varchar('payout_status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const investmentsRelations = relations(investments, ({ one }) => ({
    campaign: one(campaigns, {
        fields: [investments.campaignId],
        references: [campaigns.id],
    }),
    investor: one(users, {
        fields: [investments.investorId],
        references: [users.walletAddress],
    }),
}));
export const membershipPasses = pgTable('membership_passes', {
    id: serial('id').primaryKey(),
    artistId: varchar('artist_id', { length: 42 }).references(() => users.walletAddress).notNull(),
    ownerId: varchar('owner_id', { length: 42 }).references(() => users.walletAddress).notNull(),
    passTier: varchar('pass_tier', { length: 50 }).notNull(),
    nftTokenId: integer('nft_token_id').notNull(),
    mintTransactionHash: varchar('mint_transaction_hash', { length: 66 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});
export const membershipPassesRelations = relations(membershipPasses, ({ one }) => ({
    artist: one(users, {
        fields: [membershipPasses.artistId],
        references: [users.walletAddress],
    }),
    owner: one(users, {
        fields: [membershipPasses.ownerId],
        references: [users.walletAddress],
    }),
}));
