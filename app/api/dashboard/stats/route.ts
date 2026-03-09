import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
// Trigger refresh to fix cache issue 

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mrpType = searchParams.get('mrpType');
        const minDemand = searchParams.get('minDemand');
        const critical = searchParams.get('critical');

        // Build database query filters
        const conditions: any[] = [];
        if (mrpType) conditions.push({ dismm: mrpType });
        if (minDemand) conditions.push({ demand: { gt: parseFloat(minDemand) } });

        if (critical === 'true') {
            conditions.push({
                AND: [
                    { lbkum: { lt: prisma.material.fields.minbe } },
                    { minbe: { gt: 0 } }
                ]
            });
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        // Parallel execution for maximum speed
        const [summaryData, activeDemandQty, chartMaterials, mrpTypeOptions] = await Promise.all([
            // 1. Summary Aggregates
            prisma.material.aggregate({
                where,
                _count: { id: true },
                _sum: {
                    lbkum: true,
                    demand: true,
                    actualDemand: true
                }
            }),
            // 2. Critical Demand Count (Items needing attention)
            prisma.material.count({
                where: {
                    ...where,
                    demand: { gt: 0 }
                }
            }),
            // 3. Top 15 Materials for Chart
            prisma.material.findMany({
                where,
                select: {
                    matnr: true,
                    maktx: true,
                    lbkum: true,
                    demand: true,
                    actualDemand: true,
                    mabst: true,
                    minbe: true
                },
                orderBy: {
                    demand: 'desc'
                },
                take: 15
            }),
            // 4. Facets for Filter Dropdowns
            prisma.material.findMany({
                where: { dismm: { not: null } },
                select: { dismm: true },
                distinct: ['dismm'],
                orderBy: { dismm: 'asc' },
            }),
        ]);

        // 5. Calculate Total Adjusted Demand (Pro-level Net Order Plan)
        const allDemandData = await prisma.material.findMany({
            where,
            select: {
                demand: true,
                actualDemand: true
            }
        });

        const totalAdjustedDemand = allDemandData.reduce((sum, m) => sum + (m.actualDemand ?? m.demand ?? 0), 0);

        const result = {
            summary: {
                totalMaterials: summaryData._count.id,
                activeDemandCount: activeDemandQty,
                totalStockValue: summaryData._sum.lbkum || 0,
                totalSystemDemand: summaryData._sum.demand || 0,
                totalAdjustedDemand: totalAdjustedDemand
            },
            chartData: chartMaterials.map(m => ({
                name: m.maktx || m.matnr,
                stock: m.lbkum || 0,
                demand: m.demand ?? 0,
                max: m.mabst || 0,
                reorder: m.minbe || 0
            })),
            facets: {
                mrpTypes: mrpTypeOptions.map(t => t.dismm).filter(Boolean),
            }
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Dashboard stats API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
