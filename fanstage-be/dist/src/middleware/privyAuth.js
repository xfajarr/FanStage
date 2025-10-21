import { PrivyClient } from '@privy-io/server-auth';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
// Initialize Privy client
const privy = new PrivyClient(process.env.PRIVY_APP_ID ?? '', process.env.PRIVY_APP_SECRET ?? ''
// You can also include the verification key directly to avoid API calls
// jwtVerificationKey: process.env.PRIVY_JWT_VERIFICATION_KEY || '',
);
/**
 * Middleware to verify Privy access tokens and authenticate users
 */
export async function privyAuthMiddleware(c, next) {
    try {
        // Extract the access token from the Authorization header
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Missing or invalid authorization header' }, 401);
        }
        const accessToken = authHeader.replace('Bearer ', '');
        // 🔍 Enhanced logging for debugging
        console.log('🔍 Verifying Privy access token...');
        console.log('Token length:', accessToken.length);
        console.log('Token prefix:', accessToken.substring(0, 20) + '...');
        // Verify the access token with Privy
        const verifiedClaims = await privy.verifyAuthToken(accessToken);
        // Extract the user's Privy DID (Decentralized Identifier)
        const privyDid = verifiedClaims.userId;
        console.log('✅ Token verified for user:', privyDid);
        console.log('📋 Token claims:', {
            appId: verifiedClaims.appId,
            sessionId: verifiedClaims.sessionId
        });
        // Get user info from Privy to obtain wallet address
        let walletAddress = null;
        try {
            const privyUser = await privy.getUserById(privyDid);
            console.log('🔍 Privy user data:', privyUser);
            // Extract wallet address from linked accounts
            if (privyUser.linkedAccounts && privyUser.linkedAccounts.length > 0) {
                const walletAccount = privyUser.linkedAccounts.find((account) => account.type === 'wallet' && account.address);
                if (walletAccount && walletAccount.address) {
                    walletAddress = walletAccount.address;
                    console.log('💳 Found real wallet address:', walletAddress);
                }
                else {
                    console.log('⚠️ No wallet address found in linked accounts');
                }
            }
            else {
                console.log('⚠️ No linked accounts found for user');
            }
        }
        catch (error) {
            console.error('⚠️ Could not fetch user from Privy:', error);
        }
        // Find user in our database by Privy DID
        let user = await db.select().from(users).where(eq(users.privyDid, privyDid)).limit(1);
        if (user.length === 0) {
            // User doesn't exist in our database yet, create a new user
            // Use real wallet address if available, otherwise temporary
            const finalWalletAddress = walletAddress || `temp_${privyDid.slice(-8)}`;
            console.log('👤 Creating new user in database...');
            console.log('Wallet address:', finalWalletAddress);
            const [newUser] = await db.insert(users).values({
                walletAddress: finalWalletAddress,
                privyDid,
                role: 'fan', // Default role
                username: `user_${privyDid.slice(-6)}`, // Default username
            }).returning();
            user = [newUser];
            console.log('✅ New user created:', newUser.walletAddress);
        }
        else {
            // Update existing user if we now have the real wallet address
            if (walletAddress && user[0].walletAddress.startsWith('temp_')) {
                console.log('🔄 Updating user with real wallet address...');
                const [updatedUser] = await db
                    .update(users)
                    .set({ walletAddress })
                    .where(eq(users.privyDid, privyDid))
                    .returning();
                user = [updatedUser];
                console.log('✅ User updated with real wallet address:', walletAddress);
            }
            else {
                console.log('👤 Existing user found:', user[0].walletAddress);
            }
        }
        // Set user and userWalletAddress in context for use in route handlers
        c.set('user', user[0]);
        c.set('userWalletAddress', user[0].walletAddress);
        console.log('🎯 Authentication successful for:', user[0].walletAddress);
        await next();
    }
    catch (error) {
        console.error('❌ Authentication error:', error);
        return c.json({ error: 'Invalid or expired access token' }, 401);
    }
}
/**
 * Middleware to ensure user is an artist
 */
export async function artistMiddleware(c, next) {
    const user = c.get('user');
    if (!user || user.role !== 'artist') {
        return c.json({ error: 'Artist access required' }, 403);
    }
    await next();
}
/**
 * Middleware to ensure user is an agency
 */
export async function agencyMiddleware(c, next) {
    const user = c.get('user');
    if (!user || user.role !== 'agency') {
        return c.json({ error: 'Agency access required' }, 403);
    }
    await next();
}
