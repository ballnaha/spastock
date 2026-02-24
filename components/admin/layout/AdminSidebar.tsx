'use client';

import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Typography,
    Box,
    useTheme,
    useMediaQuery,
    SwipeableDrawer,
} from '@mui/material';
import {
    Category,
    Box as BoxIcon,
    CloseCircle,
    ArchiveBook
} from 'iconsax-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const drawerWidth = 260;

interface AdminSidebarProps {
    open: boolean;
    onClose: () => void;
}

const menuItems = [
    { text: 'Dashboard', icon: <Category size="22" variant="Bold" color="#2D60FF" />, path: '/admin/dashboard' },
];

const settingItems = [
    { text: 'Material Master', icon: <ArchiveBook size="22" variant="Bold" color="#2D60FF" />, path: '/admin/materials' },
    { text: 'Inventory', icon: <BoxIcon size="22" variant="Bold" color="#2D60FF" />, path: '/admin/inventory' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose }) => {
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => {
        if (path === '/admin/dashboard') {
            return pathname === path;
        }
        return pathname === path || pathname.startsWith(path + '/');
    };

    const handleMenuClick = () => {
        if (isMobile) {
            onClose();
        }
    };

    const renderMenuItems = (items: typeof menuItems) =>
        items.map((item) => {
            const active = isActive(item.path);
            return (
                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                        component={Link}
                        href={item.path}
                        onClick={handleMenuClick}
                        sx={{
                            borderRadius: 2.5,
                            color: active ? '#FFFFFF' : '#6F767E',
                            bgcolor: active ? '#2D60FF' : 'transparent',
                            background: active ? 'linear-gradient(90deg, #2D60FF 0%, #4B7BFF 100%)' : 'transparent',
                            boxShadow: active ? '0px 10px 25px rgba(45, 96, 255, 0.25)' : 'none',
                            py: 1.5,
                            px: 2.5,
                            position: 'relative',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            pointerEvents: 'auto',
                            zIndex: 1,
                            '&:hover': {
                                bgcolor: active ? '#2D60FF' : 'rgba(244, 244, 244, 1)',
                                transform: active ? 'none' : 'translateX(4px)',
                            }
                        }}
                    >
                        <ListItemIcon sx={{
                            minWidth: 40,
                            color: active ? '#FFFFFF' : '#2D60FF',
                        }}>
                            {React.cloneElement(item.icon as React.ReactElement<any>, {
                                variant: active ? 'Bold' : 'Linear',
                                size: 24,
                                color: active ? '#FFFFFF' : '#2D60FF'
                            })}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontSize: '0.95rem',
                                fontWeight: active ? 700 : 600,
                                letterSpacing: '-0.3px'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            );
        });

    const drawerContent = React.useMemo(() => (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
            {/* Logo Section */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid #F4F4F4',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40, height: 40,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(45, 96, 255, 0.2)'
                    }}>
                        <Image
                            src="/images/spa-logo1.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1A1D1F', letterSpacing: '-0.5px' }}>
                        S.P.A. Stock
                    </Typography>
                </Box>
                {(mounted && isMobile) && (
                    <IconButton onClick={onClose} sx={{ bgcolor: '#F5F5F7', borderRadius: 2 }}>
                        <CloseCircle size="20" color="#6F767E" variant="Bulk" />
                    </IconButton>
                )}
            </Box>

            {/* Menu Items */}
            <Box sx={{ flexGrow: 1, py: 2, px: 2, overflowY: 'auto' }}>
                <Typography variant="caption" sx={{
                    color: '#9A9FA5', fontWeight: 800, px: 2, mb: 1, display: 'block',
                    textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.65rem'
                }}>
                    Main Navigation
                </Typography>
                <List sx={{ p: 0, mb: 3 }}>
                    {renderMenuItems(menuItems)}
                </List>

                <Typography variant="caption" sx={{
                    color: '#9A9FA5', fontWeight: 800, px: 2, mb: 1, display: 'block',
                    textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.65rem'
                }}>
                    System Control
                </Typography>
                <List sx={{ p: 0 }}>
                    {renderMenuItems(settingItems)}
                </List>
            </Box>


        </Box>
    ), [pathname, mounted, isMobile, onClose]);

    return (
        <>
            <SwipeableDrawer
                variant="temporary"
                open={isMobile && open}
                onClose={onClose}
                onOpen={() => { }}
                transitionDuration={{ enter: 250, exit: 180 }}
                disableBackdropTransition={true}
                disableDiscovery={false}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    zIndex: (theme) => theme.zIndex.appBar + 100,
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        border: 'none',
                        boxShadow: '10px 0 40px rgba(0,0,0,0.12)',
                    },
                    '& .MuiBackdrop-root': {
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    }
                }}
            >
                {drawerContent}
            </SwipeableDrawer>

            <Drawer
                variant="persistent"
                open={!isMobile && open}
                sx={{
                    display: { xs: 'none', lg: 'block' },
                    zIndex: (theme) => theme.zIndex.appBar - 1,
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        border: 'none',
                        borderRight: '1px solid #F4F4F4',
                        height: '100vh',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default AdminSidebar;
