import { db } from '../src/db/index.js';
import { 
  users, 
  artistTokens, 
  campaigns, 
  campaignUpdates, 
  investments, 
  membershipPasses 
} from '../src/db/schema.js';

async function resetDatabase() {
  try {
    console.log('🗑️  Starting complete database reset...');
    console.log('⚠️  WARNING: This will delete ALL data from ALL tables!');
    
    // Delete in order that respects foreign key constraints
    console.log('🔄 Deleting campaign updates...');
    await db.delete(campaignUpdates);
    
    console.log('🔄 Deleting investments...');
    await db.delete(investments);
    
    console.log('🔄 Deleting membership passes...');
    await db.delete(membershipPasses);
    
    console.log('🔄 Deleting campaigns...');
    await db.delete(campaigns);
    
    console.log('🔄 Deleting artist tokens...');
    await db.delete(artistTokens);
    
    console.log('🔄 Deleting users...');
    await db.delete(users);
    
    console.log('✅ Database reset completed successfully!');
    console.log('📊 All tables are now empty');
    
    // Verify the reset
    console.log('\n🔍 Verifying reset...');
    const userCount = await db.select().from(users);
    const artistTokenCount = await db.select().from(artistTokens);
    const campaignCount = await db.select().from(campaigns);
    
    console.log(`👥 Users: ${userCount.length}`);
    console.log(`🎨 Artist Tokens: ${artistTokenCount.length}`);
    console.log(`📋 Campaigns: ${campaignCount.length}`);
    
    if (userCount.length === 0 && artistTokenCount.length === 0 && campaignCount.length === 0) {
      console.log('\n🎉 Database successfully reset to clean state!');
      console.log('\n📝 Next steps:');
      console.log('1. Refresh your browser');
      console.log('2. Connect your wallet');
      console.log('3. Register as artist from scratch');
      console.log('4. Test campaign creation');
      console.log('5. Verify indexer picks up events');
    } else {
      console.log('\n⚠️  Reset verification failed - some data still exists');
    }
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    process.exit(0);
  }
}

console.log('='.repeat(60));
console.log('🗑️  COMPLETE DATABASE RESET');
console.log('='.repeat(60));
console.log('⚠️  This will permanently delete ALL data!');
console.log('   - All users');
console.log('   - All artist registrations');
console.log('   - All campaigns');
console.log('   - All investments');
console.log('   - All tokens');
console.log('='.repeat(60));

resetDatabase();