'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    Typography,
    Stack,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    LinearProgress,
    TablePagination
} from '@mui/material';
import {
    DocumentUpload,
    DocumentDownload,
    ArrowLeft,
    TickCircle,
    InfoCircle,
    CloseCircle
} from 'iconsax-react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function ImportMaterialsPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setLoading(true);
            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                setPreviewData(data); // Show all rows
                setPage(0); // Reset pagination
                setLoading(false);
                setStatus(null);
            };
            reader.readAsBinaryString(selectedFile);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            {
                'Material Number': 'MAT001',
                'Material Description': 'Example Material',
                'Material Group': 'GRP01',
                'Material Group Description': 'Description of Group',
                'Custom Group 2': 'Z01',
                'Custom Group 2 Description': 'Custom Description',
                'Material Type': 'RAW',
                'Base Unit': 'PC',
                'Plant': 'P001',
                'MRP Type': 'PD',
                'Reorder Point': 10,
                'Lot Size': 'EX',
                'Maximum Stock': 100,
                'Planned Delivery Time': 5,
                'Current Stock': 50
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(headers);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Materials Template");
        XLSX.writeFile(workbook, "materials_import_template.xlsx");
    };

    const handleImport = async () => {
        if (!file) return;

        setUploading(true);
        // Start from 0
        setProgress(0);
        setStatus({ type: 'info', message: 'Starting upload...' });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/materials/import', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok || !response.body) {
                // Try to parse error json if possible
                try {
                    const result = await response.json();
                    throw new Error(result.error || 'Failed to start import');
                } catch (e) {
                    throw new Error('Failed to connect to server');
                }
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                buffer += text;
                const lines = buffer.split('\n');

                // Keep the last partial line in buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.type === 'progress') {
                            setProgress(data.progress);
                            setStatus({
                                type: 'info',
                                message: `Processing... ${data.progress}% (${data.current.toLocaleString()} / ${data.total.toLocaleString()})`
                            });
                        } else if (data.type === 'complete') {
                            setProgress(100);
                            setStatus({
                                type: 'success',
                                message: data.message
                            });
                            setTimeout(() => router.push('/admin/inventory'), 1500);
                        } else if (data.type === 'error') {
                            throw new Error(data.message);
                        }
                    } catch (e) {
                        console.error('Stream parse error:', e, line);
                    }
                }
            }

        } catch (error: any) {
            console.error('Import error:', error);
            setStatus({ type: 'error', message: error.message || 'An unexpected error occurred during import' });
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            {/* Header Area - matches Inventory page style */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                        <IconButton onClick={() => router.back()} size="small" sx={{ bgcolor: '#F4F4F4' }}>
                            <ArrowLeft size="18" color="#2D60FF" variant="Bold" />
                        </IconButton>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1D1F' }}>
                            Import Materials
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Upload an Excel file to bulk import material data into the system.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<DocumentDownload size="20" variant="Bulk" color="#2D60FF" />}
                    onClick={downloadTemplate}
                    sx={{
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#EFEFEF',
                        color: '#1A1D1F',
                        px: 3,
                        '&:hover': { borderColor: '#2D60FF', bgcolor: 'rgba(45, 96, 255, 0.04)' }
                    }}
                >
                    Download Template
                </Button>
            </Stack>

            <Stack spacing={2}>
                {/* Instructions Alert - More Compact */}
                <Alert
                    severity="info"
                    icon={<InfoCircle size="20" color="#2D60FF" variant="Bulk" />}
                    sx={{
                        borderRadius: 3,
                        bgcolor: 'rgba(45, 96, 255, 0.04)',
                        border: '1px solid rgba(45, 96, 255, 0.1)',
                        '& .MuiAlert-message': { fontSize: '0.8125rem', color: '#1A1D1F' }
                    }}
                >
                    <strong>Instruction:</strong> Download template, fill in data, upload file, and confirm. (Supports .xlsx, .xls)
                </Alert>

                {/* Upload Area - More Compact */}
                {/* Compact Upload Area */}
                <Card sx={{
                    p: 2,
                    border: '1px solid #EFEFEF',
                    borderRadius: 3,
                    boxShadow: 'none',
                    bgcolor: 'white'
                }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#F4F4F4',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <DocumentUpload size="20" color="#2D60FF" variant="Bulk" />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {file ? file.name : 'Select Excel File'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supported formats: .xlsx, .xls'}
                            </Typography>
                        </Box>
                        <input
                            accept=".xlsx, .xls"
                            id="excel-upload"
                            type="file"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <label htmlFor="excel-upload">
                            <Button
                                component="span"
                                variant="outlined"
                                size="small"
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {file ? 'Change File' : 'Browse File'}
                            </Button>
                        </label>
                    </Stack>
                </Card>

                {status && (
                    <Alert
                        severity={status.type}
                        icon={status.type === 'success' ? <TickCircle size="20" variant="Bold" /> : status.type === 'error' ? <CloseCircle size="20" variant="Bold" /> : <InfoCircle size="20" variant="Bold" />}
                        sx={{ borderRadius: 3, '& .MuiAlert-message': { fontSize: '0.8125rem' } }}
                    >
                        {status.message}
                    </Alert>
                )}

                {/* Preview Table */}
                {file && (
                    <Card sx={{ p: 0, border: '1px solid #EFEFEF', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #EFEFEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F9F9FB' }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A1D1F' }}>
                                    File Preview
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total {previewData.length.toLocaleString()} records detected
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <TickCircle size="18" color="#FFF" variant="Bold" />}
                                onClick={handleImport}
                                disabled={uploading}
                                sx={{
                                    borderRadius: 2,
                                    bgcolor: '#2D60FF',
                                    boxShadow: '0px 8px 16px rgba(45, 96, 255, 0.2)',
                                    textTransform: 'none',
                                    fontSize: '0.8125rem',
                                    px: 2,
                                    '&:hover': { bgcolor: '#1A4DDF' }
                                }}
                            >
                                {uploading ? 'Importing...' : 'Confirm Import'}
                            </Button>
                        </Box>
                        {loading ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : (
                            <>
                                <TableContainer sx={{ overflow: 'auto' }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                                                    <TableCell
                                                        key={header}
                                                        sx={{
                                                            fontWeight: 700,
                                                            fontSize: '0.75rem',
                                                            textTransform: 'uppercase',
                                                            color: '#6F767E',
                                                            whiteSpace: 'nowrap',
                                                            bgcolor: '#F9F9FB'
                                                        }}
                                                    >
                                                        {header}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {previewData
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((row, index) => (
                                                    <TableRow key={index} hover>
                                                        {Object.keys(row).map((key, i) => (
                                                            <TableCell
                                                                key={i}
                                                                sx={{
                                                                    fontSize: '0.875rem',
                                                                    whiteSpace: 'nowrap',
                                                                    py: 1.5
                                                                }}
                                                            >
                                                                {row[key]?.toString() || '-'}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                    component="div"
                                    count={previewData.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    sx={{
                                        borderTop: '1px solid #EFEFEF',
                                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                            fontSize: '0.75rem',
                                            color: '#6F767E'
                                        }
                                    }}
                                />
                            </>
                        )}
                    </Card>
                )}

                {uploading && (
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ borderRadius: 1, height: 8 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 600 }}>
                            Please wait... {progress}% completed. Don't close this window.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
}
