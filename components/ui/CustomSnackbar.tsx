'use client';

import React, { useEffect, useState } from 'react';
import { Snackbar, IconButton, Box, Typography, LinearProgress, Stack, Slide, SlideProps } from '@mui/material';
import { TickCircle, CloseCircle, InfoCircle, Warning2, Add } from 'iconsax-react';

interface CustomSnackbarProps {
    open: boolean;
    message: string;
    severity?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    autoHideDuration?: number;
}

function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="down" />;
}

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
    open,
    message,
    severity = 'success',
    onClose,
    autoHideDuration = 4000
}) => {
    const [progress, setProgress] = useState(0);

    // Reset and start progress bar when snackbar opens
    useEffect(() => {
        if (open) {
            setProgress(0);
            const interval = 20; // ms
            const step = 100 / (autoHideDuration / interval);

            const timer = setInterval(() => {
                setProgress((oldProgress) => {
                    if (oldProgress >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return Math.min(oldProgress + step, 100);
                });
            }, interval);

            return () => clearInterval(timer);
        }
    }, [open, autoHideDuration]);

    const getColors = () => {
        switch (severity) {
            case 'success':
                return {
                    main: '#10B981',
                    light: '#D1FAE5',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                };
            case 'error':
                return {
                    main: '#EF4444',
                    light: '#FEE2E2',
                    bg: 'rgba(239, 68, 68, 0.08)',
                    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                };
            case 'warning':
                return {
                    main: '#F59E0B',
                    light: '#FEF3C7',
                    bg: 'rgba(245, 158, 11, 0.08)',
                    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                };
            case 'info':
                return {
                    main: '#3B82F6',
                    light: '#DBEAFE',
                    bg: 'rgba(59, 130, 246, 0.08)',
                    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                };
            default:
                return {
                    main: '#10B981',
                    light: '#D1FAE5',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                };
        }
    };

    const colors = getColors();

    const getIcon = () => {
        const iconSize = "20";
        switch (severity) {
            case 'success': return <TickCircle size={iconSize} variant="Bold" color="#FFFFFF" />;
            case 'error': return <CloseCircle size={iconSize} variant="Bold" color="#FFFFFF" />;
            case 'warning': return <Warning2 size={iconSize} variant="Bold" color="#FFFFFF" />;
            case 'info': return <InfoCircle size={iconSize} variant="Bold" color="#FFFFFF" />;
            default: return <TickCircle size={iconSize} variant="Bold" color="#FFFFFF" />;
        }
    };

    const getTitle = () => {
        switch (severity) {
            case 'success': return 'ทำรายการสำเร็จ';
            case 'error': return 'เกิดข้อผิดพลาด';
            case 'warning': return 'คำเตือน';
            case 'info': return 'ข้อมูล';
            default: return 'การแจ้งเตือน';
        }
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={autoHideDuration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            TransitionComponent={SlideTransition}
            sx={{
                mt: { xs: 1, sm: 2 },
                '& .MuiSnackbar-content': {
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    p: 0,
                    minWidth: { xs: '100%', sm: 340 },
                    display: 'flex',
                    justifyContent: 'center'
                }
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    bgcolor: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(16px)',
                    minWidth: { xs: 'calc(100vw - 48px)', sm: 320 },
                    maxWidth: 420,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.05), 0 15px 30px -10px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 25px 40px -10px rgba(0, 0, 0, 0.15)',
                    }
                }}
            >
                <Box sx={{ p: 1.75, display: 'flex', alignItems: 'center' }}>
                    {/* Floating Icon with Shadow Container */}
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: colors.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 1.75,
                        boxShadow: `0 4px 10px ${colors.main}35`,
                    }}>
                        {getIcon()}
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Typography sx={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: '#1A1D1F',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2,
                            mb: 0.1
                        }}>
                            {getTitle()}
                        </Typography>
                        <Typography sx={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#6F767E',
                            lineHeight: 1.4,
                        }}>
                            {message}
                        </Typography>
                    </Box>

                    {/* Refined Close Button */}
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{
                            p: 0.6,
                            bgcolor: 'rgba(0,0,0,0.03)',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.06)',
                                transform: 'rotate(90deg)'
                            },
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            alignSelf: 'center'
                        }}
                    >
                        <Add
                            size="16"
                            variant="Linear"
                            color="#9A9FA5"
                            style={{ transform: 'rotate(45deg)' }}
                        />
                    </IconButton>
                </Box>

                {/* Modern Thin Progress Bar at the absolute bottom */}
                <Box sx={{ height: 3, width: '100%', mt: 'auto' }}>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 3,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            '& .MuiLinearProgress-bar': {
                                background: colors.gradient,
                                borderRadius: '0 4px 4px 0'
                            }
                        }}
                    />
                </Box>
            </Box>
        </Snackbar>
    );
};

export default CustomSnackbar;

