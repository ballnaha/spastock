'use client';

import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';

// Create a custom theme for the admin panel
const theme = createTheme({
    palette: {
        primary: {
            main: '#2D60FF',
        },
        background: {
            default: '#FCFCFC',
        },
    },
    typography: {
        fontFamily: 'var(--font-sarabun), "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
    },
});

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    // Close sidebar when pathname changes
    React.useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    React.useEffect(() => {
        setMounted(true);
        const DESKTOP_BREAKPOINT = 1200;

        // Set initial state to closed by default
        setSidebarOpen(false);

        // Listen for resize to close sidebar on mobile if needed
        const handleResize = () => {
            if (window.innerWidth < DESKTOP_BREAKPOINT) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    if (!mounted) {
        return null; // Suppress rendering on server completely for UI components avoiding mismatch
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                suppressHydrationWarning
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    bgcolor: '#FCFCFC',
                }}
            >
                <AdminHeader onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
                <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        ml: { xs: 0, lg: sidebarOpen ? '260px' : 0 },
                        width: {
                            xs: '100%',
                            lg: sidebarOpen ? 'calc(100% - 260px)' : '100%'
                        },
                        pt: { xs: '64px', sm: '80px' },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box sx={{ px: { xs: 1.5, sm: 3, md: 4 }, py: { xs: 2, sm: 3, md: 4 }, flexGrow: 1 }}>
                        {children}
                    </Box>
                    <Box sx={{ px: { xs: 1.5, sm: 3, md: 4 }, py: { xs: 0, sm: 3, md: 4 }, pt: 0 }}>
                        <AdminFooter />
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default AdminLayout;
