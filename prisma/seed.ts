import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
        console.log('✅ Admin user already exists:', existingAdmin.email);
        return;
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentpilot.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            name: 'System Admin',
        },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('⚠️  Please change the password after first login!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
