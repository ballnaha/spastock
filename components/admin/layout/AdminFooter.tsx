'use client';

import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';

const AdminFooter: React.FC = () => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Box
            component="footer"
            sx={{
                py: 2.5,
                px: { xs: 2.5, sm: 4 },
                mt: 'auto',
                backgroundColor: 'transparent',
                borderTop: '1px solid #F8FAFC',
            }}
        >
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2
            }}>
                <Typography variant="body2" sx={{
                    color: '#94A3B8',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    letterSpacing: '0.01em'
                }}>
                    © {mounted ? new Date().getFullYear() : '2026'} S.P.A. Stock. All rights reserved.
                </Typography>

                <Box sx={{ display: 'flex', gap: 3 }}>
                    {['Privacy', 'Terms', 'Help'].map((item) => (
                        <Link
                            key={item}
                            href="#"
                            underline="none"
                            sx={{
                                color: '#94A3B8',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                transition: 'color 0.2s ease',
                                '&:hover': { color: '#64748B' }
                            }}
                        >
                            {item}
                        </Link>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminFooter;
