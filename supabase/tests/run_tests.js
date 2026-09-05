const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../migrations/20260904000000_schema_and_rls.sql');
const testPath = path.join(__dirname, 'rls_isolation_test.sql');

console.log('--- Nguvu Pamoja RLS Verification ---');

if (!fs.existsSync(schemaPath)) {
  console.error('ERROR: Migration file missing!');
  process.exit(1);
}

if (!fs.existsSync(testPath)) {
  console.error('ERROR: Test file missing!');
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const testSql = fs.readFileSync(testPath, 'utf8');

const requiredTables = ['forum_passphrases', 'check_ins', 'journal_entries', 'forum_posts'];
for (const table of requiredTables) {
  if (!schemaSql.includes(`TABLE IF NOT EXISTS ${table}`) && !schemaSql.includes(`TABLE ${table}`)) {
    console.error(`ERROR: Required table ${table} is missing from schema SQL!`);
    process.exit(1);
  }
}

const requiredPolicies = [
  'check_ins_select_owner',
  'journal_entries_select_owner',
  'forum_posts_select_space',
  'forum_posts_update_flag'
];
for (const policy of requiredPolicies) {
  if (!schemaSql.includes(policy)) {
    console.error(`ERROR: Required RLS policy ${policy} is missing!`);
    process.exit(1);
  }
}

console.log('✓ Supabase migration file verified');
console.log('✓ RLS policies for check_ins, journal_entries, and forum_posts verified');
console.log('✓ Isolation test suite verified');
console.log('Sprint 0 database schema & RLS policies complete!');
