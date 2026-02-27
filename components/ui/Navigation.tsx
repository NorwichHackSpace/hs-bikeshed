'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import Image from 'next/image'
import MenuIcon from '@mui/icons-material/Menu'
import BuildIcon from '@mui/icons-material/Build'
import EventIcon from '@mui/icons-material/Event'
import SchoolIcon from '@mui/icons-material/School'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DescriptionIcon from '@mui/icons-material/Description'
import HandymanIcon from '@mui/icons-material/Handyman'
import BarChartIcon from '@mui/icons-material/BarChart'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useAuthStore, useThemeStore } from '@/stores'
import { UserAvatar } from '@/components/ui/UserAvatar'

const DRAWER_WIDTH = 260

const navItems = [
  { label: 'My Profile', href: '/profile', icon: <PersonIcon /> },
  { label: 'My Usage', href: '/usage', icon: <BarChartIcon /> },
  { label: 'Equipment', href: '/equipment', icon: <BuildIcon /> },
  { label: 'Bookings', href: '/bookings', icon: <EventIcon /> },
  { label: 'Inductions', href: '/inductions', icon: <SchoolIcon /> },
  { label: 'Projects', href: '/projects', icon: <FolderIcon /> },
  { label: 'Documents', href: '/documents', icon: <InsertDriveFileIcon /> },
  { label: 'Design Doc', href: '/design', icon: <DescriptionIcon /> },
]

const adminItems = [
  { label: 'Admin', href: '/admin', icon: <AdminPanelSettingsIcon /> },
]

const maintainerItems = [
  { label: 'Maintainers', href: '/maintainers', icon: <HandymanIcon /> },
]

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { profile, isAdmin, isMaintainer, signOut } = useAuthStore()
  const { mode, toggleTheme } = useThemeStore()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    handleMenuClose()
    await signOut()
    window.location.href = '/login'
  }

  const handleNavClick = (href: string) => {
    router.push(href)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const showMaintainer = isAdmin() || isMaintainer()
  const allNavItems = [
    ...navItems,
    ...(showMaintainer ? maintainerItems : []),
    ...(isAdmin() ? adminItems : []),
  ]

  const isDark = theme.palette.mode === 'dark'
  const drawerBg = isDark ? '#2A2A3E' : '#DDDDDD'
  const primaryColor = theme.palette.primary.main

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo — fixed 64px to match AppBar Toolbar height */}
      <Toolbar
        sx={{
          px: 2.5,
          gap: 1.5,
          minHeight: { xs: 64, sm: 64 },
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
      </Toolbar>

      <Divider sx={{ borderColor: alpha(primaryColor, 0.08) }} />

      {/* Navigation Items */}
      <List sx={{ px: 1.5, pt: 1.5, pb: 1, flexGrow: 1 }}>
        {allNavItems.map((item) => {
          const isSelected = pathname.startsWith(item.href)
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavClick(item.href)}
                sx={{
                  borderRadius: 0,
                  mx: 0,
                  py: 0.75,
                  px: 1.5,
                  backgroundColor: isSelected
                    ? primaryColor
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? primaryColor
                      : alpha(primaryColor, 0.08),
                  },
                  '&.Mui-selected': {
                    backgroundColor: primaryColor,
                    '&:hover': {
                      backgroundColor: primaryColor,
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? '#FFFFFF' : 'text.secondary',
                    minWidth: 36,
                    '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontWeight: 400,
                      fontSize: '0.8125rem',
                      color: isSelected ? '#FFFFFF' : 'text.primary',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* User Profile at Bottom */}
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            py: 1.25,
            px: 1.5,
            borderRadius: 0,
            backgroundColor: alpha(primaryColor, 0.04),
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <UserAvatar size={30} />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                fontSize: '0.8125rem',
                lineHeight: 1.3,
              }}
            >
              {profile?.name ?? 'User'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
                display: 'block',
                fontSize: '0.6875rem',
                lineHeight: 1.3,
              }}
            >
              Member
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: `1px solid ${alpha(primaryColor, 0.06)}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 64, sm: 64 } }}>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { md: 'none' },
              color: 'text.primary',
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <UserAvatar size={34} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 200,
                  borderRadius: 2,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {profile?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {profile?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                handleMenuClose()
                router.push('/profile')
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                toggleTheme()
                handleMenuClose()
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {mode === 'dark' ? (
                  <LightModeIcon fontSize="small" />
                ) : (
                  <DarkModeIcon fontSize="small" />
                )}
              </ListItemIcon>
              {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleSignOut}
              sx={{ py: 1.5, color: 'error.main' }}
            >
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: drawerBg,
              borderRight: `1px solid ${alpha(primaryColor, 0.08)}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: drawerBg,
              borderRight: `1px solid ${alpha(primaryColor, 0.08)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  )
}
