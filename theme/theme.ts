'use client'

import { createTheme, alpha } from '@mui/material/styles'

// ──────────────────────────────────────────────────
// Quadra 700 — System 7 Platinum theme
// Chicago for headings, Geneva for body
// Hard 1px borders, beveled buttons, no radius
// ──────────────────────────────────────────────────

const chicagoFont = '"ChicagoFLF", "Geneva", "Helvetica Neue", sans-serif'
const genevaFont = '"Geneva", "Helvetica Neue", "Lucida Grande", sans-serif'

// System 7 palette
const platinum = {
  50: '#F5F5F5',
  100: '#EEEEEE',
  200: '#DDDDDD',   // Classic platinum desktop
  300: '#CCCCCC',   // Button face
  400: '#BBBBBB',
  500: '#AAAAAA',
  600: '#888888',
  700: '#666666',
  800: '#444444',
  900: '#222222',
}

const brandColors = {
  primary: {
    main: '#000080',       // Classic Mac selection blue
    light: '#3363AC',
    dark: '#000060',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#F9B233',       // Hackspace yellow kept as accent
    light: '#FBCA6A',
    dark: '#D99A1F',
    contrastText: '#000000',
  },
  success: {
    main: '#008000',
    light: '#33A033',
    dark: '#006000',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#CC8800',
    light: '#DDAA33',
    dark: '#AA6600',
    contrastText: '#000000',
  },
  error: {
    main: '#CC0000',
    light: '#DD3333',
    dark: '#990000',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#000080',
    light: '#3363AC',
    dark: '#000060',
    contrastText: '#FFFFFF',
  },
}

// ── Light: Classic Platinum Mac ────────────────
const lightPalette = {
  mode: 'light' as const,
  ...brandColors,
  grey: platinum,
  background: {
    default: '#DDDDDD',   // Platinum desktop
    paper: '#FFFFFF',      // Window content
  },
  text: {
    primary: '#000000',
    secondary: '#444444',
  },
  divider: '#000000',
}

// ── Dark: System 7 on a dark CRT ───────────────
// Keep the same platinum UI feel but inverted —
// grey chrome on dark background, like running a
// classic Mac with the contrast turned down
const darkPalette = {
  mode: 'dark' as const,
  ...brandColors,
  primary: {
    main: '#4466AA',
    light: '#6688CC',
    dark: '#223388',
    contrastText: '#FFFFFF',
  },
  grey: platinum,
  background: {
    default: '#3A3A3A',    // Dark grey desktop (not blue-tinted)
    paper: '#4A4A4A',      // Window body — lighter grey
  },
  text: {
    primary: '#EEEEEE',
    secondary: '#BBBBBB',
  },
  divider: '#888888',
}

// ── Beveled border helpers ─────────────────────
// Classic Mac OS outset: light top/left, dark bottom/right
const bevelOutset = (light: string, dark: string) =>
  `inset 1px 1px 0 ${light}, inset -1px -1px 0 ${dark}`
const bevelInset = (light: string, dark: string) =>
  `inset 1px 1px 0 ${dark}, inset -1px -1px 0 ${light}`

const getTypography = (textPrimary: string, textSecondary: string) => ({
  fontFamily: genevaFont,
  h1: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '1.75rem',
    lineHeight: 1.3,
    letterSpacing: 0,
    color: textPrimary,
  },
  h2: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '1.5rem',
    lineHeight: 1.3,
    letterSpacing: 0,
    color: textPrimary,
  },
  h3: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '1.25rem',
    lineHeight: 1.375,
    color: textPrimary,
  },
  h4: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '1.125rem',
    lineHeight: 1.375,
    color: textPrimary,
  },
  h5: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.4,
    color: textPrimary,
  },
  h6: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: textPrimary,
  },
  subtitle1: {
    fontFamily: genevaFont,
    fontSize: '0.9375rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  subtitle2: {
    fontFamily: genevaFont,
    fontSize: '0.8125rem',
    fontWeight: 700,
    lineHeight: 1.5,
  },
  body1: {
    fontFamily: genevaFont,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontFamily: genevaFont,
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontFamily: chicagoFont,
    fontWeight: 400,
    fontSize: '0.8125rem',
    textTransform: 'none' as const,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: genevaFont,
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
    color: textSecondary,
  },
  overline: {
    fontFamily: chicagoFont,
    fontSize: '0.6875rem',
    fontWeight: 400,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
})

const getComponents = (mode: 'light' | 'dark', palette: typeof darkPalette | typeof lightPalette) => {
  const isDark = mode === 'dark'
  const borderColor = palette.divider
  const bevelLight = isDark ? '#777777' : '#FFFFFF'
  const bevelDark = isDark ? '#222222' : '#888888'
  const buttonFace = isDark ? '#5A5A5A' : '#CCCCCC'
  const scrollbarColor = isDark ? '#666666' : '#AAAAAA'
  const inputBg = isDark ? '#3A3A3A' : '#FFFFFF'

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin' as const,
          scrollbarColor: `${scrollbarColor} ${isDark ? '#4A4A4A' : '#DDDDDD'}`,
          '&::-webkit-scrollbar': {
            width: '16px',
            height: '16px',
          },
          '&::-webkit-scrollbar-track': {
            background: isDark ? '#4A4A4A' : '#DDDDDD',
            border: `1px solid ${borderColor}`,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: scrollbarColor,
            border: `1px solid ${borderColor}`,
            '&:hover': {
              backgroundColor: isDark ? '#777777' : '#888888',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '6px 20px',
          fontFamily: chicagoFont,
          fontWeight: 400,
          fontSize: '0.8125rem',
          boxShadow: 'none',
          transition: 'none',
          '&:hover': {
            transform: 'none',
          },
        },
        contained: {
          backgroundColor: buttonFace,
          color: palette.text.primary,
          border: `2px solid ${borderColor}`,
          boxShadow: bevelOutset(bevelLight, bevelDark),
          '&:hover': {
            backgroundColor: buttonFace,
            boxShadow: bevelOutset(bevelLight, bevelDark),
          },
          '&:active': {
            boxShadow: bevelInset(bevelLight, bevelDark),
          },
        },
        containedPrimary: {
          backgroundColor: buttonFace,
          color: palette.text.primary,
          border: `2px solid ${borderColor}`,
          '&:hover': {
            backgroundColor: isDark ? '#6A6A6A' : '#BBBBBB',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: borderColor,
          borderRadius: 0,
          color: palette.text.primary,
          '&:hover': {
            borderWidth: '2px',
            borderColor: borderColor,
            backgroundColor: alpha(palette.text.primary, 0.05),
          },
        },
        text: {
          color: palette.text.primary,
          borderRadius: 0,
          '&:hover': {
            backgroundColor: alpha(palette.text.primary, 0.08),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: palette.background.paper,
          backgroundImage: 'none',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? 'none' : `2px 2px 0 ${borderColor}`,
          transition: 'none',
          '&:hover': {
            borderColor: borderColor,
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 16,
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 0,
        },
        outlined: {
          borderColor: borderColor,
        },
        elevation1: {
          boxShadow: isDark ? 'none' : `1px 1px 0 ${borderColor}`,
        },
        elevation2: {
          boxShadow: isDark ? 'none' : `2px 2px 0 ${borderColor}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontFamily: genevaFont,
          fontWeight: 400,
          fontSize: '0.75rem',
          height: 24,
          border: `1px solid ${borderColor}`,
        },
        filled: {
          '&.MuiChip-colorDefault': {
            backgroundColor: isDark ? '#5A5A5A' : '#DDDDDD',
            color: palette.text.primary,
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: palette.success.main,
            color: palette.success.contrastText,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: palette.warning.main,
            color: palette.warning.contrastText,
          },
          '&.MuiChip-colorError': {
            backgroundColor: palette.error.main,
            color: palette.error.contrastText,
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: palette.info.main,
            color: palette.info.contrastText,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: palette.secondary.main,
            color: palette.secondary.contrastText,
          },
        },
        outlined: {
          borderColor: borderColor,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backgroundColor: isDark ? '#4A4A4A' : '#DDDDDD',
          backdropFilter: 'none',
          borderBottom: `1px solid ${borderColor}`,
          color: palette.text.primary,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: isDark ? '#4A4A4A' : '#DDDDDD',
          backgroundImage: 'none',
          borderRight: `1px solid ${borderColor}`,
          borderRadius: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: '1px 8px',
          padding: '6px 12px',
          color: palette.text.primary,
          '&.Mui-selected': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
            '&:hover': {
              backgroundColor: palette.primary.main,
            },
            '& .MuiListItemIcon-root': {
              color: palette.primary.contrastText,
            },
            '& .MuiListItemText-primary': {
              color: palette.primary.contrastText,
            },
          },
          '&:hover': {
            backgroundColor: alpha(palette.text.primary, 0.08),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: palette.text.secondary,
          minWidth: 36,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: inputBg,
            transition: 'none',
            boxShadow: bevelInset(bevelLight, bevelDark),
            '& fieldset': {
              borderColor: borderColor,
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: borderColor,
            },
            '&.Mui-focused': {
              backgroundColor: inputBg,
              '& fieldset': {
                borderColor: borderColor,
                borderWidth: 2,
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontFamily: genevaFont,
            color: palette.text.secondary,
          },
          '& .MuiOutlinedInput-input': {
            fontFamily: genevaFont,
            color: palette.text.primary,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.paper,
          border: `1px solid ${borderColor}`,
          borderRadius: 0,
          boxShadow: isDark ? 'none' : `2px 2px 0 ${borderColor}`,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: 0,
          padding: '4px 16px',
          fontFamily: genevaFont,
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
          '&.Mui-selected': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
            '&:hover': {
              backgroundColor: palette.primary.main,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          backgroundColor: isDark ? '#4A4A4A' : '#DDDDDD',
          border: `2px solid ${borderColor}`,
          boxShadow: isDark ? 'none' : `3px 3px 0 ${borderColor}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: chicagoFont,
          fontSize: '0.875rem',
          fontWeight: 400,
          color: palette.text.primary,
          borderBottom: `1px solid ${borderColor}`,
          padding: '8px 16px',
          // Pinstripe title bar background
          backgroundImage: isDark
            ? `repeating-linear-gradient(0deg, transparent, transparent 1px, ${alpha('#ffffff', 0.03)} 1px, ${alpha('#ffffff', 0.03)} 2px)`
            : `repeating-linear-gradient(0deg, transparent, transparent 1px, ${alpha('#000000', 0.04)} 1px, ${alpha('#000000', 0.04)} 2px)`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: palette.text.primary,
          backgroundColor: palette.background.paper,
          padding: 16,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${borderColor}`,
          boxShadow: bevelOutset(bevelLight, bevelDark),
          '&:hover': {
            boxShadow: bevelOutset(bevelLight, bevelDark),
          },
          '&:active': {
            boxShadow: bevelInset(bevelLight, bevelDark),
          },
        },
        primary: {
          backgroundColor: buttonFace,
          color: palette.text.primary,
          '&:hover': {
            backgroundColor: isDark ? '#6A6A6A' : '#BBBBBB',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${borderColor}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: borderColor,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${borderColor}`,
        },
        standardSuccess: {
          backgroundColor: isDark ? alpha('#008000', 0.15) : '#CCFFCC',
          borderColor: palette.success.main,
          color: palette.text.primary,
          '& .MuiAlert-icon': { color: palette.success.main },
        },
        standardError: {
          backgroundColor: isDark ? alpha('#CC0000', 0.15) : '#FFCCCC',
          borderColor: palette.error.main,
          color: palette.text.primary,
          '& .MuiAlert-icon': { color: palette.error.main },
        },
        standardWarning: {
          backgroundColor: isDark ? alpha('#CC8800', 0.15) : '#FFEECC',
          borderColor: palette.warning.main,
          color: palette.text.primary,
          '& .MuiAlert-icon': { color: palette.warning.main },
        },
        standardInfo: {
          backgroundColor: isDark ? alpha('#000080', 0.15) : '#CCCCFF',
          borderColor: palette.info.main,
          color: palette.text.primary,
          '& .MuiAlert-icon': { color: palette.info.main },
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
            backgroundColor: isDark ? '#5A5A5A' : '#DDDDDD',
            color: palette.text.primary,
            fontFamily: chicagoFont,
            fontWeight: 400,
            fontSize: '0.8125rem',
            borderBottom: `1px solid ${borderColor}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: alpha(palette.primary.main, 0.08),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${borderColor}`,
          color: palette.text.primary,
          fontFamily: genevaFont,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            backgroundColor: palette.text.primary,
            height: 2,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: chicagoFont,
          fontWeight: 400,
          fontSize: '0.8125rem',
          color: palette.text.secondary,
          borderRadius: 0,
          textTransform: 'none' as const,
          '&.Mui-selected': {
            color: palette.text.primary,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: palette.text.primary,
          borderRadius: 0,
          '&.Mui-checked': {
            color: palette.text.primary,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: palette.text.primary,
            '& + .MuiSwitch-track': {
              backgroundColor: palette.text.secondary,
            },
          },
          '& .MuiSwitch-track': {
            borderRadius: 0,
          },
          '& .MuiSwitch-thumb': {
            borderRadius: 0,
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: palette.text.primary,
          color: palette.background.paper,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark ? '#444444' : '#000000',
          color: '#FFFFFF',
          borderRadius: 0,
          fontFamily: genevaFont,
          fontSize: '0.75rem',
          border: `1px solid ${borderColor}`,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.paper,
          border: `1px solid ${borderColor}`,
          borderRadius: 0,
          boxShadow: isDark ? 'none' : `2px 2px 0 ${borderColor}`,
        },
        option: {
          borderRadius: 0,
          margin: 0,
          fontFamily: genevaFont,
          '&[aria-selected="true"]': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
          '&:hover': {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontFamily: genevaFont,
          color: palette.text.secondary,
          '&.Mui-focused': {
            color: palette.text.primary,
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
          color: palette.text.primary,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#5A5A5A' : '#DDDDDD',
          borderRadius: 0,
          border: `1px solid ${borderColor}`,
        },
        barColorPrimary: {
          backgroundColor: palette.primary.main,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          color: palette.text.primary,
          '&:hover': {
            backgroundColor: alpha(palette.text.primary, 0.08),
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepLabel-label': {
            fontFamily: genevaFont,
            color: palette.text.secondary,
            '&.Mui-active': { color: palette.text.primary },
            '&.Mui-completed': { color: palette.text.primary },
          },
          '& .MuiStepIcon-root': {
            color: palette.grey[400],
            '&.Mui-active': { color: palette.text.primary },
            '&.Mui-completed': { color: palette.text.primary },
          },
        },
      },
    },
  }
}

// No soft shadows — hard pixel drops only
const getShadows = (isDark: boolean): [
  'none',
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string, string,
  string, string, string, string
] => {
  const c = isDark ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'
  return [
    'none',
    `1px 1px 0 ${c}`,
    `2px 2px 0 ${c}`,
    `2px 2px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
    `3px 3px 0 ${c}`,
  ]
}

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette

  return createTheme({
    palette,
    typography: getTypography(palette.text.primary, palette.text.secondary),
    shape: {
      borderRadius: 0,
    },
    shadows: getShadows(mode === 'dark'),
    components: getComponents(mode, palette),
  })
}

// Export default dark theme for backwards compatibility
export const theme = createAppTheme('dark')
export const lightTheme = createAppTheme('light')
export const darkTheme = createAppTheme('dark')
