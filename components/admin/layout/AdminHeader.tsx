'use client';

import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Badge, Avatar } from '@mui/material';
import { HambergerMenu, Notification, Setting2, SearchNormal1 } from 'iconsax-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.appBar,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        color: '#1A1D1F',
        boxShadow: 'none',
        borderBottom: '1px solid #EFEFEF',
        width: { xs: '100%', lg: isSidebarOpen ? `calc(100% - 260px)` : '100%' },
        ml: { xs: 0, lg: isSidebarOpen ? `260px` : 0 },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Toolbar sx={{
        justifyContent: 'space-between',
        minHeight: { xs: 64, sm: 80 },
        px: { xs: 2, sm: 4 }
      }}>
        {/* Left Section: Menu Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EFEFEF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderRadius: 2.5,
              width: 44,
              height: 44,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: '#F9FAFB',
                borderColor: '#2D60FF',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(45, 96, 255, 0.12)'
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            <Box sx={{
              display: 'flex',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isSidebarOpen ? 'rotate(180deg)' : 'none'
            }}>
              <HambergerMenu size="22" color="#2D60FF" variant="Bold" />
            </Box>
          </IconButton>

          <Typography variant="h6" sx={{
            fontWeight: 800,
            display: { xs: 'none', sm: 'block' },
            letterSpacing: '-0.5px'
          }}>
            S.P.A. Stock
          </Typography>
        </Box>

        {/* Center: Mobile Branding */}
        <Box sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
          gap: 1,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <Box
            component="img"
            src="/images/psc-logo.png"
            alt="Logo"
            sx={{ width: 32, height: 'auto' }}
          />

        </Box>

        {/* Right Section: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            ml: 1,
            pl: { sm: 1.5 },
            borderLeft: { sm: '1px solid #EFEFEF' }
          }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                Admin
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stock Management
              </Typography>
            </Box>
            <Avatar
              src="/images/psc-logo.png"
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                borderRadius: 2.5,
                bgcolor: '#2D60FF',
                boxShadow: '0 4px 10px rgba(45, 96, 255, 0.2)'
              }}
            >
              A
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AdminHeader;
