'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'What', href: '/what' },
  { label: 'How', href: '/how' },
  { label: 'Projects', href: '/projects' },
]

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 'lg',
            width: '100%',
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            minHeight: { xs: 64, sm: 64 },
          }}
        >
          {/* Logo */}
          <Box
            component={Link}
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              textDecoration: 'none',
              mr: 4,
            }}
          >
            <Image
              src="/Norwich_hackspace_roundel-135x135.png"
              alt="Norwich Hackspace"
              width={32}
              height={32}
              style={{ borderRadius: 6 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                BikeShed
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.65rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Norwich Hackspace
              </Typography>
            </Box>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: isActive(link.href) ? 'text.primary' : 'text.secondary',
                  fontWeight: isActive(link.href) ? 600 : 400,
                  fontSize: '0.875rem',
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  backgroundColor: isActive(link.href)
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(link.href)
                      ? alpha(theme.palette.secondary.main, 0.14)
                      : alpha(theme.palette.primary.main, 0.06),
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Desktop auth buttons */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5 }}>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="small"
              sx={{
                borderColor: alpha(isDark ? '#fff' : '#000', 0.2),
                color: 'text.primary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              Log in
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                },
              }}
            >
              Join
            </Button>
          </Box>

          {/* Mobile hamburger */}
          <Box sx={{ display: { md: 'none' }, ml: 'auto' }}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{ color: 'text.primary' }}
              aria-label="open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: theme.palette.background.default,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'text.primary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ px: 2 }}>
          {navLinks.map((link) => (
            <ListItem key={link.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={link.href}
                selected={isActive(link.href)}
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 1.5,
                  backgroundColor: isActive(link.href)
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : 'transparent',
                }}
              >
                <ListItemText
                  primary={link.label}
                  slotProps={{
                    primary: {
                      fontWeight: isActive(link.href) ? 600 : 400,
                      color: isActive(link.href) ? 'text.primary' : 'text.secondary',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ px: 3, mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            fullWidth
            onClick={handleDrawerToggle}
          >
            Log in
          </Button>
          <Button
            component={Link}
            href="/signup"
            variant="contained"
            fullWidth
            onClick={handleDrawerToggle}
            sx={{
              backgroundColor: theme.palette.secondary.main,
              color: theme.palette.secondary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.secondary.dark,
              },
            }}
          >
            Join
          </Button>
        </Box>
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  )
}
