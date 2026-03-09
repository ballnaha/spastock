'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField,
    InputBase, IconButton, Chip, TablePagination,
    CircularProgress, Switch, FormControlLabel,
    Stack, Fade, Tooltip,
    FormControl, Select, MenuItem, Checkbox, Button,
    SelectChangeEvent, Dialog, DialogTitle, DialogContent,
    DialogActions, useMediaQuery, useTheme, SwipeableDrawer
} from '@mui/material';
import CustomSnackbar from '@/components/ui/CustomSnackbar';
import {
    SearchNormal1,
    Box as BoxIcon,
    Edit2,
    TickCircle,
    InfoCircle,
    Danger,
    DirectboxReceive,
    CloseCircle,
    Filter,
    Add,
    ArchiveBook,
    Setting2
} from 'iconsax-react';

interface Material {
    id: number;
    matnr: string;
    maktx: string;
    matkl: string;
    lbkum: number;
    minbe: number | null;
    mabst: number | null;
    dismm: string;
    werks: string;
    demand: number | null;
    pscMaterial: string | null;
    pscMaterialDesc: string | null;
}

// Mobile Card Component
const MaterialMobileCard = ({ m, onEdit, isDataIncomplete }: { m: Material, onEdit: (m: Material) => void, isDataIncomplete: (m: Material) => boolean }) => (
    <Box sx={{
        p: 2, mb: 2,
        bgcolor: '#FFF',
        borderRadius: 3,
        border: '1px solid',
        borderColor: isDataIncomplete(m) ? 'rgba(255, 77, 77, 0.2)' : '#F4F4F4',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {isDataIncomplete(m) && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: '#FF4D4D' }} />
        )}

        <Stack spacing={2}>
            {/* Header: Icon + Info + Edit */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ p: 1, bgcolor: '#F0F4FF', borderRadius: 2, color: '#2D60FF', display: 'flex' }}>
                    <BoxIcon size="24" variant="Bulk" color="#2D60FF" />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1A1D1F', lineHeight: 1.3 }}>
                        {m.maktx}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 600 }}>
                        {m.matnr}
                    </Typography>
                    {m.pscMaterial && (
                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, display: 'block' }}>
                            PSC: {m.pscMaterial} {m.pscMaterialDesc ? `- ${m.pscMaterialDesc}` : ''}
                        </Typography>
                    )}
                </Box>
                <IconButton
                    size="small"
                    onClick={() => onEdit(m)}
                    sx={{ bgcolor: '#F0F4FF', '&:hover': { bgcolor: '#DDE6FF' } }}
                >
                    <Edit2 size="18" color="#2D60FF" variant="Bold" />
                </IconButton>
            </Stack>

            {/* Metrics Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: 1.5,
                bgcolor: '#F9F9FB',
                p: 1.5,
                borderRadius: 2
            }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#9A9FA5', fontWeight: 700, display: 'block', mb: 0.5 }}>STOCK</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{m.lbkum?.toLocaleString()}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 700, display: 'block', mb: 0.5 }}>REORDER</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: (m.minbe || 0) === 0 ? '#FF4D4D' : '#F59E0B' }}>
                            {m.minbe?.toLocaleString() || '0'}
                        </Typography>
                        {(!m.minbe || m.minbe === 0) && <Danger size="14" variant="Bold" color="#FF4D4D" />}
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: '#2D60FF', fontWeight: 700, display: 'block', mb: 0.5 }}>MAX</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: (m.mabst || 0) === 0 ? '#FF4D4D' : '#2D60FF' }}>
                            {m.mabst?.toLocaleString() || '0'}
                        </Typography>
                        {(!m.mabst || m.mabst === 0) && <Danger size="14" variant="Bold" color="#FF4D4D" />}
                    </Stack>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 700, display: 'block', mb: 0.5 }}>DEMAND</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#EF4444' }}>
                        {m.demand?.toLocaleString() || '0'}
                    </Typography>
                </Box>
            </Box>

            <Stack direction="row" spacing={1}>
                {m.dismm && <Chip label={`MRP: ${m.dismm}`} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: '#F4F4F4' }} />}
            </Stack>
        </Stack>
    </Box>
);

export default function MaterialsPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [data, setData] = useState<Material[]>([]);
    const [search, setSearch] = useState('');
    const [missingConfig, setMissingConfig] = useState(false);
    const [filterMrpType, setFilterMrpType] = useState('');
    const [filterMinDemand, setFilterMinDemand] = useState('');
    const [filterCritical, setFilterCritical] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 25 : 50);
    const [total, setTotal] = useState(0);
    const [mrpTypeOptions, setMrpTypeOptions] = useState<string[]>([]);

    // Modal editing states
    const [editOpen, setEditOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
    const [editValues, setEditValues] = useState<{ minbe: string; mabst: string; pscMaterial: string; pscMaterialDesc: string }>({ minbe: '', mabst: '', pscMaterial: '', pscMaterialDesc: '' });
    const [saving, setSaving] = useState(false);
    const facetsLoaded = React.useRef(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchMaterials = useCallback(async (isQuiet = false) => {
        try {
            if (!isQuiet) setLoading(true);
            const params = new URLSearchParams({
                search,
                missingConfig: missingConfig.toString(),
                ...(filterMrpType && { mrpType: filterMrpType }),
                ...(filterMinDemand && { minDemand: filterMinDemand }),
                ...(filterCritical && { critical: 'true' }),
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                includeFacets: (!facetsLoaded.current).toString()
            });
            const res = await fetch(`/api/materials?${params}`);
            if (!res.ok) {
                const errorJson = await res.json();
                throw new Error(errorJson.error || 'Failed to fetch materials');
            }
            const json = await res.json();
            setData(json.materials || []);
            if (json.pagination) {
                setTotal(json.pagination.total);
            }
            if (json.facets?.mrpTypes && !facetsLoaded.current) {
                setMrpTypeOptions(json.facets.mrpTypes);
                facetsLoaded.current = true;
            }
        } catch (error: any) {
            console.error('Fetch failed:', error);
            setSnackbar({ open: true, message: error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [search, missingConfig, page, rowsPerPage, filterMrpType, filterMinDemand, filterCritical]);

    useEffect(() => {
        const timer = setTimeout(fetchMaterials, 500);
        return () => clearTimeout(timer);
    }, [fetchMaterials]);

    const handleStartEdit = (m: Material) => {
        setSelectedMaterial(m);
        setEditValues({
            minbe: Math.round(m.minbe || 0).toString(),
            mabst: Math.round(m.mabst || 0).toString(),
            pscMaterial: m.pscMaterial || '',
            pscMaterialDesc: m.pscMaterialDesc || ''
        });
        setEditOpen(true);
    };

    const handleSave = async () => {
        if (!selectedMaterial) return;
        try {
            setSaving(true);
            const res = await fetch('/api/materials', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedMaterial.id,
                    minbe: editValues.minbe,
                    mabst: editValues.mabst,
                    pscMaterial: editValues.pscMaterial || null,
                    pscMaterialDesc: editValues.pscMaterialDesc || null
                })
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Material updated successfully', severity: 'success' });
                setEditOpen(false);
                setRefreshKey(prev => prev + 1);
                fetchMaterials(true);
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to update material', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const isDataIncomplete = (m: Material) => !m.minbe || !m.mabst || m.minbe === 0 || m.mabst === 0;

    const selectSx = {
        bgcolor: '#FFF',
        borderRadius: '10px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#EFEFEF' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#EFEFEF' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2D60FF' },
        '& .MuiSelect-select': { py: 1, px: 1.5, height: 'auto' }
    };

    const activeFilterCount = (filterMrpType ? 1 : 0) + (filterMinDemand ? 1 : 0) + (filterCritical ? 1 : 0) + (missingConfig ? 1 : 0);

    const renderEditForm = () => (
        <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Material Info Card */}
            <Box sx={{
                p: 2, bgcolor: '#F8F9FB', borderRadius: 3,
                border: '1px solid #EFEFEF',
                display: 'flex', alignItems: 'center', gap: 1.5
            }}>
                <Box sx={{ p: 1, bgcolor: '#F0F4FF', borderRadius: 2, display: 'flex' }}>
                    <Image src="/images/material.png" alt="PSC" width={40} height={40} style={{ objectFit: 'contain' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#1A1D1F', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedMaterial?.maktx}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 600 }}>
                        {selectedMaterial?.matnr}
                    </Typography>
                </Box>
            </Box>

            {/* Section: Stock Configuration */}
            <Box>
                <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 700, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <Image src="/images/spa-logo1.png" alt="PSC" width={20} height={20} style={{ objectFit: 'contain' }} />
                    STOCK CONFIGURATION
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Reorder Point"
                        fullWidth size="small"
                        type="number"
                        value={editValues.minbe}
                        onChange={(e) => setEditValues({ ...editValues, minbe: e.target.value })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        helperText="Stock level ที่ trigger การสั่งซื้อ"
                        inputProps={{ step: 1 }}

                    />
                    <TextField
                        label="Maximum Stock"
                        fullWidth size="small"
                        type="number"
                        value={editValues.mabst}
                        onChange={(e) => setEditValues({ ...editValues, mabst: e.target.value })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        helperText="ปริมาณ stock สูงสุดที่เก็บได้"
                        inputProps={{ step: 1 }}

                    />
                </Stack>
            </Box>

            {/* Section: PSC Material Mapping */}
            <Box>
                <Typography variant="caption" sx={{ color: '#1c12d3', fontWeight: 700, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, pt: 1, borderTop: '1px dashed #EFEFEF' }}>
                    <Image src="/images/psc-logo.png" alt="PSC" width={20} height={20} style={{ objectFit: 'contain' }} />
                    PSC MATERIAL
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="PSC Material"
                        fullWidth size="small"
                        value={editValues.pscMaterial}
                        onChange={(e) => setEditValues({ ...editValues, pscMaterial: e.target.value })}
                        placeholder="เช่น PSC-001"

                    />
                    <TextField
                        label="PSC Material Description"
                        fullWidth size="small"
                        value={editValues.pscMaterialDesc}
                        onChange={(e) => setEditValues({ ...editValues, pscMaterialDesc: e.target.value })}
                        placeholder="เช่น กระป๋อง2ชิ้น"

                    />
                </Stack>
            </Box>
        </Stack>
    );

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{
                        fontWeight: 800,
                        color: '#1A1D1F',
                        mb: 1,
                        fontSize: { xs: '1.5rem', md: '2.125rem' }
                    }}>
                        Material Master
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6F767E', fontWeight: 500 }}>
                        {isMobile ? 'Config stocks info.' : 'Configure Reorder Points and Maximum Stock levels for materials.'}
                    </Typography>
                </Box>

                <Button
                    onClick={() => setShowFilters(!showFilters)}
                    fullWidth={isMobile}
                    startIcon={<Filter size="20" variant={showFilters ? 'Bold' : 'Linear'} color={showFilters ? '#FFF' : '#2D60FF'} />}
                    sx={{
                        bgcolor: showFilters ? '#2D60FF' : '#FFF',
                        color: showFilters ? '#FFF' : '#2D60FF',
                        border: '1px solid',
                        borderColor: showFilters ? '#2D60FF' : '#EFEFEF',
                        borderRadius: '12px',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 2,
                        minHeight: 44,
                        '&:hover': {
                            bgcolor: showFilters ? '#2D60FF' : '#F8F9FA',
                            borderColor: showFilters ? '#2D60FF' : '#EFEFEF',
                        }
                    }}
                >
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
            </Box>

            {/* Filters Section */}
            <Fade in={showFilters}>
                <Paper sx={{
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: '#FFF',
                    border: '1px solid #F4F4F4',
                    mb: 3,
                    display: showFilters ? 'block' : 'none'
                }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={filterCritical}
                                    onChange={(e) => setFilterCritical(e.target.checked)}
                                    sx={{
                                        color: '#EFEFEF',
                                        '&.Mui-checked': { color: '#FF4D4D' },
                                        p: 0.5,
                                        mr: 0.5
                                    }}
                                />
                            }
                            label={<Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: filterCritical ? '#FF4D4D' : '#6F767E' }}>Stock {'<'} Reorder</Typography>}
                            sx={{
                                m: 0,
                                px: 1.5,
                                height: 40,
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: filterCritical ? 'rgba(255, 77, 77, 0.3)' : '#EFEFEF',
                                bgcolor: filterCritical ? '#FFF0F0' : '#FFF',
                                width: { xs: '100%', sm: 'auto' },
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: filterCritical ? '#FF4D4D' : '#2D60FF'
                                }
                            }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={missingConfig}
                                    onChange={(e) => setMissingConfig(e.target.checked)}
                                    sx={{
                                        color: '#EFEFEF',
                                        '&.Mui-checked': { color: '#FF4D4D' },
                                        p: 0.5,
                                        mr: 0.5
                                    }}
                                />
                            }
                            label={
                                <Tooltip title="แสดงรายการที่ยังไม่ได้ตั้งค่า Reorder Point หรือ Max Stock (ค่าเป็น 0 หรือว่าง)" arrow placement="top">
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: missingConfig ? '#FF4D4D' : '#6F767E' }}>
                                        Missing Config
                                    </Typography>
                                </Tooltip>
                            }
                            sx={{
                                m: 0,
                                px: 1.5,
                                height: 40,
                                borderRadius: '10px',
                                border: '1px solid',
                                borderColor: missingConfig ? 'rgba(255, 77, 77, 0.3)' : '#EFEFEF',
                                bgcolor: missingConfig ? '#FFF0F0' : '#FFF',
                                width: { xs: '100%', sm: 'auto' },
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: missingConfig ? '#FF4D4D' : '#2D60FF'
                                }
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                            <Select
                                displayEmpty
                                value={filterMrpType}
                                onChange={(e: SelectChangeEvent<string>) => setFilterMrpType(e.target.value)}
                                sx={selectSx}
                                renderValue={(val: string) => val ? `MRP: ${val}` : 'MRP Type'}
                                MenuProps={{ disableScrollLock: true }}
                            >
                                <MenuItem value=""><em>All MRP Types</em></MenuItem>
                                {mrpTypeOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                            <Select
                                displayEmpty
                                value={filterMinDemand}
                                onChange={(e: SelectChangeEvent<string>) => setFilterMinDemand(e.target.value)}
                                sx={selectSx}
                                renderValue={(val: string) => val ? `Demand > ${val}` : 'Min Demand'}
                                MenuProps={{ disableScrollLock: true }}
                            >
                                <MenuItem value=""><em>All Demand</em></MenuItem>
                                <MenuItem value="100">{'>'} 100</MenuItem>
                                <MenuItem value="200">{'>'} 200</MenuItem>
                                <MenuItem value="500">{'>'} 500</MenuItem>
                                <MenuItem value="1000">{'>'} 1,000</MenuItem>
                            </Select>
                        </FormControl>

                        {activeFilterCount > 0 && (
                            <Button
                                fullWidth={isMobile}
                                size="small"
                                onClick={() => {
                                    setFilterMrpType('');
                                    setFilterMinDemand('');
                                    setFilterCritical(false);
                                    setMissingConfig(false);
                                }}
                                startIcon={<CloseCircle size="16" variant="Bold" color="#FF4D4D" />}
                                sx={{ color: '#FF4D4D', fontWeight: 600, textTransform: 'none' }}
                            >
                                Clear All
                            </Button>
                        )}
                    </Stack>
                </Paper>
            </Fade>

            {/* Main Content Area */}
            <Paper elevation={0} sx={{
                borderRadius: 4,
                border: '1px solid #F4F4F4',
                overflow: 'hidden',
                bgcolor: isMobile ? 'transparent' : '#FFF',
                borderWidth: isMobile ? 0 : 1
            }}>
                {/* Search Header */}
                <Box sx={{
                    p: { xs: 0, md: 2.5 },
                    mb: { xs: 2.5, md: 0 },
                    borderBottom: { xs: 'none', md: '1px solid #F4F4F4' },
                    display: 'flex', gap: 2, alignItems: 'center'
                }}>
                    <Paper sx={{
                        p: '8px 16px', display: 'flex', alignItems: 'center',
                        flex: 1, maxWidth: { xs: '100%', md: 400 }, bgcolor: '#FFF',
                        border: '1px solid #EFEFEF', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', borderRadius: 3
                    }}>
                        <SearchNormal1 size="20" color="#2D60FF" variant="Linear" />
                        <InputBase
                            sx={{ ml: 1.5, flex: 1, fontSize: '0.875rem', fontWeight: 500 }}
                            placeholder="Search Mat No. or Description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <IconButton size="small" onClick={() => setSearch('')}>
                                <CloseCircle size="18" variant="Bold" color="#9A9FA5" />
                            </IconButton>
                        )}
                    </Paper>
                </Box>

                {loading ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <CircularProgress size={30} sx={{ color: '#2D60FF' }} />
                    </Box>
                ) : data.length === 0 ? (
                    <Box sx={{ py: 10, textAlign: 'center', bgcolor: '#FFF', borderRadius: 4 }}>
                        <Typography variant="body2" color="textSecondary">No materials found.</Typography>
                    </Box>
                ) : isMobile ? (
                    /* Mobile Card View */
                    <Box key={refreshKey} sx={{ pb: 2, animation: 'fadeInTable 0.5s ease-out' }}>
                        {data.map(m => (
                            <MaterialMobileCard
                                key={m.id}
                                m={m}
                                onEdit={handleStartEdit}
                                isDataIncomplete={isDataIncomplete}
                            />
                        ))}
                    </Box>
                ) : (
                    /* Desktop Table View */
                    <TableContainer>
                        <Table sx={{ minWidth: 950 }}>
                            <TableHead sx={{ bgcolor: '#FCFCFC' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: '#6F767E' }}>S.P.A. MATERIAL</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#1c12d3' }}>PSC MATERIAL</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#6F767E' }}>STOCK</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#F59E0B' }}>REORDER POINT</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#2D60FF' }}>MAX STOCK</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#EF4444' }}>DEMAND</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, color: '#6F767E' }}>EDIT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody key={refreshKey} sx={{ animation: 'fadeInTable 0.5s ease-out' }}>
                                {data.map((m) => (
                                    <TableRow
                                        key={m.id}
                                        hover
                                        sx={{
                                            '&:hover': { bgcolor: '#F9F9FB' },
                                            bgcolor: isDataIncomplete(m) ? 'rgba(255, 77, 77, 0.02)' : 'inherit'
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ p: 1, bgcolor: '#F5F3FF', borderRadius: 2, color: '#2D60FF' }}>
                                                    <BoxIcon size="20" variant="Bulk" color="#2D60FF" />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1A1D1F' }}>
                                                        {m.maktx}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#6F767E', fontWeight: 500 }}>
                                                        {m.matnr}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell>
                                            {m.pscMaterial ? (
                                                <Box>
                                                    {m.pscMaterialDesc && (
                                                        <Typography variant="subtitle2" sx={{ color: '#1c12d3', fontWeight: 700 }}>
                                                            {m.pscMaterialDesc}
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" sx={{ fontWeight: 500, color: '#6F767E' }}>
                                                        {m.pscMaterial}
                                                    </Typography>

                                                </Box>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: '#C4C4C4', fontStyle: 'italic' }}>—</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Typography sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                                {m.lbkum?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right" sx={{ width: 140 }}>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: (m.minbe || 0) === 0 ? '#FF4D4D' : '#F59E0B'
                                            }}>
                                                {m.minbe?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                                {(!m.minbe || m.minbe === 0) && (
                                                    <Danger size="14" variant="Bold" style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right" sx={{ width: 140 }}>
                                            <Typography sx={{
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: (m.mabst || 0) === 0 ? '#FF4D4D' : '#2D60FF'
                                            }}>
                                                {m.mabst?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                                                {(!m.mabst || m.mabst === 0) && (
                                                    <Danger size="14" variant="Bold" style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                                                )}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right" sx={{ width: 120 }}>
                                            {(m.demand || 0) > 0 ? (
                                                <Box sx={{
                                                    display: 'inline-flex',
                                                    bgcolor: '#E53535',
                                                    color: '#FFFFFF',
                                                    px: 1.5, py: 0.3,
                                                    borderRadius: 1,
                                                    fontWeight: 800,
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.85rem',
                                                    minWidth: 60,
                                                    justifyContent: 'center',
                                                }}>
                                                    {m.demand?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontWeight: 700, color: '#6F767E', fontFamily: 'monospace' }}>0</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleStartEdit(m)}
                                                sx={{
                                                    bgcolor: '#FFF',
                                                    '&:hover': { bgcolor: '#FFF' }
                                                }}
                                            >
                                                <Edit2 size="18" color="#2D60FF" variant="Bold" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={isMobile ? [25, 50] : [50, 100, 200]}
                    sx={{
                        bgcolor: isMobile ? 'transparent' : '#FFF',
                        mt: isMobile ? 2 : 0
                    }}
                />
            </Paper>

            {/* Edit Integration - Bottom Sheet for Mobile, Dialog for Desktop */}
            {isMobile ? (
                <SwipeableDrawer
                    anchor="bottom"
                    open={editOpen}
                    onClose={() => !saving && setEditOpen(false)}
                    onOpen={() => { }}
                    swipeAreaWidth={0}
                    disableBackdropTransition={true}
                    disableDiscovery={true}
                    sx={{
                        '& .MuiDrawer-paper': {
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            p: 3,
                            pb: 5,
                            maxHeight: '85vh'
                        }
                    }}
                >
                    <Box sx={{ width: 40, height: 4, bgcolor: '#EFEFEF', borderRadius: 2, mx: 'auto', mb: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Edit Configuration</Typography>
                    {renderEditForm()}
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setEditOpen(false)}
                            disabled={saving}
                            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, borderColor: '#EFEFEF', color: '#6F767E' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSave}
                            disabled={saving}
                            sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, bgcolor: '#2D60FF' }}
                        >
                            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                        </Button>
                    </Box>
                </SwipeableDrawer>
            ) : (
                <Dialog
                    open={editOpen}
                    onClose={() => !saving && setEditOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    disableScrollLock
                    PaperProps={{
                        sx: { borderRadius: 4, p: 1 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, color: '#1A1D1F', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ p: 1, bgcolor: '#F0F4FF', borderRadius: 2, color: '#2D60FF', display: 'flex' }}>
                            <Setting2 size="24" variant="Bold" color="#2D60FF" />
                        </Box>
                        Edit Material Master
                    </DialogTitle>
                    <DialogContent>
                        {renderEditForm()}
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button
                            onClick={() => setEditOpen(false)}
                            disabled={saving}
                            sx={{ color: '#6F767E', fontWeight: 700, textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={saving}
                            sx={{
                                bgcolor: '#2D60FF',
                                borderRadius: 2.5,
                                fontWeight: 700,
                                textTransform: 'none',
                                px: 4,
                                '&:hover': { bgcolor: '#1A4DDF' }
                            }}
                        >
                            {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
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
        </Box>
    );
}

