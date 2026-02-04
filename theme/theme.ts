'use client'

import { createTheme, alpha } from '@mui/material/styles'

// Norwich Hackspace brand colors
const brandColors = {
  primary: {
    main: '#F9B233',
    light: '#FBCA6A',
    dark: '#D99A1F',
    contrastText: '#000000',
  },
  secondary: {
    main: '#6B7280',
    light: '#9CA3AF',
    dark: '#4B5563',
    contrastText: '#ffffff',
  },
  success: {
    main: '#22C55E',
    light: '#4ADE80',
    dark: '#16A34A',
    contrastText: '#000000',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#000000',
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    contrastText: '#ffffff',
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    contrastText: '#ffffff',
  },
}

const grey = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
}

// Dark palette
const darkPalette = {
  mode: 'dark' as const,
  ...brandColors,
  grey,
  background: {
    default: '#121218',
    paper: '#1E1E26',
  },
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
  },
  divider: alpha('#ffffff', 0.08),
}

// Light palette
const lightPalette = {
  mode: 'light' as const,
  ...brandColors,
  grey,
  background: {
    default: '#F5F5F7',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
  },
  divider: alpha('#000000', 0.08),
}

const getTypography = (textPrimary: string, textSecondary: string) => ({
  fontFamily: '"Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  h1: {
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.25,
    letterSpacing: '-0.025em',
    color: textPrimary,
  },
  h2: {
    fontWeight: 700,
    fontSize: '1.875rem',
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
    color: textPrimary,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.375,
    color: textPrimary,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.375,
    color: textPrimary,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.375,
    color: textPrimary,
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: textPrimary,
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
    color: textSecondary,
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
})

const getComponents = (mode: 'light' | 'dark', palette: typeof darkPalette | typeof lightPalette) => {
  const isDark = mode === 'dark'
  const alphaColor = isDark ? '#ffffff' : '#000000'
  const scrollbarColor = isDark ? grey[700] : grey[400]
  const scrollbarHoverColor = isDark ? grey[600] : grey[500]

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin' as const,
          scrollbarColor: `${scrollbarColor} transparent`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: scrollbarColor,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: scrollbarHoverColor,
            },
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
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px 0 rgba(249, 178, 51, 0.3)',
          },
        },
        containedPrimary: {
          backgroundColor: palette.primary.main,
          color: palette.primary.contrastText,
          '&:hover': {
            backgroundColor: palette.primary.light,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: alpha(alphaColor, 0.2),
          color: palette.text.primary,
          '&:hover': {
            borderWidth: '2px',
            borderColor: palette.primary.main,
            backgroundColor: alpha(palette.primary.main, 0.1),
          },
        },
        text: {
          color: palette.text.secondary,
          '&:hover': {
            backgroundColor: alpha(alphaColor, 0.05),
            color: palette.text.primary,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: palette.background.paper,
          backgroundImage: 'none',
          border: `1px solid ${alpha(alphaColor, 0.05)}`,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.08)',
          transition: 'border-color 200ms ease-in-out, transform 200ms ease-in-out',
          '&:hover': {
            borderColor: alpha(alphaColor, 0.1),
          },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: alpha(alphaColor, 0.1),
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
          '&.MuiChip-colorDefault': {
            backgroundColor: alpha(alphaColor, 0.1),
            color: palette.text.primary,
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(palette.success.main, 0.15),
            color: isDark ? palette.success.light : palette.success.dark,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: alpha(palette.warning.main, 0.15),
            color: isDark ? palette.warning.light : palette.warning.dark,
          },
          '&.MuiChip-colorError': {
            backgroundColor: alpha(palette.error.main, 0.15),
            color: isDark ? palette.error.light : palette.error.dark,
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: alpha(palette.info.main, 0.15),
            color: isDark ? palette.info.light : palette.info.dark,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: alpha(palette.secondary.main, 0.2),
            color: palette.text.primary,
          },
        },
        outlined: {
          borderColor: alpha(alphaColor, 0.2),
          '&.MuiChip-colorPrimary': {
            borderColor: palette.primary.main,
            color: palette.primary.main,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: alpha(palette.background.default, 0.8),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(alphaColor, 0.05)}`,
          color: palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#1E1E26' : '#FFFFFF',
          backgroundImage: 'none',
          borderRight: `1px solid ${alpha(alphaColor, 0.05)}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 12px',
          padding: '12px 16px',
          color: palette.text.secondary,
          '&.Mui-selected': {
            backgroundColor: alpha(alphaColor, 0.08),
            color: palette.text.primary,
            '&:hover': {
              backgroundColor: alpha(alphaColor, 0.12),
            },
            '& .MuiListItemIcon-root': {
              color: palette.primary.main,
            },
          },
          '&:hover': {
            backgroundColor: alpha(alphaColor, 0.05),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          minWidth: 40,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: alpha(alphaColor, 0.03),
            transition: 'all 200ms ease-in-out',
            '& fieldset': {
              borderColor: alpha(alphaColor, 0.1),
            },
            '&:hover fieldset': {
              borderColor: alpha(alphaColor, 0.2),
            },
            '&.Mui-focused': {
              backgroundColor: alpha(alphaColor, 0.05),
              '& fieldset': {
                borderColor: palette.primary.main,
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: palette.text.secondary,
          },
          '& .MuiOutlinedInput-input': {
            color: palette.text.primary,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.paper,
          border: `1px solid ${alpha(alphaColor, 0.1)}`,
          borderRadius: 8,
          boxShadow: isDark ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '10px 12px',
          '&:hover': {
            backgroundColor: alpha(alphaColor, 0.05),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(palette.primary.main, 0.15),
            '&:hover': {
              backgroundColor: alpha(palette.primary.main, 0.2),
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          backgroundColor: palette.background.paper,
          border: `1px solid ${alpha(alphaColor, 0.1)}`,
          boxShadow: isDark ? '0 24px 48px rgba(0, 0, 0, 0.4)' : '0 24px 48px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: palette.text.primary,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 8px 24px 0 rgba(249, 178, 51, 0.3)',
          },
        },
        primary: {
          backgroundColor: palette.primary.main,
          color: palette.primary.contrastText,
          '&:hover': {
            backgroundColor: palette.primary.light,
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `2px solid ${alpha(alphaColor, 0.1)}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha(alphaColor, 0.08),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: alpha(palette.success.main, 0.1),
          borderColor: alpha(palette.success.main, 0.3),
          color: isDark ? palette.success.light : palette.success.dark,
          '& .MuiAlert-icon': {
            color: palette.success.main,
          },
        },
        standardError: {
          backgroundColor: alpha(palette.error.main, 0.1),
          borderColor: alpha(palette.error.main, 0.3),
          color: isDark ? palette.error.light : palette.error.dark,
          '& .MuiAlert-icon': {
            color: palette.error.main,
          },
        },
        standardWarning: {
          backgroundColor: alpha(palette.warning.main, 0.1),
          borderColor: alpha(palette.warning.main, 0.3),
          color: isDark ? palette.warning.light : palette.warning.dark,
          '& .MuiAlert-icon': {
            color: palette.warning.main,
          },
        },
        standardInfo: {
          backgroundColor: alpha(palette.info.main, 0.1),
          borderColor: alpha(palette.info.main, 0.3),
          color: isDark ? palette.info.light : palette.info.dark,
          '& .MuiAlert-icon': {
            color: palette.info.main,
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: alpha(alphaColor, 0.03),
            color: palette.text.secondary,
            fontWeight: 600,
            borderBottom: `1px solid ${alpha(alphaColor, 0.1)}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: alpha(alphaColor, 0.03),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(alphaColor, 0.05)}`,
          color: palette.text.primary,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            backgroundColor: palette.primary.main,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          fontWeight: 500,
          '&.Mui-selected': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          '&.Mui-checked': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: palette.primary.main,
            '& + .MuiSwitch-track': {
              backgroundColor: palette.primary.main,
            },
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: palette.primary.main,
          color: palette.primary.contrastText,
        },
        colorWarning: {
          backgroundColor: palette.warning.main,
          color: palette.warning.contrastText,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? grey[800] : grey[700],
          color: '#ffffff',
          borderRadius: 6,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.paper,
          border: `1px solid ${alpha(alphaColor, 0.1)}`,
          borderRadius: 8,
        },
        option: {
          borderRadius: 8,
          margin: '4px 8px',
          '&[aria-selected="true"]': {
            backgroundColor: alpha(palette.primary.main, 0.15),
          },
          '&:hover': {
            backgroundColor: alpha(alphaColor, 0.05),
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          '&.Mui-focused': {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: palette.primary.main,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(alphaColor, 0.1),
          borderRadius: 4,
        },
        barColorPrimary: {
          backgroundColor: palette.primary.main,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          '&:hover': {
            backgroundColor: alpha(alphaColor, 0.05),
            color: palette.text.primary,
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-label': {
            color: palette.text.secondary,
            '&.Mui-active': {
              color: palette.text.primary,
            },
            '&.Mui-completed': {
              color: palette.text.primary,
            },
          },
          '& .MuiStepIcon-root': {
            color: alpha(alphaColor, 0.2),
            '&.Mui-active': {
              color: palette.primary.main,
            },
            '&.Mui-completed': {
              color: palette.primary.main,
            },
          },
        },
      },
    },
  }
}

const getShadows = (isDark: boolean): [
  'none',
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string
] => {
  const shadowOpacity = isDark ? 0.3 : 0.1
  return [
    'none',
    `0 1px 2px 0 rgba(0, 0, 0, ${shadowOpacity})`,
    `0 1px 3px 0 rgba(0, 0, 0, ${shadowOpacity + 0.1}), 0 1px 2px 0 rgba(0, 0, 0, ${shadowOpacity})`,
    `0 4px 6px -1px rgba(0, 0, 0, ${shadowOpacity + 0.1}), 0 2px 4px -1px rgba(0, 0, 0, ${shadowOpacity})`,
    `0 10px 15px -3px rgba(0, 0, 0, ${shadowOpacity + 0.1}), 0 4px 6px -2px rgba(0, 0, 0, ${shadowOpacity})`,
    `0 20px 25px -5px rgba(0, 0, 0, ${shadowOpacity + 0.1}), 0 10px 10px -5px rgba(0, 0, 0, ${shadowOpacity - 0.1})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
    `0 25px 50px -12px rgba(0, 0, 0, ${shadowOpacity + 0.2})`,
  ]
}

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette

  return createTheme({
    palette,
    typography: getTypography(palette.text.primary, palette.text.secondary),
    shape: {
      borderRadius: 8,
    },
    shadows: getShadows(mode === 'dark'),
    components: getComponents(mode, palette),
  })
}

// Export default dark theme for backwards compatibility
export const theme = createAppTheme('dark')
export const lightTheme = createAppTheme('light')
export const darkTheme = createAppTheme('dark')
