'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
    Box,
    Typography,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputBase,
    IconButton,
    CircularProgress,
    useMediaQuery,
    useTheme,
    Chip,
    LinearProgress,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TablePagination,
    SwipeableDrawer,
    TextField,
} from '@mui/material';
import {
    SearchNormal1,
    CloseCircle,
    Refresh,
    Calendar,
    Clock,
    Box as BoxIcon,
    Edit2,
    DocumentDownload,
    Danger
} from 'iconsax-react';
import CustomSnackbar from '@/components/ui/CustomSnackbar';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

interface Material {
    id: string;
    material: string;
    matnr: string;
    stock: number;
    reorder: number;
    maxLfl: number;
    demand: number;
    actualDemand: number;
    mrpType: string;
    plant: string;
    deliveryDate: string | null;
    deliveryTime: string | null;
}

const MaterialItemCard = React.memo(({ item, onEdit, mounted }: { item: Material, onEdit: (item: Material) => void, mounted: boolean }) => (
    <Box
        sx={{
            p: 2,
            mb: 1.5,
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            border: '1px solid #F4F4F4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            '&:active': { bgcolor: '#F9F9FB' }
        }}
    >
        {/* Material name + Edit */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Box sx={{
                width: 38, height: 38,
                bgcolor: '#F0F4FF',
                borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <BoxIcon size="20" color='#2D60FF' variant="Bulk" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, fontSize: '0.875rem' }}>
                    {item.material}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9A9FA5', fontSize: '0.75rem', fontWeight: 600 }}>
                    {item.matnr}
                </Typography>
            </Box>
            <Stack direction="row" spacing={1.2} alignItems="center">
                <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: item.actualDemand !== item.demand ? '#2D60FF' : '#9A9FA5', fontWeight: 800, display: 'block', fontSize: '0.625rem', mb: -0.2 }}>
                        {item.actualDemand !== item.demand ? 'ADJUSTED' : 'ACTUAL'}
                    </Typography>
                    <Typography variant="body2" sx={{
                        fontWeight: 800,
                        color: item.actualDemand !== item.demand ? '#2D60FF' : '#1A1D1F',
                        fontSize: '1rem'
                    }}>
                        {Math.round(item.actualDemand).toLocaleString('en-US')}
                    </Typography>
                </Box>
                <Tooltip title="System Demand">
                    <Box sx={{
                        bgcolor: item.demand > 0 ? '#E53535' : '#F4F4F4',
                        color: item.demand > 0 ? '#FFFFFF' : '#6F767E',
                        px: 1.2, py: 0.5, borderRadius: 1.5,
                        fontWeight: 800, fontSize: '0.8rem', textAlign: 'center', minWidth: 50
                    }}>
                        {item.demand.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Box>
                </Tooltip>
                <IconButton
                    size="small"
                    onClick={() => onEdit(item)}
                    sx={{
                        bgcolor: '#F0F4FF', width: 32, height: 32,
                        '&:hover': { bgcolor: '#DDE6FF' },
                        boxShadow: '0 2px 6px rgba(45, 96, 255, 0.1)'
                    }}
                >
                    <Edit2 size="16" color="#2D60FF" variant="Bold" />
                </IconButton>
            </Stack>
        </Stack>

        {/* Stock info row */}
        <Stack direction="row" spacing={0} sx={{ mb: 2, bgcolor: '#F9F9FB', borderRadius: 2, p: 1.5 }}>
            <Box sx={{ flex: 1, textAlign: 'center', borderRight: '1px solid #EEE' }}>
                <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 700, display: 'block', fontSize: '0.65rem', mb: 0.2 }}>
                    STOCK
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.9rem', color: item.stock < item.reorder ? '#FF4D4D' : '#1A1D1F' }}>
                    {item.stock.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', borderRight: '1px solid #EEE' }}>
                <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 700, display: 'block', fontSize: '0.65rem', mb: 0.2 }}>
                    REORDER
                </Typography>
                <Typography variant="body2" sx={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: (item.reorder || 0) === 0 ? '#FF4D4D' : '#6F767E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                }}>
                    {item.reorder.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    {(!item.reorder || item.reorder === 0) && <Danger size="12" variant="Bold" />}
                </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 700, display: 'block', fontSize: '0.65rem', mb: 0.2 }}>
                    MAX
                </Typography>
                <Typography variant="body2" sx={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: (item.maxLfl || 0) === 0 ? '#FF4D4D' : '#6F767E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                }}>
                    {item.maxLfl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    {(!item.maxLfl || item.maxLfl === 0) && <Danger size="12" variant="Bold" />}
                </Typography>
            </Box>
        </Stack>

        {/* Stock bar */}
        <Box sx={{ mb: 1.5, px: 0.5 }}>
            <LinearProgress
                variant="determinate"
                value={item.maxLfl ? Math.min((item.stock / item.maxLfl) * 100, 100) : 0}
                sx={{
                    height: 6, borderRadius: 3, bgcolor: '#EFEFEF',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: item.stock === 0 ? '#D0D0D0' : item.stock < item.reorder ? '#FF4D4D' : '#00B074',
                    }
                }}
            />
        </Box>

        {/* Date/Time & Tags */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
                <Chip label={item.mrpType} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F0F4FF', color: '#2D60FF' }} />
                <Chip label={item.plant} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F4F4F4', color: '#6F767E' }} />
            </Stack>

            {mounted && (item.deliveryDate || item.deliveryTime) && (
                <Stack direction="row" spacing={1.5}>
                    {item.deliveryDate && (
                        <Stack direction="row" spacing={0.3} alignItems="center">
                            <Calendar size="12" color="#2D60FF" variant="Bold" />
                            <Typography variant="caption" sx={{ color: '#1A1D1F', fontSize: '0.7rem', fontWeight: 600 }}>
                                {dayjs(item.deliveryDate).format('DD/MM/YY')}
                            </Typography>
                        </Stack>
                    )}
                    {item.deliveryTime && (
                        <Stack direction="row" spacing={0.3} alignItems="center">
                            <Clock size="12" color="#2D60FF" variant="Bold" />
                            <Typography variant="caption" sx={{ color: '#1A1D1F', fontSize: '0.7rem', fontWeight: 600 }}>
                                {item.deliveryTime}
                            </Typography>
                        </Stack>
                    )}
                </Stack>
            )}
        </Stack>
    </Box>
));
MaterialItemCard.displayName = 'MaterialItemCard';

interface Totals {
    stock: number;
    reorder: number;
    maxLfl: number;
    demand: number;
    actualDemand: number;
}

interface DashboardStockTableProps {
    filterMrpType: string;
    filterMinDemand: string;
    filterCritical: boolean;
}

const DashboardStockTable = ({ filterMrpType, filterMinDemand, filterCritical }: DashboardStockTableProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<Material[]>([]);
    const [totals, setTotals] = useState<Totals>({ stock: 0, reorder: 0, maxLfl: 0, demand: 0, actualDemand: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [exporting, setExporting] = useState(false);

    // Edit dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editItem, setEditItem] = useState<Material | null>(null);
    const [editDate, setEditDate] = useState<Dayjs | null>(null);
    const [editTime, setEditTime] = useState<Dayjs | null>(null);
    const [editActualDemand, setEditActualDemand] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const params = new URLSearchParams({
                ...(filterMrpType && { mrpType: filterMrpType }),
                ...(filterMinDemand && { minDemand: filterMinDemand }),
                ...(filterCritical && { critical: 'true' }),
                ...(search && { search }),
            });

            const response = await fetch(`/api/stock/export?${params.toString()}`);
            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().slice(0, 10);
            a.download = `Stock_Demand_${timestamp}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Export failed:', error);
            setSnackbar({ open: true, message: 'Failed to export data', severity: 'error' });
        } finally {
            setExporting(false);
        }
    };

    // Snackbar
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchStock = useCallback(async (isQuiet = false) => {
        try {
            if (!isQuiet) setLoading(true);
            const params = new URLSearchParams({
                ...(search && { search }),
                ...(filterMrpType && { mrpType: filterMrpType }),
                ...(filterMinDemand && { minDemand: filterMinDemand }),
                ...(filterCritical && { critical: 'true' }),
            });
            const res = await fetch(`/api/stock?${params}`);
            const json = await res.json();
            setData(json.data || []);
            setTotals(json.totals || { stock: 0, reorder: 0, maxLfl: 0, demand: 0, actualDemand: 0 });
        } catch (error) {
            console.error('Failed to fetch stock:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [search, filterMrpType, filterMinDemand, filterCritical]);

    useEffect(() => {
        if (mounted) fetchStock();
    }, [fetchStock, mounted]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset page when data changes
    useEffect(() => {
        setPage(0);
    }, [search, filterMrpType, filterMinDemand, filterCritical]);

    if (!mounted) return null;

    // Paginated data
    const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // Edit handlers
    const handleEditOpen = (item: Material) => {
        setEditItem(item);
        setEditDate(item.deliveryDate ? dayjs(item.deliveryDate) : null);
        setEditTime(item.deliveryTime ? dayjs(`2000-01-01T${item.deliveryTime}`) : null);
        setEditActualDemand(String(Math.round(item.actualDemand)));
        setEditOpen(true);
    };

    const handleEditClose = () => {
        if (saving) return;
        setEditOpen(false);
        // Small delay to clear state after animation
        setTimeout(clearEditState, 300);
    };

    const clearEditState = () => {
        setEditItem(null);
        setEditDate(null);
        setEditTime(null);
        setEditActualDemand('');
    };

    const handleEditSave = async () => {
        if (!editItem) return;
        try {
            setSaving(true);
            const res = await fetch('/api/stock', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editItem.id,
                    deliveryDate: editDate ? editDate.format('YYYY-MM-DD') : null,
                    deliveryTime: editTime ? editTime.format('HH:mm') : null,
                    actualDemand: editActualDemand !== '' ? Math.round(parseFloat(editActualDemand)) : null,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setSnackbar({ open: true, message: 'บันทึกสำเร็จ', severity: 'success' });
                handleEditClose();
                fetchStock(true); // Quiet refresh
            } else {
                setSnackbar({ open: true, message: json.error || 'เกิดข้อผิดพลาด', severity: 'error' });
            }
        } catch {
            setSnackbar({ open: true, message: 'เกิดข้อผิดพลาด', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Paper sx={{
                borderRadius: { xs: 2, md: 4 },
                border: '1px solid #EFEFEF',
                boxShadow: { xs: '0px 2px 12px rgba(0,0,0,0.03)', md: '0px 4px 20px rgba(0,0,0,0.04)' },
                overflow: 'hidden',
                mt: 4
            }}>
                {/* Search Bar */}
                <Box sx={{ p: { xs: 1.5, md: 2.5 }, borderBottom: '1px solid #EFEFEF' }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 1, md: 2 }}
                        alignItems={{ md: 'center' }}
                        justifyContent="space-between"
                    >
                        {/* Search + Refresh */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            <Paper sx={{
                                p: '4px 12px', display: 'flex', alignItems: 'center',
                                flex: 1, maxWidth: { xs: '100%', md: 360 },
                                bgcolor: '#F4F4F4', border: 'none', boxShadow: 'none', borderRadius: 2.5,
                            }}>
                                <SearchNormal1 size="18" color="#2D60FF" variant="Linear" />
                                <InputBase
                                    sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
                                    placeholder={isMobile ? 'Search...' : 'Search materials, SKU...'}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                {searchInput && (
                                    <IconButton size="small" onClick={() => setSearchInput('')}>
                                        <CloseCircle size="16" color="#9A9FA5" variant="Bold" />
                                    </IconButton>
                                )}
                            </Paper>

                            <Tooltip title="Refresh data">
                                <IconButton size="small" onClick={() => fetchStock()} sx={{ bgcolor: '#F4F4F4', borderRadius: 2 }}>
                                    <Refresh size="16" color="#6F767E" variant="Linear" />
                                </IconButton>
                            </Tooltip>

                            <Button
                                onClick={handleExport}
                                disabled={exporting || loading}
                                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Image src="https://img.icons8.com/color/48/microsoft-excel-2019.png" alt="excel" width={20} height={20} />}
                                sx={{
                                    bgcolor: '#1D6F42', // Excel green
                                    color: '#FFFFFF',
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    px: 2,
                                    height: 34,
                                    '&:hover': { bgcolor: '#165734' }, // Darker green
                                    '&.Mui-disabled': { bgcolor: '#F4F4F4', color: '#9A9FA5' },
                                    boxShadow: '0 2px 4px rgba(29, 111, 66, 0.15)'
                                }}
                            >
                                {exporting ? 'Exporting...' : 'Export Excel'}
                            </Button>
                        </Stack>

                        {/* Result count */}
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                label={`${data.length} items`}
                                size="small"
                                sx={{ fontWeight: 600, bgcolor: '#F0F4FF', color: '#2D60FF', borderRadius: 2 }}
                            />
                            <Chip
                                label={`Total Demand: ${Math.round(totals.demand).toLocaleString('en-US')}`}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#FFEBEB', color: '#E53535', borderRadius: 2 }}
                            />

                            <Chip
                                label={`Total Actual: ${Math.round(totals.actualDemand).toLocaleString('en-US')}`}
                                size="small"
                                sx={{ fontWeight: 600, bgcolor: '#F0F4FF', color: '#2D60FF', borderRadius: 2, opacity: 0.8 }}
                            />

                        </Stack>
                    </Stack>
                </Box>

                {/* Content */}
                {loading ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <CircularProgress size={32} sx={{ color: '#2D60FF' }} />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading stock data...</Typography>
                    </Box>
                ) : data.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <BoxIcon size="48" color="#2D60FF" variant="Bulk" />
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 2, color: '#1A1D1F' }}>
                            No Materials Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            No materials match the current criteria.
                        </Typography>
                    </Box>
                ) : (mounted && isMobile) ? (
                    /* ===== MOBILE VIEW ===== */
                    <Box sx={{
                        pb: 8, pt: 1, px: 1.5,
                        animation: 'fadeInTable 0.5s ease-out'
                    }}>
                        {paginatedData.map((item) => (
                            <MaterialItemCard key={item.id} item={item} onEdit={handleEditOpen} mounted={mounted} />
                        ))}

                        {/* Mobile Sticky Summary Footer */}
                        <Box sx={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            bgcolor: '#FFFFFF', borderTop: '1px solid #EFEFEF',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                            zIndex: 10, p: 2,
                            display: { xs: 'block', md: 'none' }
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 700, display: 'block' }}>
                                        TOTAL ITEMS
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A1D1F' }}>
                                        {data.length.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#FF4D4D', fontWeight: 700, display: 'block' }}>
                                        TOTAL DEMAND
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#FF4D4D' }}>
                                        {Math.round(totals.demand).toLocaleString('en-US')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                ) : (
                    /* ===== DESKTOP TABLE VIEW ===== */
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#F9F9FB' }}>
                                <TableRow>
                                    {['Material', 'Stock', 'Reorder', 'Max_LFL', 'Demand', 'Actual Demand', 'Date', 'Time', ''].map((header, i) => (
                                        <TableCell
                                            key={i}
                                            align={['Stock', 'Reorder', 'Max_LFL', 'Demand', 'Actual Demand'].includes(header) ? 'right' : header === '' ? 'center' : 'left'}
                                            sx={{
                                                fontWeight: 700, color: '#6F767E', fontSize: '0.8rem',
                                                py: 1.5,
                                                borderBottom: '2px solid #EFEFEF',
                                                ...(header === '' && { width: 60 }),
                                            }}
                                        >
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ animation: 'fadeInTable 0.5s ease-out' }}>
                                {paginatedData.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#FAFBFF' },
                                            borderBottom: '1px solid #F4F4F4',
                                        }}
                                    >
                                        <TableCell sx={{ py: 1.2, maxWidth: 350 }}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Box sx={{
                                                    width: 36, height: 36,
                                                    bgcolor: '#F0F4FF',
                                                    borderRadius: 2,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <BoxIcon size="18" color="#2D60FF" variant="Bulk" />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1A1D1F', mb: 0.2 }}>
                                                        {item.material}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>
                                                        {item.matnr}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {item.stock.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 600,
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                color: (item.reorder || 0) === 0 ? '#FF4D4D' : '#6F767E',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.5
                                            }}>
                                                {item.reorder.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                {(!item.reorder || item.reorder === 0) && <Danger size="14" variant="Bold" />}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 600,
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                color: (item.maxLfl || 0) === 0 ? '#FF4D4D' : '#6F767E',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.5
                                            }}>
                                                {item.maxLfl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                                {(!item.maxLfl || item.maxLfl === 0) && <Danger size="14" variant="Bold" />}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.2 }}>
                                            <Box sx={{
                                                display: 'inline-flex',
                                                bgcolor: item.demand > 0 ? '#E53535' : '#E0E0E0',
                                                color: item.demand > 0 ? '#FFFFFF' : '#6F767E',
                                                px: 1.5, py: 0.3,
                                                borderRadius: 1,
                                                fontWeight: 800,
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                minWidth: 60,
                                                justifyContent: 'center',
                                            }}>
                                                {item.demand.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 800,
                                                color: item.actualDemand !== item.demand ? '#2D60FF' : '#1A1D1F',
                                                fontFamily: 'monospace',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 0.5
                                            }}>
                                                {Math.round(item.actualDemand).toLocaleString('en-US')}
                                                {item.actualDemand !== item.demand && (
                                                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2D60FF' }} />
                                                )}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6F767E', fontSize: '0.85rem' }}>
                                                {item.deliveryDate ? dayjs(item.deliveryDate).format('DD/MM/YYYY') : '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 1.2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#6F767E', fontSize: '0.85rem' }}>
                                                {item.deliveryTime || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 1.2 }}>
                                            <Tooltip title="Edit Date/Time">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditOpen(item)}
                                                    sx={{
                                                        bgcolor: '#F0F4FF',
                                                        '&:hover': { bgcolor: '#DDE6FF' },
                                                    }}
                                                >
                                                    <Edit2 size="16" color="#2D60FF" variant="Bold" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Total Row */}
                                <TableRow sx={{ bgcolor: '#F9F9FB', '& td': { borderBottom: 'none' } }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                            Total
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {totals.stock.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {totals.reorder.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {totals.maxLfl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Box sx={{
                                            display: 'inline-flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end'
                                        }}>
                                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#E53535', fontFamily: 'monospace', fontSize: '1.1rem', lineHeight: 1 }}>
                                                {totals.demand.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                            </Typography>

                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2D60FF', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {Math.round(totals.actualDemand).toLocaleString('en-US')}
                                        </Typography>

                                    </TableCell>
                                    <TableCell />
                                    <TableCell />
                                    <TableCell />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                {!loading && data.length > 0 && (
                    <TablePagination
                        component="div"
                        count={data.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={isMobile ? [25, 50] : [25, 50, 100, 200]}
                        sx={{
                            borderTop: '1px solid #EFEFEF',
                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                fontSize: '0.8125rem', color: '#6F767E'
                            },
                            '.MuiTablePagination-toolbar': {
                                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                                justifyContent: { xs: 'center', sm: 'flex-end' },
                            }
                        }}
                    />
                )}
            </Paper>

            {/* Edit Modal (Swipeable Vaul-style Drawer for Mobile, Dialog for Desktop) */}
            {mounted && isMobile ? (
                <SwipeableDrawer
                    anchor="bottom"
                    open={editOpen}
                    onClose={handleEditClose}
                    onOpen={() => { }}
                    swipeAreaWidth={0}
                    transitionDuration={{ enter: 220, exit: 180 }}
                    disableBackdropTransition={true}
                    disableDiscovery={true}
                    disableSwipeToOpen={true}
                    disableScrollLock={true}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            maxHeight: '90vh',
                            p: 2,
                            pb: 4,
                            boxShadow: '0px -10px 30px rgba(0,0,0,0.08)'
                        },
                        '& .MuiBackdrop-root': {
                            backgroundColor: 'rgba(0,0,0,0.4)',
                        }
                    }}
                >
                    <Box sx={{ width: 40, height: 5, bgcolor: '#EFEFEF', borderRadius: 10, mx: 'auto', mb: 3 }} />
                    <Box sx={{ px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Edit Delivery Info</Typography>
                        {editItem && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1D1F' }}>
                                    {editItem.material}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9A9FA5' }}>
                                    {editItem.matnr}
                                </Typography>
                            </Box>
                        )}
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack spacing={3}>
                                <DatePicker
                                    label="Delivery Date"
                                    value={editDate}
                                    onChange={(newValue) => setEditDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                                <TimePicker
                                    label="Delivery Time"
                                    value={editTime}
                                    onChange={(newValue) => setEditTime(newValue)}
                                    ampm={false}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                                <TextField
                                    label="Actual Demand Override"
                                    fullWidth
                                    type="number"
                                    value={editActualDemand}
                                    onChange={(e) => setEditActualDemand(e.target.value)}
                                    helperText="Leave empty to use system demand"
                                />
                            </Stack>
                        </LocalizationProvider>
                    </Box>
                    <Box sx={{ mt: 4, px: 2, display: 'flex', gap: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleEditClose}
                            disabled={saving}
                            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, borderColor: '#EFEFEF', color: '#6F767E', textTransform: 'none' }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleEditSave}
                            disabled={saving}
                            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, bgcolor: '#2D60FF', textTransform: 'none' }}
                        >
                            {saving ? <CircularProgress size={24} color="inherit" /> : 'บันทึก'}
                        </Button>
                    </Box>
                </SwipeableDrawer>
            ) : (
                <Dialog
                    open={editOpen}
                    onClose={handleEditClose}
                    disableScrollLock={true}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 4, p: 1 }
                    }}
                    onTransitionExited={clearEditState}
                >
                    <DialogTitle sx={{ fontWeight: 800, color: '#1A1D1F', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, bgcolor: '#F0F4FF', borderRadius: 2, color: '#2D60FF', display: 'flex' }}>
                            <Edit2 size="24" variant="Bold" color="#2D60FF" />
                        </Box>
                        Edit Delivery Info
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 3, mt: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1D1F' }}>
                                {editItem?.material}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9A9FA5' }}>
                                {editItem?.matnr}
                            </Typography>
                        </Box>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack spacing={2.5}>
                                <DatePicker
                                    label="Delivery Date"
                                    value={editDate}
                                    onChange={(newValue) => setEditDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true, size: 'small',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: '#EFEFEF' },
                                                    '&:hover fieldset': { borderColor: '#2D60FF' },
                                                    '&.Mui-focused fieldset': { borderColor: '#2D60FF' },
                                                }
                                            }
                                        }
                                    }}
                                />
                                <TimePicker
                                    label="Delivery Time"
                                    value={editTime}
                                    onChange={(newValue) => setEditTime(newValue)}
                                    ampm={false}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true, size: 'small',
                                            sx: {
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: '#EFEFEF' },
                                                    '&:hover fieldset': { borderColor: '#2D60FF' },
                                                    '&.Mui-focused fieldset': { borderColor: '#2D60FF' },
                                                }
                                            }
                                        }
                                    }}
                                />
                                <TextField
                                    label="Actual Demand"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={editActualDemand}
                                    onChange={(e) => setEditActualDemand(e.target.value)}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '& fieldset': { borderColor: '#EFEFEF' },
                                            '&:hover fieldset': { borderColor: '#2D60FF' },
                                            '&.Mui-focused fieldset': { borderColor: '#2D60FF' },
                                        }
                                    }}
                                    helperText="Leave empty to use system demand"
                                />
                            </Stack>
                        </LocalizationProvider>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button
                            onClick={handleEditClose}
                            disabled={saving}
                            sx={{ color: '#6F767E', fontWeight: 700, textTransform: 'none' }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleEditSave}
                            variant="contained"
                            disabled={saving}
                            sx={{
                                bgcolor: '#2D60FF',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 4,
                                height: 44,
                                '&:hover': { bgcolor: '#1A4DDF' }
                            }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : 'บันทึก'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            />
            <style>
                {`
                    @keyframes fadeInTable {
                        from { opacity: 0.4; transform: translateY(5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </Box >
    );
};

export default DashboardStockTable;
