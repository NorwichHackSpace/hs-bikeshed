'use client'

import { createTheme, alpha } from '@mui/material/styles'

// Soft UI color palette
const palette = {
  primary: {
    main: '#1A73E8',
    light: '#4791db',
    dark: '#115293',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7928CA',
    light: '#9c4dcc',
    dark: '#5a1e96',
    contrastText: '#ffffff',
  },
  success: {
    main: '#17AD37',
    light: '#4caf50',
    dark: '#0d7a25',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#FFA726',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  // Norwich Hackspace brand yellow (sampled from logo)
  hackspaceYellow: {
    main: '#F9B233',
    light: '#FBCA6A',
    dark: '#D99A1F',
    contrastText: '#000000',
  },
  error: {
    main: '#EA0606',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  info: {
    main: '#1A73E8',
    light: '#4791db',
    dark: '#115293',
    contrastText: '#ffffff',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  background: {
    default: '#f0f2f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#344767',
    secondary: '#7b809a',
  },
}

export const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.375,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.375,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.375,
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1557b0 0%, #3367d6 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.05)',
          border: '0 solid rgba(0, 0, 0, 0.125)',
          transition: 'box-shadow 200ms ease-in-out, transform 200ms ease-in-out',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filled: {
          '&.MuiChip-colorSuccess': {
            background: alpha(palette.success.main, 0.15),
            color: palette.success.dark,
          },
          '&.MuiChip-colorWarning': {
            background: alpha(palette.warning.main, 0.15),
            color: palette.warning.dark,
          },
          '&.MuiChip-colorError': {
            background: alpha(palette.error.main, 0.15),
            color: palette.error.dark,
          },
          '&.MuiChip-colorPrimary': {
            background: alpha(palette.primary.main, 0.15),
            color: palette.primary.dark,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backdropFilter: 'saturate(200%) blur(30px)',
          backgroundColor: alpha('#ffffff', 0.8),
          color: palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1f37',
          color: '#ffffff',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 16px',
          padding: '10px 16px',
          '&.Mui-selected': {
            backgroundColor: alpha('#ffffff', 0.1),
            '&:hover': {
              backgroundColor: alpha('#ffffff', 0.15),
            },
          },
          '&:hover': {
            backgroundColor: alpha('#ffffff', 0.05),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
          minWidth: 40,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 200ms ease-in-out',
            '&:hover': {
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px 0 rgba(26, 115, 232, 0.15)',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px 0 rgba(0, 0, 0, 0.2)',
          },
        },
        primary: {
          background: 'linear-gradient(135deg, #1A73E8 0%, #4285F4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1557b0 0%, #3367d6 100%)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#000000', 0.08),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardSuccess: {
          backgroundColor: alpha(palette.success.main, 0.1),
          color: palette.success.dark,
        },
        standardError: {
          backgroundColor: alpha(palette.error.main, 0.1),
          color: palette.error.dark,
        },
        standardWarning: {
          backgroundColor: alpha(palette.warning.main, 0.1),
          color: palette.warning.dark,
        },
        standardInfo: {
          backgroundColor: alpha(palette.info.main, 0.1),
          color: palette.info.dark,
        },
      },
    },
  },
})
