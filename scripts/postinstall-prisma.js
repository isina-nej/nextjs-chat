const fs = require('fs');
const { spawnSync } = require('child_process');

const schemaPath = './prisma/schema.prisma';

console.log('POSTINSTALL-PRISMA: Starting');
console.log('PWD:', process.cwd());
console.log('ROOT FILES:');
try { console.log(require('child_process').execSync('ls -la').toString()); } catch (e) { try { console.log(require('child_process').execSync('dir').toString()); } catch (e) {} }

if (!fs.existsSync('prisma')) {
  console.warn('prisma directory missing, creating');
  fs.mkdirSync('prisma');
}

if (!fs.existsSync(schemaPath) || fs.statSync(schemaPath).size === 0) {
  console.warn(`Schema not found at ${schemaPath} or empty. Writing fallback schema.`);
  const fallback = `generator client { provider = "prisma-client-js" }

datasource db { provider = "sqlite" url = env("DATABASE_URL") }

model _Fallback { id String @id @default(cuid()) }\n`;
  fs.writeFileSync(schemaPath, fallback);
} else {
  console.log('Schema exists. First 120 chars:');
  const content = fs.readFileSync(schemaPath, 'utf8');
  console.log(content.slice(0, 120));
}

const localBins = [
  'node_modules/.bin/prisma',
  'node_modules/.bin/prisma.cmd',
  'node_modules/.bin/prisma.exe'
];
let prismaCmd = null;
for (const p of localBins) {
  if (fs.existsSync(p)) { prismaCmd = p; break; }
}

let res = null;

const tryRun = (cmd, args) => {
  try {
    console.log('Attempt:', cmd, args.join(' '));
    return spawnSync(cmd, args, { stdio: 'inherit' });
  } catch (e) {
    console.error('Attempt failed to spawn', cmd, e && e.message);
    return { error: e, status: 1 };
  }
};

if (!prismaCmd) {
  console.log('Local prisma binary not found, will try npm exec then npx');
  res = tryRun('npm', ['exec', '--', 'prisma', 'generate', '--schema=' + schemaPath]);
  if ((res && res.error) || (res && res.status !== 0)) {
    console.warn('npm exec failed, trying npx');
    res = tryRun('npx', ['prisma', 'generate', '--schema=' + schemaPath]);
  }
} else {
  console.log('Running local prisma binary via node:', prismaCmd);
  // Try running via node to ensure cross-platform compatibility
  res = tryRun(process.execPath, [prismaCmd, 'generate', '--schema=' + schemaPath]);
  if ((res && res.error) || (res && res.status !== 0)) {
    console.warn('Direct node run failed, trying npm exec fallback');
    res = tryRun('npm', ['exec', '--', 'prisma', 'generate', '--schema=' + schemaPath]);
  }
}

if (res.error) {
  console.error('Failed to run prisma generate:', res.error);
  process.exit(1);
}
if (res.status !== 0) {
  console.error('prisma generate exited with code', res.status);
  process.exit(res.status);
}

console.log('prisma generate completed successfully.');
process.exit(0);
