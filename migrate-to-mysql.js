#!/usr/bin/env node

/**
 * Migration utility untuk switch dari API lama ke API v2 (MySQL-ready)
 * 
 * Usage:
 *   node migrate-to-mysql.js
 * 
 * What it does:
 * 1. Update all frontend API calls dari /api/auth/* ke /api/auth-v2/*
 * 2. Update chat API dari /api/chat ke /api/chat-v2
 * 3. No changes needed - API v2 auto-detects MySQL or file storage
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'frontend/src/components/AuthMenu.jsx',
  'frontend/src/components/LoginMenu.jsx',
  'frontend/src/components/Chat.jsx',
  'frontend/src/components/AdminDashboard.jsx',
  'frontend/src/App.js'
];

console.log('🔄 Migrating to MySQL-ready API v2...\n');

let totalChanges = 0;

filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;
  
  // Replace auth API endpoints
  const authReplacements = [
    [/\/api\/auth\/register/g, '/api/auth-v2/register'],
    [/\/api\/auth\/login/g, '/api/auth-v2/login'],
    [/\/api\/auth\/verify/g, '/api/auth-v2/verify'],
    [/\/api\/auth\/users/g, '/api/auth-v2/users']
  ];
  
  authReplacements.forEach(([regex, replacement]) => {
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replacement);
      changes += matches.length;
    }
  });
  
  // Replace chat API endpoint
  const chatMatches = content.match(/\/api\/chat(?!-v2)/g);
  if (chatMatches) {
    content = content.replace(/\/api\/chat(?!-v2)/g, '/api/chat-v2');
    changes += chatMatches.length;
  }
  
  if (changes > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${file}: ${changes} API calls updated`);
    totalChanges += changes;
  } else {
    console.log(`   ${file}: Already up-to-date`);
  }
});

console.log(`\n✅ Migration complete! ${totalChanges} total changes\n`);

if (totalChanges > 0) {
  console.log('Next steps:');
  console.log('1. Setup MySQL (see MYSQL_SETUP.md)');
  console.log('2. Add DATABASE_URL to Vercel environment variables');
  console.log('3. git add . && git commit -m "migrate to MySQL API v2"');
  console.log('4. git push');
  console.log('\nAPI will auto-fallback to file storage if MySQL not configured.\n');
} else {
  console.log('No changes needed - already using API v2!\n');
}
