import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Get distinct values for filter dropdowns
        const [types, plants] = await Promise.all([
            prisma.material.findMany({
                where: { mtart: { not: null } },
                select: { mtart: true },
                distinct: ['mtart'],
                orderBy: { mtart: 'asc' },
            }),
            prisma.material.findMany({
                where: { werks: { not: null } },
                select: { werks: true },
                distinct: ['werks'],
                orderBy: { werks: 'asc' },
            }),
        ]);

        return NextResponse.json({
            types: types.map((t) => t.mtart).filter(Boolean),
            plants: plants.map((p) => p.werks).filter(Boolean),
        });
    } catch (error: any) {
        console.error('Failed to fetch filter options:', error);
        return NextResponse.json(
            { error: 'Failed to fetch filter options', details: error.message },
            { status: 500 }
        );
    }
}
