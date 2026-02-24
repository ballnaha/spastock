const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const mrpTypes = await prisma.material.findMany({
            select: { dismm: true },
            distinct: ['dismm'],
        });
        console.log('Distinct MRP Types (DISMM):');
        console.log(JSON.stringify(mrpTypes, null, 2));

        const count = await prisma.material.count();
        console.log('Total Materials:', count);

        const data = await prisma.material.findFirst();
        console.log('Sample data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
