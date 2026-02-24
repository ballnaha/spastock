import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseMaterialRow, upsertMaterials, MaterialData } from '@/lib/material.service';

export async function POST(req: Request) {
    try {
        const uploadDir = path.join(process.cwd(), 'public', 'excel');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            return NextResponse.json({ error: `Excel directory not found.` }, { status: 404 });
        }

        // Find the latest Excel file (.xlsx or .xls)
        const files = fs.readdirSync(uploadDir);
        const excelFiles = files.filter(file =>
            (file.endsWith('.xlsx') || file.endsWith('.xls')) &&
            !file.startsWith('~$')
        );

        if (excelFiles.length === 0) {
            return NextResponse.json({ error: `No Excel files (.xlsx, .xls) found in excel folder.` }, { status: 404 });
        }

        // Sort by modification time (newest first)
        const latestFile = excelFiles
            .map(fileName => ({
                name: fileName,
                time: fs.statSync(path.join(uploadDir, fileName)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)[0];

        const filename = latestFile.name;
        const filePath = path.join(uploadDir, filename);

        const encoder = new TextEncoder();
        const customReadable = new ReadableStream({
            async start(controller) {
                try {
                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 5, message: `Reading file: ${filename}...` }) + '\n'));

                    const fileBuffer = fs.readFileSync(filePath);
                    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                    const sheetName = workbook.SheetNames[0];
                    if (!sheetName) {
                        throw new Error(`Excel file has no sheets. Buffer size: ${fileBuffer.length}`);
                    }
                    const worksheet = workbook.Sheets[sheetName];

                    // Debugging empty data
                    const range = worksheet['!ref'];
                    if (!range) {
                        throw new Error(`Sheet '${sheetName}' has no data range (!ref is undefined). Empty sheet?`);
                    }

                    const rawData = XLSX.utils.sheet_to_json(worksheet);

                    if (rawData.length === 0) {
                        // Try reading with header: 1 to see if we can get anything
                        const rawDataHeader = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        throw new Error(`Parsed 0 rows. Sheet: '${sheetName}', Range: '${range}'. Raw Rows (header=1): ${rawDataHeader.length}. First row: ${JSON.stringify(rawDataHeader[0])}`);
                    }

                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 15, message: `Processing ${rawData.length} rows from '${sheetName}'...` }) + '\n'));

                    const formattedData = rawData
                        .map((row: any) => parseMaterialRow(row))
                        .filter((item): item is MaterialData => item !== null);

                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 25, message: `Found ${formattedData.length} records.` }) + '\n'));

                    // Skip deduplication - User wants to keep all records from Excel
                    // const uniqueDataMap = new Map<string, MaterialData>();
                    // formattedData.forEach((item) => {
                    //     uniqueDataMap.set(item.matnr, item);
                    // });
                    // const uniqueData = Array.from(uniqueDataMap.values());

                    const parsedCount = formattedData.length;
                    // const uniqueCount = uniqueData.length;

                    if (parsedCount === 0) {
                        const firstRow = rawData.length > 0 ? JSON.stringify(rawData[0]) : 'No data';
                        throw new Error(`Found 0 valid records. Check Excel headers. First row keys: ${firstRow}`);
                    }

                    controller.enqueue(encoder.encode(JSON.stringify({
                        progress: 25,
                        message: `Found ${parsedCount} valid records from Excel.`
                    }) + '\n'));

                    controller.enqueue(encoder.encode(JSON.stringify({ progress: 30, message: `Syncing ${parsedCount} items...` }) + '\n'));

                    await upsertMaterials(formattedData, (count, total) => {
                        const percent = 30 + Math.round((count / total) * 60);
                        controller.enqueue(encoder.encode(JSON.stringify({ progress: percent, count, total }) + '\n'));
                    });

                    // Cleanup old data (Not needed since we delete all in upsertMaterials, but kept for logic if we switch back)
                    // Actually upsertMaterials deletes ALL. So we don't need cleanupOldMaterials anymore.
                    // But to be safe and consistent with the legacy code structure:

                    controller.enqueue(encoder.encode(JSON.stringify({
                        progress: 100,
                        success: true,
                        message: `Sync Complete! In: ${parsedCount} (Raw: ${parsedCount})`
                    }) + '\n'));
                    controller.close();
                } catch (e: any) {
                    controller.enqueue(encoder.encode(JSON.stringify({ error: e.message }) + '\n'));
                    controller.close();
                }
            }
        });

        return new NextResponse(customReadable, {
            headers: {
                'Content-Type': 'application/json',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
