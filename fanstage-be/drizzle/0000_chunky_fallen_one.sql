CREATE TYPE "public"."artist_category" AS ENUM('senior_star', 'rising_star');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('ongoing', 'funded', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('fan', 'artist', 'agency');--> statement-breakpoint
CREATE TABLE "artist_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" varchar(42) NOT NULL,
	"token_name" varchar(50) NOT NULL,
	"token_symbol" varchar(10) NOT NULL,
	"token_address" varchar(42) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artist_tokens_artist_id_unique" UNIQUE("artist_id"),
	CONSTRAINT "artist_tokens_token_address_unique" UNIQUE("token_address")
);
--> statement-breakpoint
CREATE TABLE "campaign_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"update_title" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"media_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" varchar(42) NOT NULL,
	"token_address" varchar(42) NOT NULL,
	"project_title" varchar(256) NOT NULL,
	"short_description" varchar(256) NOT NULL,
	"ipfs_hash" varchar(256) NOT NULL,
	"target_funding_token" numeric NOT NULL,
	"current_funding_token" numeric DEFAULT '0',
	"profit_share_percentage" integer NOT NULL,
	"campaign_status" "campaign_status" DEFAULT 'ongoing' NOT NULL,
	"cover_image_url" text,
	"deadline" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_ipfs_hash_unique" UNIQUE("ipfs_hash")
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"investor_id" varchar(42) NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"invested_amount_token" numeric NOT NULL,
	"nft_token_id" integer NOT NULL,
	"estimated_profit" numeric DEFAULT '0',
	"actual_payout_token" numeric DEFAULT '0',
	"payout_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "investments_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "membership_passes" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_id" varchar(42) NOT NULL,
	"owner_id" varchar(42) NOT NULL,
	"pass_tier" varchar(50) NOT NULL,
	"nft_token_id" integer NOT NULL,
	"mint_transaction_hash" varchar(66) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_passes_mint_transaction_hash_unique" UNIQUE("mint_transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"wallet_address" varchar(42) PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'fan' NOT NULL,
	"artist_category" "artist_category",
	"username" varchar(256) NOT NULL,
	"email" varchar(256),
	"bio" text,
	"profile_image_url" text,
	"social_media_links" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "artist_tokens" ADD CONSTRAINT "artist_tokens_artist_id_users_wallet_address_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."users"("wallet_address") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_artist_id_users_wallet_address_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_token_address_artist_tokens_token_address_fk" FOREIGN KEY ("token_address") REFERENCES "public"."artist_tokens"("token_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investments" ADD CONSTRAINT "investments_investor_id_users_wallet_address_fk" FOREIGN KEY ("investor_id") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_passes" ADD CONSTRAINT "membership_passes_artist_id_users_wallet_address_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_passes" ADD CONSTRAINT "membership_passes_owner_id_users_wallet_address_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;