import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const minDemand = searchParams.get('minDemand');
        const mrpType = searchParams.get('mrpType');
        const plant = searchParams.get('plant');
        const critical = searchParams.get('critical');

        // Build where clause
        const conditions: any[] = [];

        // Pre-calculated demand filters in DB
        if (minDemand) {
            conditions.push({ demand: { gt: parseFloat(minDemand) } });
        } else if (critical !== 'true' && !search) {
            // Default: only show items with demand > 0 if no specific filter and not critical/search
            conditions.push({ demand: { gt: 0 } });
        }

        if (critical === 'true') {
            conditions.push({
                AND: [
                    { lbkum: { lt: prisma.material.fields.minbe } },
                    { minbe: { gt: 0 } }
                ]
            });
        }

        if (mrpType) {
            conditions.push({ dismm: mrpType });
        }



        if (search) {
            conditions.push({
                OR: [
                    { matnr: { contains: search } },
                    { maktx: { contains: search } },
                    { matkl: { contains: search } },
                    { wgbez: { contains: search } },
                ],
            });
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        // 1. Fetch Aggregates (Totals) and Data in Parallel
        const [summary, materials, mrpTypes, plants] = await Promise.all([
            prisma.material.aggregate({
                where,
                _sum: {
                    lbkum: true,
                    minbe: true,
                    mabst: true,
                    demand: true,
                    actualDemand: true
                },
                _count: { id: true }
            }),
            prisma.material.findMany({
                where,
                select: {
                    id: true,
                    matnr: true,
                    maktx: true,
                    lbkum: true,
                    minbe: true,
                    mabst: true,
                    demand: true,
                    actualDemand: true,
                    dismm: true,
                    werks: true,
                    deliveryDate: true,
                    deliveryTime: true,
                },
                orderBy: {
                    demand: 'desc'
                }
            }),
            prisma.material.findMany({
                where: { dismm: { not: null } },
                select: { dismm: true },
                distinct: ['dismm'],
                orderBy: { dismm: 'asc' },
            }),
            prisma.material.findMany({
                where: { werks: { not: null } },
                select: { werks: true },
                distinct: ['werks'],
                orderBy: { werks: 'asc' },
            })
        ]);

        return NextResponse.json({
            data: materials.map(m => ({
                id: m.id,
                material: m.maktx || m.matnr,
                matnr: m.matnr,
                stock: m.lbkum || 0,
                reorder: m.minbe || 0,
                maxLfl: m.mabst || 0,
                demand: m.demand || 0,
                actualDemand: m.actualDemand ?? m.demand ?? 0,
                mrpType: m.dismm || '',
                plant: m.werks || '',
                deliveryDate: m.deliveryDate || '',
                deliveryTime: m.deliveryTime || '',
            })),
            totals: {
                stock: summary._sum.lbkum || 0,
                reorder: summary._sum.minbe || 0,
                maxLfl: summary._sum.mabst || 0,
                demand: summary._sum.demand || 0,
                actualDemand: materials.reduce((sum, m) => sum + (m.actualDemand ?? m.demand ?? 0), 0),
            },
            count: summary._count.id,
            facets: {
                mrpTypes: mrpTypes.map((t) => t.dismm).filter(Boolean),
                plants: plants.map((p) => p.werks).filter(Boolean),
            },
        });
    } catch (error: any) {
        console.error('Failed to fetch stock data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data', details: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update delivery date/time for a material
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, deliveryDate, deliveryTime, actualDemand } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Material ID is required' },
                { status: 400 }
            );
        }

        const updated = await prisma.material.update({
            where: { id: Number(id) },
            data: {
                deliveryDate: deliveryDate || null,
                deliveryTime: deliveryTime || null,
                actualDemand: actualDemand !== undefined ? parseFloat(actualDemand) : undefined,
            },
        });

        return NextResponse.json({
            success: true,
            data: updated,
        });
    } catch (error: any) {
        console.error('Failed to update material:', error);
        return NextResponse.json(
            { error: 'Failed to update material', details: error.message },
            { status: 500 }
        );
    }
}
