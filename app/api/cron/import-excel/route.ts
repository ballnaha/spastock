import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { parseMaterialRow, importMaterials } from '@/lib/material.service';

export async function GET() {
    try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            return NextResponse.json({ error: 'Upload directory not found' }, { status: 404 });
        }

        // Get list of files
        const files = fs.readdirSync(uploadDir);

        // Filter for Excel files
        const excelFiles = files.filter(file =>
            file.endsWith('.xlsx') || file.endsWith('.xls')
        );

        if (excelFiles.length === 0) {
            return NextResponse.json({ message: 'No Excel files found in uploads folder' }, { status: 404 });
        }

        // Get the latest file by modification time
        const latestFile = excelFiles
            .map(fileName => ({
                name: fileName,
                time: fs.statSync(path.join(uploadDir, fileName)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time)[0];

        const filePath = path.join(uploadDir, latestFile.name);
        console.log(`Processing latest file: ${latestFile.name}`);

        // Read the file
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        // Map data using the centralized service parser
        const formattedData = rawData
            .map((row: any) => parseMaterialRow(row))
            .filter((item): item is any => item !== null);

        if (formattedData.length === 0) {
            return NextResponse.json({ message: 'No valid data found in file' }, { status: 400 });
        }

        // Use the centralized importMaterials service
        // This handles find/update/create logic safely using IDs
        const updatedCount = await importMaterials(formattedData);

        return NextResponse.json({
            success: true,
            message: `Processed file: ${latestFile.name}`,
            updated: updatedCount,
            fileTime: new Date(latestFile.time).toISOString()
        });


    } catch (error: any) {
        console.error('Auto import Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
