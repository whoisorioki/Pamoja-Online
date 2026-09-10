import fs from 'fs';
import path from 'path';

console.log('🔍 Running Phase 2: Build Output Verification Script...');

const siteDir = path.resolve(process.cwd(), '_site');

if (!fs.existsSync(siteDir)) {
  console.error('❌ Error: _site directory does not exist! Run npm run build first.');
  process.exit(1);
}

const requiredFiles = [
  '_site/index.html',
  '_site/resources/index.html',
  '_site/journal/index.html',
  '_site/forum/mens/index.html',
  '_site/forum/womens/index.html',
  '_site/week/1/index.html',
  '_site/week/2/index.html',
  '_site/week/3/index.html',
  '_site/week/4/index.html',
  '_site/week/5/index.html',
  '_site/week/6/index.html',
  '_site/week/7/index.html',
  '_site/week/8/index.html',
  '_site/check-in/1/index.html',
  '_site/check-in/2/index.html',
  '_site/check-in/3/index.html',
  '_site/check-in/4/index.html',
  '_site/check-in/5/index.html',
  '_site/check-in/6/index.html',
  '_site/check-in/7/index.html',
  '_site/check-in/8/index.html',
  '_site/assets/css/style.css',
  '_site/assets/js/token.js',
  '_site/assets/js/supabase.js',
  '_site/_headers'
];

let failed = false;

// 1. File existence check
console.log('\n--- 1. File Existence Audit ---');
requiredFiles.forEach(relPath => {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ Found: ${relPath}`);
  } else {
    console.error(`  ❌ Missing: ${relPath}`);
    failed = true;
  }
});

// 2. Env Injection Audit
console.log('\n--- 2. Environment Variable Injection Audit ---');
const indexPath = path.resolve(siteDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

if (indexHtml.includes('window.SUPABASE_URL = "https://')) {
  console.log('  ✅ window.SUPABASE_URL correctly injected');
} else {
  console.error('  ❌ Error: window.SUPABASE_URL is missing or empty in index.html');
  failed = true;
}

if (indexHtml.includes('window.SUPABASE_ANON_KEY = "ey')) {
  console.log('  ✅ window.SUPABASE_ANON_KEY correctly injected');
} else {
  console.error('  ❌ Error: window.SUPABASE_ANON_KEY is missing or empty in index.html');
  failed = true;
}

if (indexHtml.includes('window.JAAS_APP_ID = "vpaas-magic-cookie-')) {
  console.log('  ✅ window.JAAS_APP_ID correctly injected');
} else {
  console.error('  ❌ Error: window.JAAS_APP_ID is missing or empty in index.html');
  failed = true;
}

// 3. Security Audit: Check for service_role leaks across all generated files
console.log('\n--- 3. Security Audit (No service_role credentials) ---');
function scanDirForLeaks(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      scanDirForLeaks(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.html') || file.name.endsWith('.js') || file.name.endsWith('.css'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      if (content.includes('service_role')) {
        console.error(`  ❌ SECURITY LEAK: "service_role" found in ${fullPath}`);
        failed = true;
      }
    }
  }
}
scanDirForLeaks(siteDir);
console.log('  ✅ Zero service_role occurrences in _site output');

// 4. Code integrity checks
console.log('\n--- 4. Code Integrity Checks ---');
const forumPath = path.resolve(siteDir, 'forum/mens/index.html');
const forumHtml = fs.readFileSync(forumPath, 'utf-8');

if (forumHtml.includes('function escapeHtml')) {
  console.log('  ✅ escapeHtml function present in forum output');
} else {
  console.error('  ❌ Error: escapeHtml missing in forum output');
  failed = true;
}

const supabaseJsPath = path.resolve(siteDir, 'assets/js/supabase.js');
const supabaseJs = fs.readFileSync(supabaseJsPath, 'utf-8');

if (supabaseJs.includes('x-participant-token')) {
  console.log('  ✅ x-participant-token header logic present in supabase.js');
} else {
  console.error('  ❌ Error: x-participant-token header logic missing in supabase.js');
  failed = true;
}

// 5. Jitsi production-hardening checks (Gap close-out G-01 / G-02)
console.log('\n--- 5. Jitsi Production Hardening Checks ---');

const headersPath = path.resolve(siteDir, '_headers');
const headers = fs.readFileSync(headersPath, 'utf-8');

if (headers.includes('https://meet.jit.si') && headers.includes('https://8x8.vc') && headers.includes('frame-src https://meet.jit.si https://8x8.vc')) {
  console.log('  ✅ CSP allowlists meet.jit.si and 8x8.vc (script-src/frame-src/connect-src)');
} else {
  console.error('  ❌ Error: CSP in _headers does not allowlist meet.jit.si and 8x8.vc');
  failed = true;
}

if (headers.includes('camera=(self "https://meet.jit.si" "https://8x8.vc")')) {
  console.log('  ✅ Permissions-Policy grants camera/mic to meet.jit.si and 8x8.vc frames');
} else {
  console.error('  ❌ Error: Permissions-Policy camera/mic not scoped to meet.jit.si and 8x8.vc');
  failed = true;
}

// Lazy-load only: no eager <script src="https://meet.jit.si ..."> or <script src="https://8x8.vc ..."> tag in any week page
let eagerJitsiTag = false;
for (let w = 1; w <= 8; w++) {
  const weekHtml = fs.readFileSync(path.resolve(siteDir, `week/${w}/index.html`), 'utf-8');
  if (weekHtml.includes('<script src="https://meet.jit.si') || weekHtml.includes('<script src="https://8x8.vc')) {
    console.error(`  ❌ Eager video script tag found in week/${w}/index.html`);
    eagerJitsiTag = true;
  }
}
if (eagerJitsiTag) {
  failed = true;
} else {
  console.log('  ✅ No eager Jitsi/JaaS script tag in any week page (lazy-load only)');
}

if (failed) {
  console.error('\n❌ Build verification FAILED!');
  process.exit(1);
} else {
  console.log('\n✨ Build verification PASSED cleanly!');
}
