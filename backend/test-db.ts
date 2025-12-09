
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection...');
        // Mask password in log
        const url = process.env.DATABASE_URL || '';
        console.log('URL:', url.replace(/:([^:@]+)@/, ':****@'));

        await prisma.$connect();
        console.log('Successfully connected to database!');

        const count = await prisma.user.count();
        console.log(`Found ${count} users.`);

    } catch (error) {
        console.error('Error connecting to database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
