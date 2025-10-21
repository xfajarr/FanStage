import * as z from "zod";
export const userSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email().optional(),
    bio: z.string().max(500).optional(),
    profileImageUrl: z.string().url().optional(),
    socialMediaLinks: z.string().optional(),
});
export const campaignSchema = z.object({
    projectTitle: z.string().min(5).max(256),
    shortDescription: z.string().min(10).max(256),
    ipfsHash: z.string().min(1),
    targetFundingToken: z.string().transform(Number).pipe(z.number().positive()),
    profitSharePercentage: z.number().min(1).max(99),
    deadline: z.string().transform((str) => new Date(str)),
    coverImageUrl: z.string().url().optional(),
});
export const investmentSchema = z.object({
    campaignId: z.number(),
    investedAmountToken: z.string().transform(Number).pipe(z.number().positive()),
    transactionHash: z.string().min(66).max(66),
    nftTokenId: z.number(),
});
export const artistTokenSchema = z.object({
    tokenName: z.string().min(2).max(50),
    tokenSymbol: z.string().min(2).max(10),
    tokenAddress: z.string().min(42).max(42),
});
export const campaignUpdateSchema = z.object({
    updateTitle: z.string().min(5).max(256),
    content: z.string().min(10),
    mediaUrl: z.string().url().optional(),
});
export const membershipPassSchema = z.object({
    artistId: z.string().min(1),
    passTier: z.string().min(1),
    nftTokenId: z.number(),
    mintTransactionHash: z.string().min(66).max(66),
});
