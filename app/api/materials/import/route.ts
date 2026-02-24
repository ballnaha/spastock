import { NextRequest, NextResponse } from 'next/server';
import { parseMaterialRow, importMaterials, MaterialData } from '@/lib/material.service';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        // Server-side parsing is much faster
        const formattedData = rawData
            .map((row: any) => parseMaterialRow(row))
            .filter((item): item is MaterialData => item !== null);

        if (formattedData.length === 0) {
            return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const count = await importMaterials(formattedData, (current, total) => {
                        const progress = Math.round((current / total) * 100);
                        const message = JSON.stringify({ type: 'progress', progress, current, total }) + '\n';
                        controller.enqueue(encoder.encode(message));
                    });

                    const successMessage = JSON.stringify({ type: 'complete', count, message: `Successfully imported ${count} materials` }) + '\n';
                    controller.enqueue(encoder.encode(successMessage));
                    controller.close();
                } catch (error: any) {
                    const errorMessage = JSON.stringify({ type: 'error', message: error.message || 'Import failed' }) + '\n';
                    controller.enqueue(encoder.encode(errorMessage));
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({
            error: 'Failed to import data',
            details: error.message
        }, { status: 500 });
    }
}
