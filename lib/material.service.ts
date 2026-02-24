import prisma from '@/lib/prisma';

export interface MaterialData {
    matnr: string;
    maktx: string | null;
    matkl: string | null;
    wgbez: string | null;
    zmatg2: string | null;
    zdest2: string | null;
    mtart: string | null;
    mseh3: string | null;
    werks: string | null;
    dismm: string | null;
    minbe: number | null;
    disls: string | null;
    mabst: number | null;
    plifz: number | null;
    lbkum: number | null;
    demand: number | null;
    actualDemand: number | null;
    deliveryDate: string | null;
    deliveryTime: string | null;
}

export const parseMaterialRow = (row: any): MaterialData | null => {
    // Normalize keys to lowercase for easier lookup
    const normalizedRow: any = {};
    if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase()] = row[key];
        });
    }

    let matnr = String(
        normalizedRow['material number'] || normalizedRow['matnr'] || normalizedRow['material'] ||
        row['MAKTX']?.split(' ')[0] || ''
    );

    matnr = matnr.trim();
    if (!matnr || matnr === 'undefined' || matnr === 'null') return null;

    const parseNum = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        const n = parseFloat(val);
        return isNaN(n) ? null : n;
    };
    const parseIntNum = (val: any) => {
        if (val === undefined || val === null || val === '') return null;
        const n = parseInt(val);
        return isNaN(n) ? null : n;
    };

    const mabst = parseNum(normalizedRow['maximum stock'] || normalizedRow['mabst']);
    const lbkum = parseNum(normalizedRow['current stock'] || normalizedRow['lbkum']);

    // Calculate demand: If we have Max Stock, demand is Max - Stock (minimum 0)
    // If stock is null, we treat it as 0
    const demand = (mabst !== null) ? Math.max(0, mabst - (lbkum ?? 0)) : 0;

    return {
        matnr,
        maktx: normalizedRow['material description'] || normalizedRow['maktx'] || null,
        matkl: normalizedRow['material group'] || normalizedRow['matkl'] || null,
        wgbez: normalizedRow['material group description'] || normalizedRow['wgbez'] || null,
        zmatg2: normalizedRow['custom group 2'] || normalizedRow['zmatg2'] || null,
        zdest2: normalizedRow['custom group 2 description'] || normalizedRow['zdest2'] || null,
        mtart: normalizedRow['material type'] || normalizedRow['mtart'] || null,
        mseh3: normalizedRow['base unit'] || normalizedRow['mseh3'] || null,
        werks: normalizedRow['plant'] || normalizedRow['werks'] || null,
        dismm: normalizedRow['mrp type'] || normalizedRow['dismm'] || null,
        minbe: parseNum(normalizedRow['reorder point'] || normalizedRow['minbe']),
        disls: normalizedRow['lot size'] || normalizedRow['disls'] || null,
        mabst,
        plifz: parseIntNum(normalizedRow['planned delivery time'] || normalizedRow['plifz']),
        lbkum: lbkum ?? 0,
        demand,
        actualDemand: demand, // Default to calculated demand
        deliveryDate: normalizedRow['delivery date'] || normalizedRow['delivery_date'] || normalizedRow['deliverydate'] || null,
        deliveryTime: normalizedRow['delivery time'] || normalizedRow['delivery_time'] || normalizedRow['deliverytime'] || null,
    };
};

// Function to SMART SYNC materials
// 1. Updates existing records (by matching Matnr + Werks) -> Preserves Delivery Info naturally
// 2. Creates new records for items not in DB
// 3. Deletes records in DB that are missing from Excel (Cleanup)
export const upsertMaterials = async (
    materials: MaterialData[],
    onProgress?: (count: number, total: number) => void
): Promise<number> => {
    if (materials.length === 0) {
        console.warn('upsertMaterials received empty array. Skipping update to prevent data loss.');
        return 0;
    }

    const total = materials.length;
    let processedCount = 0;

    // 1. Fetch ALL existing records to match against
    const existingItems = await prisma.material.findMany();

    // Helper to find match in existing items
    // We'll use a pool to ensure 1-to-1 mapping for duplicates
    let existingPool = [...existingItems];
    const toUpdate: { id: number, data: any }[] = [];
    const toCreate: any[] = [];
    const matchedIds = new Set<number>();

    // 2. Classify Excel items (Update vs Create)
    for (const item of materials) {
        // Find best match: same MATNR and same WERKS
        const matchIndex = existingPool.findIndex(
            e => e.matnr === item.matnr && (e.werks === item.werks || (!e.werks && !item.werks))
        );

        if (matchIndex !== -1) {
            // Found match -> UPDATE
            const match = existingPool[matchIndex];
            matchedIds.add(match.id);

            // Master Data Protection: Only overwrite configuration if Excel has a positive value
            const finalMinbe = (item.minbe !== null && item.minbe > 0) ? item.minbe : match.minbe;
            const finalMabst = (item.mabst !== null && item.mabst > 0) ? item.mabst : match.mabst;
            const finalDismm = (item.dismm && item.dismm.trim() !== "") ? item.dismm : match.dismm;
            const finalLbkum = item.lbkum ?? 0;
            const updatedDemand = (finalMabst !== null) ? Math.max(0, finalMabst - finalLbkum) : 0;

            toUpdate.push({
                id: match.id,
                data: {
                    maktx: item.maktx,
                    matkl: item.matkl,
                    wgbez: item.wgbez,
                    zmatg2: item.zmatg2,
                    zdest2: item.zdest2,
                    mtart: item.mtart,
                    mseh3: item.mseh3,
                    werks: item.werks,
                    dismm: finalDismm,
                    minbe: finalMinbe,
                    disls: item.disls,
                    mabst: finalMabst,
                    plifz: item.plifz,
                    lbkum: finalLbkum,
                    demand: updatedDemand,
                    // If user hasn't manually adjusted actualDemand (it matches old demand), update it to match new demand
                    actualDemand: match.actualDemand !== null && match.actualDemand !== match.demand ? match.actualDemand : updatedDemand,
                    deliveryDate: item.deliveryDate || match.deliveryDate,
                    deliveryTime: item.deliveryTime || match.deliveryTime
                }
            });

            // Remove from pool so it's not matched again (handing duplicates 1-by-1)
            existingPool.splice(matchIndex, 1);
        } else {
            // No match -> CREATE
            toCreate.push({
                matnr: item.matnr,
                maktx: item.maktx,
                matkl: item.matkl,
                wgbez: item.wgbez,
                zmatg2: item.zmatg2,
                zdest2: item.zdest2,
                mtart: item.mtart,
                mseh3: item.mseh3,
                werks: item.werks,
                dismm: item.dismm,
                minbe: item.minbe,
                disls: item.disls,
                mabst: item.mabst,
                plifz: item.plifz,
                lbkum: item.lbkum,
                demand: item.demand,
                actualDemand: item.demand,
                deliveryDate: item.deliveryDate,
                deliveryTime: item.deliveryTime,
            });
        }
    }

    // 3. Execution Phase

    // A. Batch Update (using Transaction loop for safety)
    if (toUpdate.length > 0) {
        // Chunk updates
        const updateChunkSize = 50;
        for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
            const chunk = toUpdate.slice(i, i + updateChunkSize);
            await prisma.$transaction(
                chunk.map(u => prisma.material.update({
                    where: { id: u.id },
                    data: u.data
                }))
            );
            processedCount += chunk.length;
            if (onProgress) onProgress(processedCount, total);
        }
    }

    // B. Batch Create
    if (toCreate.length > 0) {
        const createChunkSize = 1000;
        for (let i = 0; i < toCreate.length; i += createChunkSize) {
            const chunk = toCreate.slice(i, i + createChunkSize);
            await prisma.material.createMany({ data: chunk });
            processedCount += chunk.length;
            if (onProgress) onProgress(processedCount, total);
        }
    }

    // C. Prune (Delete Missing)
    // Delete anything in DB that was NOT matched (leftover in original existingItems list)
    // Or just check matchedIds vs all original IDs
    const allOriginalIds = existingItems.map(e => e.id);
    const idsToDelete = allOriginalIds.filter(id => !matchedIds.has(id));

    if (idsToDelete.length > 0) {
        await prisma.material.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        });
        console.log(`Pruned ${idsToDelete.length} old records.`);
    }

    return processedCount;
};

// Function specifically for Import (Append/Update) mode
// - Updates existing records if Matnr + Werks match
// - Creates new records if not found
export const importMaterials = async (
    materials: MaterialData[],
    onProgress?: (count: number, total: number) => void
): Promise<number> => {
    let processedCount = 0;
    const total = materials.length;

    // 1. Fetch ALL existing basic info to build a Map in memory
    // This avoids N queries for findFirst
    const existingRecords = await prisma.material.findMany({
        select: {
            id: true,
            matnr: true,
            werks: true,
            dismm: true,
            demand: true,
            actualDemand: true,
            minbe: true,
            mabst: true,
            deliveryDate: true,
            deliveryTime: true
        }
    });

    // Create a Map with composite key: "MATNR|WERKS" -> Record
    const existingMap = new Map<string, typeof existingRecords[0]>();
    existingRecords.forEach(rec => {
        existingMap.set(`${rec.matnr}|${rec.werks}`, rec);
    });

    const toCreate: any[] = [];
    const toUpdate: { id: number; data: any }[] = [];

    // 2. Classify Input Data
    for (const item of materials) {
        const key = `${item.matnr}|${item.werks}`;
        const existing = existingMap.get(key);

        if (existing) {
            // Master Data Protection logic
            const finalMinbe = (item.minbe !== null && item.minbe > 0) ? item.minbe : existing.minbe;
            const finalMabst = (item.mabst !== null && item.mabst > 0) ? item.mabst : existing.mabst;
            const finalDismm = (item.dismm && item.dismm.trim() !== "") ? item.dismm : existing.dismm;
            const finalLbkum = item.lbkum ?? 0;
            const updatedDemand = (finalMabst !== null) ? Math.max(0, finalMabst - finalLbkum) : 0;

            toUpdate.push({
                id: existing.id,
                data: {
                    maktx: item.maktx,
                    matkl: item.matkl,
                    wgbez: item.wgbez,
                    zmatg2: item.zmatg2,
                    zdest2: item.zdest2,
                    mtart: item.mtart,
                    mseh3: item.mseh3,
                    dismm: finalDismm,
                    minbe: finalMinbe,
                    disls: item.disls,
                    mabst: finalMabst,
                    plifz: item.plifz,
                    lbkum: finalLbkum,
                    demand: updatedDemand,
                    actualDemand: existing.actualDemand !== null && existing.actualDemand !== existing.demand ? existing.actualDemand : updatedDemand,
                    deliveryDate: item.deliveryDate || existing.deliveryDate,
                    deliveryTime: item.deliveryTime || existing.deliveryTime,
                }
            });
        } else {
            // Plan Create
            toCreate.push({
                matnr: item.matnr,
                maktx: item.maktx,
                matkl: item.matkl,
                wgbez: item.wgbez,
                zmatg2: item.zmatg2,
                zdest2: item.zdest2,
                mtart: item.mtart,
                mseh3: item.mseh3,
                werks: item.werks,
                dismm: item.dismm,
                minbe: item.minbe,
                disls: item.disls,
                mabst: item.mabst,
                plifz: item.plifz,
                lbkum: item.lbkum,
                demand: item.demand,
                actualDemand: item.demand,
                deliveryDate: item.deliveryDate,
                deliveryTime: item.deliveryTime,
            });
        }
    }

    // 3. Execute Batch Create (Fastest)
    if (toCreate.length > 0) {
        const createChunkSize = 2500; // Large chunk for createMany
        for (let i = 0; i < toCreate.length; i += createChunkSize) {
            const chunk = toCreate.slice(i, i + createChunkSize);
            await prisma.material.createMany({ data: chunk });
            processedCount += chunk.length;
            if (onProgress) onProgress(processedCount, total);
        }
    }

    // 4. Execute Batch Update (Promise.all in chunks)
    // Update is slower than Create because we can't use updateMany with different values
    if (toUpdate.length > 0) {
        const updateChunkSize = 200; // Higher concurrency
        for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
            const chunk = toUpdate.slice(i, i + updateChunkSize);

            // Run updates in parallel for this chunk
            await Promise.all(
                chunk.map(item =>
                    prisma.material.update({
                        where: { id: item.id },
                        data: item.data
                    })
                )
            );

            processedCount += chunk.length;
            if (onProgress) onProgress(processedCount, total);
        }
    }

    return total;
};

