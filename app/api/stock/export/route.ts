import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const minDemand = searchParams.get('minDemand');
        const mrpType = searchParams.get('mrpType');
        const critical = searchParams.get('critical');

        // Build where clause (matching the same logic as stock API)
        const conditions: any[] = [];

        if (minDemand) {
            conditions.push({ demand: { gt: parseFloat(minDemand) } });
        } else {
            conditions.push({ demand: { gt: 0 } });
        }

        if (critical === 'true') {
            conditions.push({
                AND: [
                    { lbkum: { lt: prisma.material.fields.minbe } },
                    { minbe: { not: null } }
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

        // Fetch all matching materials
        const materials = await prisma.material.findMany({
            where,
            orderBy: {
                demand: 'desc'
            }
        });

        // Prepare data for Excel
        const excelData = materials.map((m, index) => ({
            'No.': index + 1,
            'Material No.': m.matnr,
            'Description': m.maktx,
            'MRP Type': m.dismm,
            'Stock': Math.round(m.lbkum || 0),
            'Reorder Point': Math.round(m.minbe || 0),
            'Max Stock': Math.round(m.mabst || 0),
            'System Demand': Math.round(m.demand || 0),
            'Actual Demand': Math.round(m.actualDemand !== null ? m.actualDemand : (m.demand || 0)),
            'Delivery Date': m.deliveryDate || '-',
            'Delivery Time': m.deliveryTime || '-'
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Demand');

        // Set column widths
        const wscols = [
            { wch: 5 },  // No.
            { wch: 15 }, // Material No.
            { wch: 45 }, // Description
            { wch: 12 }, // MRP Type
            { wch: 12 }, // Stock
            { wch: 15 }, // Reorder Point
            { wch: 15 }, // Max Stock
            { wch: 18 }, // System Demand
            { wch: 18 }, // Actual Demand
            { wch: 15 }, // Delivery Date
            { wch: 15 }  // Delivery Time
        ];
        worksheet['!cols'] = wscols;

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `stock-demand-export-${timestamp}.xlsx`;

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('Failed to export stock data:', error);
        return NextResponse.json(
            { error: 'Failed to export stock data', details: error.message },
            { status: 500 }
        );
    }
}
