import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import XLSX from 'xlsx-js-style';

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

        // ===== STYLING DEFINITIONS =====
        const headerStyle = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
            fill: { fgColor: { rgb: '2D60FF' } },
            alignment: { horizontal: 'center' as const, vertical: 'center' as const, wrapText: true },
            border: {
                top: { style: 'thin' as const, color: { rgb: '1A3DB8' } },
                bottom: { style: 'thin' as const, color: { rgb: '1A3DB8' } },
                left: { style: 'thin' as const, color: { rgb: '1A3DB8' } },
                right: { style: 'thin' as const, color: { rgb: '1A3DB8' } },
            }
        };

        const cellBorder = {
            top: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
            bottom: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
            left: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
            right: { style: 'thin' as const, color: { rgb: 'D0D0D0' } },
        };

        const textCellStyle = {
            font: { sz: 10, name: 'Calibri', color: { rgb: '333333' } },
            alignment: { vertical: 'center' as const },
            border: cellBorder,
        };

        const numberCellStyle = {
            font: { sz: 10, name: 'Calibri', color: { rgb: '333333' } },
            alignment: { horizontal: 'right' as const, vertical: 'center' as const },
            numFmt: '#,##0',
            border: cellBorder,
        };

        const demandCellStyle = {
            font: { sz: 10, name: 'Calibri', bold: true, color: { rgb: 'E53535' } },
            alignment: { horizontal: 'right' as const, vertical: 'center' as const },
            fill: { fgColor: { rgb: 'FFF0F0' } },
            numFmt: '#,##0',
            border: cellBorder,
        };

        const actualDemandCellStyle = {
            font: { sz: 10, name: 'Calibri', bold: true, color: { rgb: '2D60FF' } },
            alignment: { horizontal: 'right' as const, vertical: 'center' as const },
            fill: { fgColor: { rgb: 'F0F4FF' } },
            numFmt: '#,##0',
            border: cellBorder,
        };

        const totalLabelStyle = {
            font: { bold: true, sz: 11, name: 'Calibri', color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1A1D1F' } },
            alignment: { horizontal: 'center' as const, vertical: 'center' as const },
            border: {
                top: { style: 'medium' as const, color: { rgb: '000000' } },
                bottom: { style: 'medium' as const, color: { rgb: '000000' } },
                left: { style: 'medium' as const, color: { rgb: '000000' } },
                right: { style: 'medium' as const, color: { rgb: '000000' } },
            }
        };

        const totalNumberStyle = {
            font: { bold: true, sz: 11, name: 'Calibri', color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '1A1D1F' } },
            alignment: { horizontal: 'right' as const, vertical: 'center' as const },
            numFmt: '#,##0',
            border: {
                top: { style: 'medium' as const, color: { rgb: '000000' } },
                bottom: { style: 'medium' as const, color: { rgb: '000000' } },
                left: { style: 'medium' as const, color: { rgb: '000000' } },
                right: { style: 'medium' as const, color: { rgb: '000000' } },
            }
        };

        const evenRowBg = { fgColor: { rgb: 'F8F9FC' } };

        // ===== HEADERS =====
        const headers = [
            'No.', 'S.P.A. Material', 'S.P.A. Description', 'PSC Material', 'PSC Description',
            'Stock', 'Reorder Point', 'Max Stock', 'System Demand', 'Actual Demand',
            'Delivery Date', 'Delivery Time'
        ];

        // ===== BUILD WORKSHEET DATA (Array of Arrays) =====
        const wsData: any[][] = [];

        // Header row
        wsData.push(headers);

        // Data rows
        materials.forEach((m, index) => {
            wsData.push([
                index + 1,
                m.matnr,
                m.maktx,
                m.pscMaterial || '-',
                m.pscMaterialDesc || '-',
                Math.round(m.lbkum || 0),
                Math.round(m.minbe || 0),
                Math.round(m.mabst || 0),
                Math.round(m.demand || 0),
                Math.round(m.actualDemand !== null ? m.actualDemand : (m.demand || 0)),
                m.deliveryDate || '-',
                m.deliveryTime || '-'
            ]);
        });

        // Total row
        const totalStock = materials.reduce((sum, m) => sum + Math.round(m.lbkum || 0), 0);
        const totalReorder = materials.reduce((sum, m) => sum + Math.round(m.minbe || 0), 0);
        const totalMax = materials.reduce((sum, m) => sum + Math.round(m.mabst || 0), 0);
        const totalDemand = materials.reduce((sum, m) => sum + Math.round(m.demand || 0), 0);
        const totalActualDemand = materials.reduce((sum, m) => sum + Math.round(m.actualDemand !== null ? m.actualDemand : (m.demand || 0)), 0);

        wsData.push([
            '', '', '', '', 'TOTAL',
            totalStock, totalReorder, totalMax, totalDemand, totalActualDemand,
            '', ''
        ]);

        // Create worksheet from array of arrays
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);

        // ===== APPLY STYLES =====
        const numCols = headers.length;
        const numDataRows = materials.length;
        const totalRowIdx = numDataRows + 1; // 0-indexed (header=0, data=1..N, total=N+1)

        // Style header row
        for (let col = 0; col < numCols; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = headerStyle;
            }
        }

        // Style data rows
        for (let row = 1; row <= numDataRows; row++) {
            const isEven = row % 2 === 0;
            for (let col = 0; col < numCols; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                if (!worksheet[cellRef]) continue;

                // Determine style based on column
                let style: any;
                if (col >= 5 && col <= 7) {
                    // Stock, Reorder, Max — number columns
                    style = { ...numberCellStyle };
                } else if (col === 8) {
                    // System Demand
                    style = { ...demandCellStyle };
                } else if (col === 9) {
                    // Actual Demand
                    style = { ...actualDemandCellStyle };
                } else if (col === 0) {
                    // No. — center aligned number
                    style = { ...textCellStyle, alignment: { horizontal: 'center' as const, vertical: 'center' as const } };
                } else {
                    // Text columns
                    style = { ...textCellStyle };
                }

                // Alternate row bg
                if (isEven) {
                    style = { ...style, fill: style.fill ? style.fill : evenRowBg };
                }

                worksheet[cellRef].s = style;
            }
        }

        // Style total row
        for (let col = 0; col < numCols; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: totalRowIdx, c: col });
            if (!worksheet[cellRef]) {
                worksheet[cellRef] = { v: '', t: 's' };
            }
            if (col >= 5 && col <= 9) {
                worksheet[cellRef].s = totalNumberStyle;
            } else {
                worksheet[cellRef].s = totalLabelStyle;
            }
        }

        // ===== AUTO-FIT COLUMN WIDTHS =====
        const colWidths: number[] = headers.map(h => h.length);
        for (const row of wsData) {
            row.forEach((cell: any, colIdx: number) => {
                const cellStr = cell !== null && cell !== undefined ? String(cell) : '';
                // For numbers with comma formatting, estimate formatted length
                const len = typeof cell === 'number'
                    ? cell.toLocaleString('en-US', { maximumFractionDigits: 0 }).length
                    : cellStr.length;
                if (len > colWidths[colIdx]) {
                    colWidths[colIdx] = len;
                }
            });
        }
        worksheet['!cols'] = colWidths.map(w => ({ wch: Math.max(w + 2, 8) }));

        // ===== ROW HEIGHTS =====
        worksheet['!rows'] = [{ hpt: 28 }]; // Taller header row

        // ===== AUTO-FILTER =====
        worksheet['!autofilter'] = { ref: `A1:L${numDataRows + 1}` };

        // ===== FREEZE PANES (freeze header row) =====
        worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', state: 'frozen' };

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Demand');

        // Set active sheet view with frozen panes (alternative method)
        if (!workbook.Workbook) workbook.Workbook = {};
        if (!workbook.Workbook.Views) workbook.Workbook.Views = [{}];
        if (!workbook.Workbook.Sheets) workbook.Workbook.Sheets = [{}];

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
