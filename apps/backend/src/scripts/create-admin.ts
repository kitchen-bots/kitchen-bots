import 'dotenv/config';
import { getPayload } from 'payload';
import config from '../payload.config';

async function createAdmin() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@kitchenbots.com';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123456';
  const name = process.argv[4] || 'Kitchen Bots Admin';

  const payload = await getPayload({ config });

  console.log(`Checking if admin user ${email} exists...`);
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    console.log(`User ${email} already exists! Updating role to admin...`);
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: {
        role: 'admin',
        name,
      },
    });
    console.log(`✓ Admin user ${email} updated.`);
  } else {
    const created = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        name,
        role: 'admin',
      },
    });
    console.log(`✅ Admin user created successfully:`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log(`   ID: ${created.id}`);
  }

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin user:', err);
  process.exit(1);
});
