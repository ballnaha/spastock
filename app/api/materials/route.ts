import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const missingConfig = searchParams.get('missingConfig') === 'true';
        const mrpType = searchParams.get('mrpType');
        const minDemand = searchParams.get('minDemand');
        const critical = searchParams.get('critical') === 'true';
        const mtart = searchParams.get('mtart');
        const werks = searchParams.get('werks');
        const stockStatus = searchParams.get('stockStatus');
        const pageVal = searchParams.get('page') || '1';
        const page = Math.max(1, parseInt(pageVal)) - 1; // 0-based for skip, minimum 1-based input
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = page * limit;

        const conditions: any[] = [];

        if (missingConfig) {
            conditions.push({
                OR: [
                    { minbe: null },
                    { minbe: 0 },
                    { mabst: null },
                    { mabst: 0 }
                ]
            });
        }

        if (mrpType) {
            conditions.push({ dismm: mrpType });
        }

        if (mtart) {
            conditions.push({ mtart });
        }

        if (werks) {
            conditions.push({ werks });
        }

        if (stockStatus) {
            if (stockStatus === 'out') {
                conditions.push({ lbkum: 0 });
            } else if (stockStatus === 'low') {
                conditions.push({
                    AND: [
                        { lbkum: { lt: prisma.material.fields.minbe } },
                        { lbkum: { gt: 0 } },
                        { minbe: { not: null } }
                    ]
                });
            } else if (stockStatus === 'normal') {
                conditions.push({
                    OR: [
                        { lbkum: { gte: prisma.material.fields.minbe } },
                        { minbe: null }
                    ]
                });
            }
        }

        if (minDemand) {
            conditions.push({ demand: { gt: parseFloat(minDemand) } });
        }

        if (critical) {
            conditions.push({
                OR: [
                    {
                        AND: [
                            { lbkum: { lt: prisma.material.fields.minbe } },
                            { minbe: { not: null } },
                            { minbe: { gt: 0 } }
                        ]
                    },
                    { minbe: null },
                    { minbe: 0 },
                    { mabst: null },
                    { mabst: 0 }
                ]
            });
        }

        if (search) {
            conditions.push({
                OR: [
                    { matnr: { contains: search } },
                    { maktx: { contains: search } },
                    { matkl: { contains: search } },
                    { pscMaterial: { contains: search } },
                    { pscMaterialDesc: { contains: search } }
                ]
            });
        }

        const where = conditions.length > 0 ? { AND: conditions } : {};

        const includeFacets = searchParams.get('includeFacets') === 'true';

        const [total, materials, facets] = await Promise.all([
            prisma.material.count({ where }),
            prisma.material.findMany({
                where,
                skip,
                take: limit,
                orderBy: { matnr: 'asc' }
            }),
            // Facets for Inventory and Materials page filters - Only fetch if requested
            includeFacets ?
                Promise.all([
                    prisma.material.findMany({
                        where: { AND: [{ mtart: { not: null } }, { mtart: { not: "" } }] },
                        select: { mtart: true },
                        distinct: ['mtart'],
                        orderBy: { mtart: 'asc' },
                    }),
                    prisma.material.findMany({
                        where: { AND: [{ werks: { not: null } }, { werks: { not: "" } }] },
                        select: { werks: true },
                        distinct: ['werks'],
                        orderBy: { werks: 'asc' },
                    }),
                    prisma.material.findMany({
                        where: { AND: [{ dismm: { not: null } }, { dismm: { not: "" } }] },
                        select: { dismm: true },
                        distinct: ['dismm'],
                        orderBy: { dismm: 'asc' },
                    }),
                ]).then(([types, plants, mrpTypes]) => ({
                    types: types.map(t => t.mtart).filter(Boolean),
                    plants: plants.map(p => p.werks).filter(Boolean),
                    mrpTypes: mrpTypes.map(m => m.dismm).filter(Boolean)
                })) : Promise.resolve(null)
        ]);

        return NextResponse.json({
            materials,
            pagination: {
                total,
                page: page + 1,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            facets
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, minbe, mabst, pscMaterial, pscMaterialDesc } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Fetch current material state to recalculate demand
        const currentM = await prisma.material.findUnique({
            where: { id: parseInt(id) },
            select: { lbkum: true, demand: true, actualDemand: true }
        });

        if (!currentM) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

        const newMinbe = minbe !== undefined ? parseFloat(minbe) : undefined;
        const newMabst = mabst !== undefined ? parseFloat(mabst) : undefined;

        // Recalculate demand based on MABST - LBKUM (Current Stock)
        let newDemand = undefined;
        let newActualDemand = undefined;

        if (newMabst !== undefined) {
            newDemand = Math.max(0, newMabst - (currentM.lbkum || 0));

            // If actualDemand was same as demand (not explicitly changed by user on dashboard), 
            // sync it with the new calculated demand
            if (currentM.actualDemand === null || currentM.actualDemand === currentM.demand) {
                newActualDemand = newDemand;
            }
        }

        const updated = await prisma.material.update({
            where: { id: parseInt(id) },
            data: {
                minbe: newMinbe,
                mabst: newMabst,
                demand: newDemand,
                actualDemand: newActualDemand,
                ...(pscMaterial !== undefined && { pscMaterial }),
                ...(pscMaterialDesc !== undefined && { pscMaterialDesc })
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
