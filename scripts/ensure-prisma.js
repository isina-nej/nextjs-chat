const fs = require('fs');
const { execSync } = require('child_process');

const schemaPath = './prisma/schema.prisma';

if (fs.existsSync(schemaPath)) {
  console.log(`Prisma schema found at ${schemaPath}, running prisma generate...`);
  try {
    execSync(`npx prisma generate --schema=${schemaPath}`, { stdio: 'inherit' });
    console.log('Prisma generate completed.');
  } catch (err) {
    console.error('Prisma generate failed:', err.message);
    process.exit(1);
  }
} else {
  console.warn(`Prisma schema not found at ${schemaPath}, skipping prisma generate.`);
  process.exit(0);
}
