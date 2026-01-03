const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const passwordPlain = process.env.ADMIN_PASSWORD || 'adminTemp!2026';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required (set env DATABASE_URL)');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log('Hashing password...');
    const hashed = await bcrypt.hash(passwordPlain, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log('User exists. Updating password and role -> ADMIN.');
      const updated = await prisma.user.update({
        where: { email },
        data: { password: hashed, role: 'ADMIN', isActive: true },
      });
      console.log('Updated user:', { id: updated.id, email: updated.email });
    } else {
      console.log('Creating admin user:', email);
      const created = await prisma.user.create({
        data: { email, password: hashed, name: 'Administrator', role: 'ADMIN', isActive: true },
      });
      console.log('Created user:', { id: created.id, email: created.email });
    }

    console.log('\nADMIN CREDENTIALS');
    console.log('email:', email);
    console.log('password:', passwordPlain);
    console.log('\nStore this password securely and change after first login.');
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});