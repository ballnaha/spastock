'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
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
    Chip,
    CircularProgress,
    TablePagination,
    MenuItem,
    Select,
    FormControl,
    Tooltip,
    useMediaQuery,
    useTheme,
    LinearProgress,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    SearchNormal1,
    Add,
    DocumentUpload,
    Filter,
    Box as BoxIcon,
    CloseCircle,
    Refresh,
    Calendar,
    Clock,

    Building,
    Danger,
} from 'iconsax-react';
import { useRouter } from 'next/navigation';
import CustomSnackbar from '@/components/ui/CustomSnackbar';

interface Material {
    id: number;
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
    deliveryDate: string | null;
    deliveryTime: string | null;
    createdAt: string;
    updatedAt: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Mobile Material Card Component
const MaterialCard = React.memo(({ item }: { item: Material }) => {
    const stockPct = item.mabst ? Math.min(((item.lbkum || 0) / item.mabst) * 100, 100) : 0;
    const isLow = (item.lbkum || 0) < (item.minbe || 0);
    const isOut = !item.lbkum || item.lbkum === 0;

    return (
        <Box sx={{
            p: 2,
            mb: 1.5,
            bgcolor: '#FFFFFF',
            borderRadius: 3,
            border: '1px solid #F4F4F4',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            '&:active': { bgcolor: '#FAFAFA' },
        }}>
            {/* Header: Name + Type Chip */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Box sx={{
                    width: 40, height: 40, bgcolor: isOut ? '#FFF0F0' : isLow ? '#FFF8E6' : '#F0F4FF',
                    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <BoxIcon size="20" color={isOut ? '#FF4D4D' : isLow ? '#FFAA00' : '#2D60FF'} variant="Bulk" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {item.maktx || 'No Description'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9A9FA5' }}>
                        {item.matnr}
                    </Typography>
                </Box>
                {item.mtart && (
                    <Chip
                        label={item.mtart}
                        size="small"
                        sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 22,
                            bgcolor: '#F0F4FF', color: '#2D60FF', borderRadius: 1.5
                        }}
                    />
                )}
            </Stack>

            {/* Info Row: Plant + Group */}
            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                {item.werks && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Building size="14" color="#9A9FA5" variant="Bold" />
                        <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 600 }}>
                            {item.werks}
                        </Typography>
                    </Stack>
                )}
                {item.matkl && (
                    <Typography variant="caption" sx={{ color: '#9A9FA5' }}>
                        {item.matkl} {item.wgbez ? `• ${item.wgbez}` : ''}
                    </Typography>
                )}
            </Stack>

            {/* Stock Bar */}
            <Box sx={{ mb: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 600 }}>
                        Stock
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="baseline">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isLow ? '#FF4D4D' : '#1A1D1F' }}>
                            {item.lbkum?.toLocaleString() ?? 0}
                        </Typography>
                        {item.mabst ? (
                            <Typography variant="caption" color="text.secondary">
                                / {item.mabst.toLocaleString()}
                            </Typography>
                        ) : null}
                        <Typography variant="caption" sx={{ color: isLow ? '#FF4D4D' : '#6F767E', fontWeight: 600 }}>
                            ({stockPct.toFixed(0)}%)
                        </Typography>
                    </Stack>
                </Stack>
                <LinearProgress
                    variant="determinate"
                    value={stockPct}
                    sx={{
                        height: 6, borderRadius: 3, bgcolor: '#EFEFEF',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: isOut ? '#D0D0D0' : isLow ? '#FF4D4D' : '#00B074',
                        }
                    }}
                />
            </Box>

            {/* Bottom Info Row */}
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.8 }}>
                {item.minbe != null && (
                    <Chip
                        label={`Reorder: ${item.minbe.toLocaleString()}`}
                        size="small"
                        sx={{
                            height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5,
                            bgcolor: isLow ? 'rgba(255, 77, 77, 0.08)' : '#F4F4F4',
                            color: isLow ? '#FF4D4D' : '#6F767E',
                        }}
                    />
                )}
                {item.demand != null && (
                    <Chip
                        label={`Demand: ${item.demand.toLocaleString()}`}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, bgcolor: '#F4F4F4', color: '#6F767E' }}
                    />
                )}
                {item.plifz != null && (
                    <Chip
                        label={`${item.plifz} days`}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, bgcolor: '#F4F4F4', color: '#6F767E' }}
                    />
                )}
                {item.deliveryDate && (
                    <Stack direction="row" spacing={0.3} alignItems="center">
                        <Calendar size="12" color="#9A9FA5" variant="Bold" />
                        <Typography variant="caption" sx={{ color: '#9A9FA5', fontSize: '0.7rem' }}>
                            {item.deliveryDate}
                        </Typography>
                    </Stack>
                )}
                {item.deliveryTime && (
                    <Stack direction="row" spacing={0.3} alignItems="center">
                        <Clock size="12" color="#9A9FA5" variant="Bold" />
                        <Typography variant="caption" sx={{ color: '#9A9FA5', fontSize: '0.7rem' }}>
                            {item.deliveryTime}
                        </Typography>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
});
MaterialCard.displayName = 'MaterialCard';

export default function InventoryPage() {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mounted, setMounted] = useState(false);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1, limit: 25, total: 0, totalPages: 0,
    });

    // Filters
    const [filterType, setFilterType] = useState('');
    const [filterPlant, setFilterPlant] = useState('');
    const [filterStock, setFilterStock] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filter options (populated from data)
    const [typeOptions, setTypeOptions] = useState<string[]>([]);
    const [plantOptions, setPlantOptions] = useState<string[]>([]);

    // Sync state
    // Sync state
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    // Prevent SSR hydration mismatch (MUI generates dynamic IDs)
    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page + 1),
                limit: String(rowsPerPage),
                ...(search && { search }),
                ...(filterType && { mtart: filterType }),
                ...(filterPlant && { werks: filterPlant }),
                ...(filterStock && { stockStatus: filterStock }),
            });
            const res = await fetch(`/api/materials?${params}`);
            const json = await res.json();

            // Map the API structure (materials, pagination) to what the page expects
            const materialsData = json.materials || [];
            setMaterials(materialsData);
            setPagination(json.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 });

            // Populate filter options if facets available
            if (json.facets) {
                setTypeOptions(json.facets.types || []);
                setPlantOptions(json.facets.plants || []);
            }
        } catch (error) {
            console.error('Failed to fetch materials:', error);
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, filterType, filterPlant, filterStock]);

    useEffect(() => {
        if (mounted) fetchMaterials();
    }, [fetchMaterials, mounted]);

    // Fetch filter options on mount
    useEffect(() => {
        if (!mounted) return;
        const fetchOptions = async () => {
            try {
                const res = await fetch('/api/materials/filters');
                const json = await res.json();
                setTypeOptions(json.types || []);
                setPlantOptions(json.plants || []);
            } catch { }
        };
        fetchOptions();
    }, [mounted]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Early return AFTER all hooks
    if (!mounted) {
        return null;
    }

    const handleSyncZmm100 = () => {
        setConfirmOpen(true);
    };

    const handleConfirmSync = async () => {
        setConfirmOpen(false);
        setSyncing(true);
        setSyncProgress(0);
        setSyncMessage('Starting sync...');

        try {
            const res = await fetch('/api/inventory/sync-zmm100', { method: 'POST' });
            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.progress) setSyncProgress(data.progress);
                        if (data.message) setSyncMessage(data.message);
                        if (data.error) throw new Error(data.error);
                        if (data.success) {
                            setSnackbar({ open: true, message: data.message, severity: 'success' });
                            fetchMaterials();
                        }
                    } catch (e) {
                        console.error('Error parsing sync stream:', e);
                    }
                }
            }
        } catch (error: any) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setSyncing(false);
        }
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const clearAllFilters = () => {
        setFilterType('');
        setFilterPlant('');
        setFilterStock('');
        setSearchInput('');
        setSearch('');
        setPage(0);
    };

    const activeFilterCount = [filterType, filterPlant, filterStock].filter(Boolean).length;

    const selectSx = {
        minWidth: { xs: '100%', sm: 160 },
        '.MuiSelect-select': {
            py: 1,
            fontSize: '0.875rem',
        },
        '.MuiOutlinedInput-notchedOutline': {
            borderColor: '#EFEFEF',
            borderRadius: 2,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2D60FF',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2D60FF',
            borderWidth: 1.5,
        },
    };

    // Empty state component
    const EmptyState = () => (
        <Box sx={{ py: 8, textAlign: 'center' }}>
            <Box sx={{ mb: 2, opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                <BoxIcon size="48" color="#2D60FF" variant="Bulk" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1D1F' }}>
                {search || activeFilterCount > 0 ? 'No Results Found' : 'No Materials Found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {search || activeFilterCount > 0
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by importing an Excel file or adding a new material.'}
            </Typography>
            {!search && activeFilterCount === 0 && (
                <Button
                    variant="contained"
                    startIcon={<DocumentUpload size="20" color="#FFFFFF" variant="Linear" />}
                    onClick={() => router.push('/admin/inventory/import')}
                    sx={{ borderRadius: 2, bgcolor: '#2D60FF' }}
                >
                    Import Now
                </Button>
            )}
            {(search || activeFilterCount > 0) && (
                <Button
                    variant="outlined"
                    onClick={clearAllFilters}
                    sx={{ borderRadius: 2, borderColor: '#EFEFEF', color: '#6F767E' }}
                >
                    Clear Filters
                </Button>
            )}
        </Box>
    );

    return (
        <Box>
            {/* Header Area */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ sm: 'center' }}
                spacing={2}
                sx={{ mb: { xs: 2, md: 4 } }}
            >
                <Box>
                    <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, color: '#1A1D1F', mb: 0.5 }}>
                        Inventory Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Manage your products, stock levels, and material data.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="เพิ่มรายการใหม่ หรือ อัปเดตรายการเดิม (ข้อมูลเก่าไม่หาย)">
                        <Button
                            variant="outlined"
                            startIcon={!isMobile ? <DocumentUpload size="20" color="#2D60FF" variant="Bulk" /> : undefined}
                            onClick={() => router.push('/admin/inventory/import')}
                            sx={{
                                borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                                borderColor: '#2D60FF', color: '#2D60FF',
                                px: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                '&:hover': { borderColor: '#1A4DDF', bgcolor: 'rgba(45, 96, 255, 0.04)' }
                            }}
                        >
                            {isMobile ? <DocumentUpload size="20" color="#2D60FF" variant="Bulk" /> : 'Import (Add/Update)'}
                        </Button>
                    </Tooltip>

                    <Tooltip title={pagination.total === 0 ? "กรุณา Import ข้อมูลก่อนเปิดใช้งาน Sync" : "รีเซ็ตฐานข้อมูลให้ตรงกับไฟล์ ZMM100 ล่าสุด (รายการที่ไม่มีในไฟล์จะถูกลบ)"}>
                        <span>
                            <Button
                                variant="contained"
                                disabled={syncing || pagination.total === 0}
                                startIcon={!isMobile ? (syncing ? <CircularProgress size={20} color="inherit" /> : <Refresh size="20" color="#FFF" variant="Bold" />) : undefined}
                                onClick={handleSyncZmm100}
                                sx={{
                                    borderRadius: 2.5, textTransform: 'none', fontWeight: 600,
                                    bgcolor: '#FF4D4D', color: '#FFF',
                                    px: { xs: 2, sm: 3 }, fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    '&:hover': { bgcolor: '#E04343' },
                                    '&.Mui-disabled': { bgcolor: '#FFCCCC', color: '#FFF' }
                                }}
                            >
                                {isMobile ? <Refresh size="20" color="#FFF" variant="Bold" /> : (syncing ? 'Syncing...' : 'Full Sync (Reset)')}
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Content Card */}
            <Card sx={{
                borderRadius: { xs: 2, md: 4 },
                border: '1px solid #EFEFEF',
                boxShadow: { xs: '0px 2px 12px rgba(0,0,0,0.03)', md: '0px 10px 30px rgba(0,0,0,0.03)' },
                overflow: 'hidden'
            }}>
                {/* Filter Bar */}
                <Box sx={{ p: { xs: 1.5, md: 2.5 }, borderBottom: '1px solid #EFEFEF' }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={{ xs: 1, md: 2 }}
                        alignItems={{ md: 'center' }}
                        justifyContent="space-between"
                    >
                        {/* Search + Filter Toggle */}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                            <Paper sx={{
                                p: '4px 12px', display: 'flex', alignItems: 'center',
                                flex: 1, maxWidth: { xs: '100%', md: 400 },
                                bgcolor: '#F4F4F4', border: 'none', boxShadow: 'none', borderRadius: 2.5
                            }}>
                                <SearchNormal1 size="18" color="#2D60FF" variant="Linear" />
                                <InputBase
                                    sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
                                    placeholder={isMobile ? 'Search...' : 'Search materials, SKU, group...'}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                {searchInput && (
                                    <IconButton size="small" onClick={() => setSearchInput('')}>
                                        <CloseCircle size="16" color="#9A9FA5" variant="Bold" />
                                    </IconButton>
                                )}
                            </Paper>

                            <Button
                                variant={showFilters ? 'contained' : 'outlined'}
                                onClick={() => setShowFilters(!showFilters)}
                                sx={{
                                    textTransform: 'none', fontWeight: 600, borderRadius: 2,
                                    minWidth: { xs: 42, sm: 'auto' },
                                    px: { xs: 1, sm: 2 },
                                    ...(showFilters ? {
                                        bgcolor: '#2D60FF', color: '#FFFFFF',
                                        '&:hover': { bgcolor: '#1A4DDF' },
                                    } : {
                                        borderColor: '#EFEFEF', color: '#6F767E',
                                        '&:hover': { borderColor: '#2D60FF', color: '#2D60FF' },
                                    })
                                }}
                            >
                                <Filter size="18" variant="Bulk" color={showFilters ? '#FFFFFF' : '#2D60FF'} />
                                {!isMobile && <Box component="span" sx={{ ml: 0.8 }}>Filters</Box>}
                                {activeFilterCount > 0 && (
                                    <Box sx={{
                                        ml: 0.8, bgcolor: showFilters ? 'rgba(255,255,255,0.3)' : '#2D60FF',
                                        color: '#FFFFFF', borderRadius: '50%',
                                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 800
                                    }}>
                                        {activeFilterCount}
                                    </Box>
                                )}
                            </Button>

                            <Tooltip title="Refresh data">
                                <IconButton size="small" onClick={fetchMaterials} sx={{ bgcolor: '#F4F4F4', borderRadius: 2 }}>
                                    <Refresh size="16" color="#6F767E" variant="Linear" />
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Result count */}
                        <Typography variant="body2" sx={{ color: '#9A9FA5', fontWeight: 500, display: { xs: 'none', md: 'block' } }}>
                            {pagination.total.toLocaleString()} materials
                        </Typography>
                    </Stack>

                    {/* Expanded Filter Options */}
                    {showFilters && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F4F4F4' }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1.5}
                                alignItems={{ sm: 'center' }}
                                flexWrap="wrap"
                            >
                                {/* Material Type Filter */}
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                                    <Select
                                        displayEmpty
                                        value={filterType}
                                        onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
                                        sx={selectSx}
                                        renderValue={(val) => val || 'Material Type'}
                                        MenuProps={{ disableScrollLock: true }}
                                    >
                                        <MenuItem value="">
                                            <em>All Types</em>
                                        </MenuItem>
                                        {typeOptions.map((t) => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Plant Filter */}
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                                    <Select
                                        displayEmpty
                                        value={filterPlant}
                                        onChange={(e) => { setFilterPlant(e.target.value); setPage(0); }}
                                        sx={selectSx}
                                        renderValue={(val) => val || 'Plant'}
                                        MenuProps={{ disableScrollLock: true }}
                                    >
                                        <MenuItem value="">
                                            <em>All Plants</em>
                                        </MenuItem>
                                        {plantOptions.map((p) => (
                                            <MenuItem key={p} value={p}>{p}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Stock Status Filter */}
                                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                                    <Select
                                        displayEmpty
                                        value={filterStock}
                                        onChange={(e) => { setFilterStock(e.target.value); setPage(0); }}
                                        sx={selectSx}
                                        renderValue={(val) => {
                                            const labels: Record<string, string> = { low: 'Low Stock', normal: 'Normal', out: 'Out of Stock' };
                                            return labels[val] || 'Stock Status';
                                        }}
                                        MenuProps={{ disableScrollLock: true }}
                                    >
                                        <MenuItem value="">
                                            <em>All Status</em>
                                        </MenuItem>
                                        <MenuItem value="low">🔴 Low Stock</MenuItem>
                                        <MenuItem value="normal">🟢 Normal</MenuItem>
                                        <MenuItem value="out">⚫ Out of Stock</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Clear Filters */}
                                {activeFilterCount > 0 && (
                                    <Button
                                        size="small"
                                        startIcon={<CloseCircle size="16" variant="Bold" />}
                                        onClick={clearAllFilters}
                                        sx={{
                                            textTransform: 'none', fontWeight: 600,
                                            color: '#FF4D4D', fontSize: '0.8125rem',
                                            '&:hover': { bgcolor: 'rgba(255, 77, 77, 0.06)' }
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </Stack>

                            {/* Active Filter Chips */}
                            {activeFilterCount > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                                    {filterType && (
                                        <Chip
                                            label={`Type: ${filterType}`}
                                            size="small"
                                            onDelete={() => { setFilterType(''); setPage(0); }}
                                            sx={{ bgcolor: 'rgba(45, 96, 255, 0.08)', color: '#2D60FF', fontWeight: 600, borderRadius: 2 }}
                                        />
                                    )}
                                    {filterPlant && (
                                        <Chip
                                            label={`Plant: ${filterPlant}`}
                                            size="small"
                                            onDelete={() => { setFilterPlant(''); setPage(0); }}
                                            sx={{ bgcolor: 'rgba(45, 96, 255, 0.08)', color: '#2D60FF', fontWeight: 600, borderRadius: 2 }}
                                        />
                                    )}
                                    {filterStock && (
                                        <Chip
                                            label={`Stock: ${filterStock === 'low' ? 'Low Stock' : filterStock === 'normal' ? 'Normal' : 'Out of Stock'}`}
                                            size="small"
                                            onDelete={() => { setFilterStock(''); setPage(0); }}
                                            sx={{ bgcolor: 'rgba(45, 96, 255, 0.08)', color: '#2D60FF', fontWeight: 600, borderRadius: 2 }}
                                        />
                                    )}
                                </Stack>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Mobile: result count */}
                {isMobile && (
                    <Box sx={{ px: 2, py: 1, bgcolor: '#F9F9FB', borderBottom: '1px solid #F4F4F4' }}>
                        <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 600 }}>
                            {pagination.total.toLocaleString()} materials found
                        </Typography>
                    </Box>
                )}

                {/* Content: Table (Desktop) or Cards (Mobile) */}
                {loading ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <CircularProgress size={32} sx={{ color: '#2D60FF' }} />
                        <Typography color="text.secondary" sx={{ mt: 2 }}>Loading materials...</Typography>
                    </Box>
                ) : materials.length === 0 ? (
                    <EmptyState />
                ) : isMobile ? (
                    /* ===== MOBILE CARD VIEW ===== */
                    <Box sx={{ px: 1.5, pt: 1 }}>
                        {materials.map((item) => (
                            <MaterialCard key={item.id} item={item} />
                        ))}
                    </Box>
                ) : (
                    /* ===== DESKTOP TABLE VIEW ===== */
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 1200 }}>
                            <TableHead sx={{ bgcolor: '#F9F9FB' }}>
                                <TableRow>
                                    {[
                                        'Material Info', 'Group', 'Custom Group', 'Type', 'Unit',
                                        'Plant', 'MRP / Lot Size', 'Stock Level', 'Reorder Pt.',
                                        'Demand', 'Lead Time', 'Delivery Date', 'Delivery Time',
                                    ].map((header) => (
                                        <TableCell
                                            key={header}
                                            align="left"
                                            sx={{ fontWeight: 700, color: '#6F767E', fontSize: '0.75rem', textTransform: 'uppercase' }}
                                        >
                                            {header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {materials.map((item) => {
                                    const stockPct = item.mabst ? Math.min(((item.lbkum || 0) / item.mabst) * 100, 100) : 0;
                                    const isLow = (item.lbkum || 0) < (item.minbe || 0);
                                    return (
                                        <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            {/* Material Info */}
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={{ width: 36, height: 36, bgcolor: '#F4F4F4', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <BoxIcon size="18" color="#2D60FF" variant="Bulk" />
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                            {item.maktx || 'No Description'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">{item.matnr}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>

                                            {/* Group */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.matkl || '-'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.wgbez || ''}</Typography>
                                            </TableCell>

                                            {/* Custom Group */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.zmatg2 || '-'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.zdest2 || ''}</Typography>
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell>
                                                <Chip label={item.mtart || '-'} size="small" sx={{ fontWeight: 600, bgcolor: '#F4F4F4', borderRadius: 1.5 }} />
                                            </TableCell>

                                            {/* Unit */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.mseh3 || '-'}</Typography>
                                            </TableCell>

                                            {/* Plant */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.werks || '-'}</Typography>
                                            </TableCell>

                                            {/* MRP / Lot Size */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.dismm || '-'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.disls ? `Lot: ${item.disls}` : ''}</Typography>
                                            </TableCell>

                                            {/* Stock Level */}
                                            <TableCell sx={{ whiteSpace: 'normal', minWidth: 100 }}>
                                                <Stack spacing={0.5}>
                                                    <Stack direction="row" spacing={0.5} alignItems="baseline" flexWrap="wrap">
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {item.lbkum?.toLocaleString() ?? 0}
                                                        </Typography>
                                                        {item.mabst ? (
                                                            <Typography variant="caption" color="text.secondary">
                                                                / {item.mabst.toLocaleString()}
                                                            </Typography>
                                                        ) : null}
                                                    </Stack>
                                                    <Box sx={{ width: '100%', maxWidth: 100, height: 4, bgcolor: '#EFEFEF', borderRadius: 1 }}>
                                                        <Box sx={{
                                                            width: `${stockPct}%`, height: '100%',
                                                            bgcolor: isLow ? '#FF4D4D' : '#00B074',
                                                            borderRadius: 1, transition: 'width 0.3s ease'
                                                        }} />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: isLow ? '#FF4D4D' : '#6F767E', fontWeight: 600 }}>
                                                        {stockPct.toFixed(0)}%
                                                    </Typography>
                                                </Stack>
                                            </TableCell>

                                            {/* Reorder Point */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: isLow ? '#FF4D4D' : '#1A1D1F' }}>
                                                    {item.minbe?.toLocaleString() ?? '-'}
                                                </Typography>
                                            </TableCell>

                                            {/* Demand */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.demand?.toLocaleString() ?? '-'}
                                                </Typography>
                                            </TableCell>

                                            {/* Lead Time */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.plifz != null ? `${item.plifz} days` : '-'}
                                                </Typography>
                                            </TableCell>

                                            {/* Delivery Date */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.deliveryDate || '-'}
                                                </Typography>
                                            </TableCell>

                                            {/* Delivery Time */}
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {item.deliveryTime || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Pagination */}
                <TablePagination
                    component="div"
                    count={pagination.total}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={isMobile ? [10, 25] : [10, 25, 50, 100]}
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
            </Card>

            {/* Sync Confirmation Dialog */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                disableScrollLock
                PaperProps={{
                    sx: { borderRadius: 3, maxWidth: 400 }
                }}
            >
                <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40, height: 40, bgcolor: '#FFF0F0', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Danger size="24" color="#FF4D4D" variant="Bold" />
                    </Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 800 }}>ยืนยันการ Sync ข้อมูล</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText component="div" sx={{ color: '#6F767E', fontSize: '0.925rem' }}>
                        ระบบจะทำการ <b>Reset ข้อมูล</b> ให้ตรงกับไฟล์ Excel (ZMM100) ล่าสุด 100%
                        <br /><br />
                        <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                            <li>รายการที่มีอยู่: <b>อัปเดตข้อมูล</b> (รักษาวันที่ส่งของเดิม)</li>
                            <li>รายการใหม่: <b>สร้างเพิ่ม</b></li>
                            <li style={{ color: '#FF4D4D', fontWeight: 'bold', marginTop: '4px' }}>รายการที่ไม่มีในไฟล์: จะถูกลบออกจากระบบทันที</li>
                        </ul>
                        คุณต้องการดำเนินการต่อหรือไม่?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setConfirmOpen(false)}
                        sx={{
                            color: '#6F767E', fontWeight: 600, textTransform: 'none', borderRadius: 2,
                            px: 3, '&:hover': { bgcolor: '#F4F4F4' }
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleConfirmSync}
                        variant="contained"
                        sx={{
                            bgcolor: '#FF4D4D', fontWeight: 600, textTransform: 'none', borderRadius: 2,
                            px: 3, boxShadow: '0px 4px 12px rgba(255, 77, 77, 0.2)',
                            '&:hover': { bgcolor: '#E04343' }
                        }}
                        autoFocus
                    >

                        ยืนยัน, อัปเดตข้อมูล
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Progress Dialog */}
            <Dialog
                open={syncing}
                PaperProps={{
                    sx: { borderRadius: 3, maxWidth: 400, width: '100%', p: 2 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
                    <CircularProgress size={24} color="primary" />
                    <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                        System Syncing...
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {syncMessage || 'Processing...'}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={syncProgress}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#F4F4F4', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#9A9FA5', display: 'block', textAlign: 'right' }}>
                        {syncProgress}% Complete
                    </Typography>
                </DialogContent>
            </Dialog>

            {/* Snackbar */}
            {/* Snackbar */}
            <CustomSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </Box>
    );
}
