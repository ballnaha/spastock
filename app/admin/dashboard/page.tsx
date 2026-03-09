'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import {
    Typography, Paper, Box, Button, CircularProgress,
    Skeleton, Stack, IconButton, Fade, FormControl,
    Select, MenuItem, Chip, SelectChangeEvent, Tooltip, Checkbox, FormControlLabel,
    useMediaQuery, useTheme
} from '@mui/material';
import {
    Add, Trade, CardPos, Profile2User, Box as BoxIcon,
    Refresh, Filter, CloseCircle, InfoCircle
} from 'iconsax-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import DashboardStockTable from '@/components/admin/dashboard/DashboardStockTable';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
    loading: () => <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 4 }} />
});

interface DashboardData {
    summary: {
        totalMaterials: number;
        activeDemandCount: number;
        totalStockValue: number;
        totalSystemDemand: number;
        totalAdjustedDemand: number;
    };
    chartData: Array<{
        name: string;
        stock: number;
        demand: number;
        max: number;
        reorder: number;
    }>;
    facets: {
        mrpTypes: string[];
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(true);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Filter states - matching stock defaults
    const [filterMrpType, setFilterMrpType] = useState('VB');
    const [filterMinDemand, setFilterMinDemand] = useState('200');
    const [filterCritical, setFilterCritical] = useState(true);

    const [mrpTypeOptions, setMrpTypeOptions] = useState<string[]>([]);

    const activeFilterCount = [
        filterMrpType,
        filterMinDemand,
        filterCritical ? 'true' : ''
    ].filter(f => f && f !== '').length;

    const fetchStats = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...(filterMrpType && { mrpType: filterMrpType }),
                ...(filterMinDemand && { minDemand: filterMinDemand }),
                ...(filterCritical && { critical: 'true' }),
            });
            const res = await fetch(`/api/dashboard/stats?${params}`);
            const json = await res.json();
            setData(json);
            if (json.facets?.mrpTypes) setMrpTypeOptions(json.facets.mrpTypes);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchStats();
    }, [filterMrpType, filterMinDemand, filterCritical]);

    // Fix: Force ApexCharts to recalculate width after page navigation
    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const stats = [
        {
            title: 'Total Materials',
            value: data?.summary.totalMaterials.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0',
            icon: <Image src="/images/material.png" alt="material" width={32} height={32} style={{ objectFit: 'contain' }} />,
            color: '#FFF'
        },
        {
            title: 'Total Stock',
            value: data?.summary.totalStockValue.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0',
            icon: <Image src="/images/stock.png" alt="stock" width={32} height={32} style={{ objectFit: 'contain' }} />,
            color: '#FFF'
        },
        {
            title: 'Total Demand',
            value: data?.summary.totalSystemDemand.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0',
            icon: <Image src="/images/demand.png" alt="demand" width={32} height={32} style={{ objectFit: 'contain' }} />,
            color: '#FFF',
        },
    ];

    const displayData = React.useMemo(() => data?.chartData.slice(0, 20) || [], [data]);

    // Chart Configuration
    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'line', // Base type for mixed charts
            stacked: true,
            toolbar: { show: false },
            fontFamily: '"Sarabun", sans-serif',
            animations: {
                enabled: true,
                speed: 1500,
                animateGradually: {
                    enabled: true,
                    delay: 300
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 500
                }
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: isMobile ? '28px' : '50px',
                borderRadius: 0,
                dataLabels: {
                    total: {
                        enabled: !isMobile,
                        formatter: (val: any) => val ? Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0',
                        style: {
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#1A1D1F',
                            fontFamily: '"Sarabun", sans-serif',
                        },
                        offsetY: -5
                    }
                }
            },
        },
        dataLabels: {
            enabled: !isMobile,
            enabledOnSeries: [0, 1],
            formatter: (val: any) => val ? Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0',
            style: {
                colors: ['#FFFFFF'],
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: '"Sarabun", sans-serif',
            },
            dropShadow: { enabled: false }
        },
        markers: {
            size: 0,
        },
        stroke: {
            show: true,
            width: [1, 1, isMobile ? 2 : 3],
            colors: ['#fff', '#fff', '#F4C430'],
            curve: 'smooth',
            dashArray: [0, 0, 6]
        },
        xaxis: {
            categories: displayData.map(d => d.name),
            tickAmount: displayData.length,
            labels: {
                style: {
                    colors: '#6F767E',
                    fontSize: isMobile ? '8px' : '10px',
                    fontWeight: 500,
                    fontFamily: '"Sarabun", sans-serif'
                },
                rotate: isMobile ? -45 : 0,
                rotateAlways: isMobile,
                hideOverlappingLabels: false,
                trim: isMobile,
                maxHeight: isMobile ? 80 : 120,
                formatter: function (val: string) {
                    if (!val) return '';
                    if (isMobile) {
                        // Truncate long names on mobile
                        return val.length > 12 ? val.substring(0, 12) + '…' : val;
                    }
                    if (val.length > 20) {
                        const mid = Math.floor(val.length / 2);
                        const spaceIndex = val.indexOf(' ', mid - 5);
                        if (spaceIndex !== -1 && spaceIndex < mid + 10) {
                            return [val.substring(0, spaceIndex), val.substring(spaceIndex + 1)];
                        }
                        return [val.substring(0, 18), val.substring(18)];
                    }
                    return val;
                }
            },
            axisBorder: { show: true, color: '#EFEFEF' },
            axisTicks: { show: false }
        },
        yaxis: {
            title: {
                text: isMobile ? '' : 'Units',
                style: { color: '#9A9FA5', fontWeight: 500, fontFamily: '"Sarabun", sans-serif' }
            },
            labels: {
                style: {
                    colors: '#9A9FA5',
                    fontWeight: 500,
                    fontSize: isMobile ? '9px' : '12px',
                    fontFamily: '"Sarabun", sans-serif'
                },
                formatter: (val) => {
                    if (isMobile && val >= 1000) {
                        return (val / 1000).toFixed(0) + 'K';
                    }
                    return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
                }
            }
        },
        grid: {
            borderColor: '#F0F0F0',
            strokeDashArray: 0,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
            padding: { top: 0, right: isMobile ? 5 : 0, bottom: 0, left: isMobile ? 0 : 10 }
        },
        fill: {
            opacity: [0.85, 0.85, 1],
            type: 'solid',
        },
        colors: ['#2D60FF', '#fd3030', '#F4C430'],
        tooltip: {
            theme: 'light',
            style: { fontFamily: '"Sarabun", sans-serif' },
            x: {
                formatter: (val) => String(val)
            },
            y: {
                formatter: (val) => val.toLocaleString('en-US', { maximumFractionDigits: 0 })
            },
            marker: { show: true },
            intersect: false,
            shared: true,
            cssClass: 'apexcharts-tooltip-modern'
        },
        legend: {
            position: 'top',
            horizontalAlign: isMobile ? 'center' : 'right',
            offsetY: 0,
            fontSize: isMobile ? '10px' : '12px',
            fontFamily: '"Sarabun", sans-serif',
            fontWeight: 600,
            labels: { colors: '#1A1D1F' },
            markers: {
                shape: 'square',
                size: isMobile ? 6 : 8,
                strokeWidth: 0,
            },
            itemMargin: { horizontal: isMobile ? 6 : 10, vertical: 0 }
        },
    };

    const chartSeries = [
        {
            name: 'Stock',
            type: 'column',
            data: displayData.map(d => d.stock)
        },
        {
            name: 'Demand',
            type: 'column',
            data: displayData.map(d => d.demand)
        },
        {
            name: 'Reorder Point',
            type: 'line',
            data: displayData.map(d => d.reorder)
        }
    ];

    const selectSx = {
        bgcolor: '#FFF',
        borderRadius: '10px',
        '.MuiOutlinedInput-notchedOutline': { borderColor: '#EFEFEF' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2D60FF' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2D60FF' },
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: '#1A1D1F'
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 4,
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{
                        fontWeight: 800,
                        color: '#1A1D1F',
                        mb: 0.5,
                        fontSize: { xs: '1.75rem', sm: '2.125rem' }
                    }}>
                        Dashboard Overview
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6F767E', fontWeight: 500 }}>
                        System performance and stock analysis filters.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        startIcon={<Filter size="20" variant={showFilters ? 'Bold' : 'Linear'} color={showFilters ? '#FFF' : '#6F767E'} />}
                        sx={{
                            bgcolor: showFilters ? '#2D60FF' : '#FFF',
                            color: showFilters ? '#FFF' : '#6F767E',
                            border: '1px solid',
                            borderColor: showFilters ? '#2D60FF' : '#EFEFEF',
                            borderRadius: '12px',
                            fontWeight: 600,
                            textTransform: 'none',
                            px: 2,
                            '&:hover': {
                                bgcolor: showFilters ? '#1A4DDF' : '#F8F9FA',
                                borderColor: showFilters ? '#1A4DDF' : '#EFEFEF',
                            }
                        }}
                    >
                        Filters
                    </Button>
                    <IconButton
                        onClick={fetchStats}
                        disabled={loading}
                        sx={{ bgcolor: '#FFF', border: '1px solid #EFEFEF', borderRadius: '12px', width: 40, height: 40 }}
                    >
                        <Refresh size="20" variant="Linear" color="#6F767E" />
                    </IconButton>

                </Stack>
            </Box>

            {/* Filter Section */}
            <Fade in={showFilters}>
                <Box sx={{
                    mb: 4,
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: '#FFF',
                    border: '1px solid #F4F4F4',
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

                        <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
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

                        <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
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

                        {activeFilterCount > 1 && (
                            <Button
                                size="small"
                                onClick={() => { setFilterMrpType(''); setFilterMinDemand(''); setFilterCritical(false); }}
                                startIcon={<CloseCircle size="16" variant="Bold" color="#FF4D4D" />}
                                sx={{ color: '#FF4D4D', fontWeight: 600, textTransform: 'none' }}
                            >
                                Clear All
                            </Button>
                        )}
                    </Stack>

                    {activeFilterCount > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                            {filterCritical && (
                                <Chip
                                    label="Stock < Reorder"
                                    size="small"
                                    onDelete={() => setFilterCritical(false)}
                                    sx={{ bgcolor: '#FFF0F0', color: '#FF4D4D', fontWeight: 600 }}
                                />
                            )}
                            {filterMrpType && (
                                <Chip
                                    label={`MRP: ${filterMrpType}`}
                                    size="small"
                                    onDelete={() => setFilterMrpType('')}
                                    sx={{ bgcolor: '#E8EFFF', color: '#2D60FF', fontWeight: 600 }}
                                />
                            )}
                            {filterMinDemand && (
                                <Chip
                                    label={`Demand > ${filterMinDemand}`}
                                    size="small"
                                    onDelete={() => setFilterMinDemand('')}
                                    sx={{ bgcolor: '#E8EFFF', color: '#2D60FF', fontWeight: 600 }}
                                />
                            )}
                        </Stack>
                    )}
                </Box>
            </Fade >

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3,
                mb: 4
            }}>
                {stats.map((stat, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #F4F4F4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <Box sx={{
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.icon}
                        </Box>
                        <Box>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                                <Typography variant="body2" sx={{ color: '#6F767E', fontWeight: 500 }}>
                                    {stat.title}
                                </Typography>
                                {(stat as any).tooltip && (
                                    <Tooltip title={(stat as any).tooltip} arrow placement="top">
                                        <InfoCircle size="14" variant="Bold" color="#9A9FA5" style={{ cursor: 'help' }} />
                                    </Tooltip>
                                )}
                            </Stack>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1D1F' }}>
                                {loading ? <Skeleton width={60} /> : stat.value}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            <Box sx={{ mb: 4 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 1.5, sm: 3 },
                        borderRadius: 4,
                        border: '1px solid #F4F4F4',
                        minHeight: { xs: 350, sm: 450 },
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                            <CircularProgress sx={{ color: '#2D60FF' }} />
                        </Box>
                    ) : (
                        <Box sx={{
                            width: '100%',
                            overflowX: { xs: 'auto', sm: 'visible' },
                            WebkitOverflowScrolling: 'touch',
                            '&::-webkit-scrollbar': { height: 4 },
                            '&::-webkit-scrollbar-thumb': { bgcolor: '#E0E0E0', borderRadius: 2 },
                        }}>
                            <Box sx={{
                                minWidth: { xs: `${Math.max(displayData.length * 60, 400)}px`, sm: 'unset' },
                                width: '100%',
                                height: { xs: 350, sm: 500 },
                            }}>
                                <Chart
                                    options={chartOptions}
                                    series={chartSeries}
                                    type="bar"
                                    height="100%"
                                    width="100%"
                                />
                            </Box>
                        </Box>
                    )}
                </Paper>
            </Box>

            <DashboardStockTable
                filterMrpType={filterMrpType}
                filterMinDemand={filterMinDemand}
                filterCritical={filterCritical}
            />
        </Box >
    );
}
