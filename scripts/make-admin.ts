import { prisma } from '../lib/db';

async function makeAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' },
  });

  console.log('Admin role assigned:', updated);
  process.exit(0);
}

makeAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
