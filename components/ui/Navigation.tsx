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
  Avatar,
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
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DescriptionIcon from '@mui/icons-material/Description'
import HandymanIcon from '@mui/icons-material/Handyman'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useAuthStore, useThemeStore } from '@/stores'

const DRAWER_WIDTH = 280

const navItems = [
  { label: 'My Profile', href: '/profile', icon: <PersonIcon /> },
  { label: 'Equipment', href: '/equipment', icon: <BuildIcon /> },
  { label: 'Bookings', href: '/bookings', icon: <EventIcon /> },
  { label: 'Inductions', href: '/inductions', icon: <SchoolIcon /> },
  { label: 'Projects', href: '/projects', icon: <FolderIcon /> },
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
    console.log('Sign out clicked')
    handleMenuClose()
    try {
      console.log('Calling signOut...')
      await signOut()
      console.log('SignOut completed')
    } catch (err) {
      console.error('SignOut error:', err)
    } finally {
      console.log('Redirecting to /login')
      router.push('/login')
    }
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

  const drawer = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Image
          src="/Norwich_hackspace_roundel-135x135.png"
          alt="Norwich Hackspace"
          width={40}
          height={40}
          style={{ borderRadius: 8 }}
        />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.025em',
            }}
          >
            BikeShed
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha('#ffffff', 0.6),
              fontSize: '0.7rem',
            }}
          >
            Norwich Hackspace
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha('#ffffff', 0.1), mx: 2 }} />

      {/* Navigation Items */}
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {allNavItems.map((item) => {
          const isSelected = pathname.startsWith(item.href)
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavClick(item.href)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  py: 1.5,
                  backgroundColor: isSelected
                    ? alpha('#ffffff', 0.1)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha('#ffffff', 0.08),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha('#ffffff', 0.1),
                    '&:hover': {
                      backgroundColor: alpha('#ffffff', 0.15),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? '#F9B233' : alpha('#ffffff', 0.7),
                    minWidth: 44,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: '0.875rem',
                      color: isSelected ? '#ffffff' : alpha('#ffffff', 0.8),
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* User Profile at Bottom */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha('#ffffff', 0.05),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#000',
            }}
          >
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {profile?.name ?? 'User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#ffffff', 0.6),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
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
          backgroundColor: alpha('#121218', 0.8),
          backdropFilter: 'saturate(200%) blur(30px)',
          borderBottom: `1px solid ${alpha('#ffffff', 0.05)}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
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
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)',
                fontWeight: 600,
                color: '#000',
              }}
            >
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
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
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
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
              backgroundColor: '#1E1E26',
              borderRight: `1px solid ${alpha('#ffffff', 0.05)}`,
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
              backgroundColor: '#1E1E26',
              borderRight: `1px solid ${alpha('#ffffff', 0.05)}`,
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
