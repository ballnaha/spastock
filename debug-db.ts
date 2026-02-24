import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.material.count();
    console.log('Total Materials:', count);
    const sample = await prisma.material.findFirst();
    console.log('Sample Material:', JSON.stringify(sample, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
