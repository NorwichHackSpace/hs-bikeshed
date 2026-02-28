import { Box, Container, Typography } from '@mui/material'
import { PublicNav } from '@/components/ui/PublicNav'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <PublicNav />
      <Box component="main" sx={{ minHeight: '100vh' }}>
        {children}
      </Box>
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            Norwich Hackspace &mdash; BikeShed
          </Typography>
        </Container>
      </Box>
    </>
  )
}
