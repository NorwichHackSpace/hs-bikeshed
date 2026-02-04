'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Fab,
  alpha,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import BuildIcon from '@mui/icons-material/Build'
import { useEquipmentStore, type EquipmentWithMaintainers } from '@/stores'
import { EquipmentDialog } from '@/components/features/EquipmentDialog'
import { getCategorySlug } from '@/lib/utils'
import type { Equipment } from '@/types/database'

const statusColors: Record<string, 'success' | 'warning' | 'error'> = {
  operational: 'success',
  out_of_service: 'warning',
  retired: 'error',
}

const categoryIcons: Record<string, string> = {
  'Laser Cutting': '🔴',
  '3D Printing': '🖨️',
  'Woodworking': '🪵',
  'Metalworking': '⚙️',
  'Electronics': '🔌',
  'Textiles': '🧵',
  'CNC': '🔧',
  'Hand Tools': '🛠️',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const getImageUrl = (path: string) => {
  return `${SUPABASE_URL}/storage/v1/object/public/equipment-images/${path}`
}

export default function EquipmentPage() {
  const router = useRouter()
  const { equipment, loading, error, fetchEquipment, createEquipment } =
    useEquipmentStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  const handleAdd = () => {
    setDialogOpen(true)
  }

  const handleCardClick = (item: EquipmentWithMaintainers) => {
    const categorySlug = getCategorySlug(item.category)
    router.push(`/equipment/${categorySlug}/${item.id}`)
  }

  const handleSave = async (data: Partial<Equipment>) => {
    await createEquipment(data as Omit<Equipment, 'id' | 'created_at' | 'updated_at'>)
  }

  if (loading && equipment.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Equipment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse available equipment and check induction requirements.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ display: { xs: 'none', sm: 'flex' } }}
        >
          Add Equipment
        </Button>
      </Box>

      {equipment.length === 0 ? (
        <Card
          sx={{
            background: 'linear-gradient(135deg, #F9B233 0%, #D99A1F 100%)',
            color: '#000',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: alpha('#000000', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <BuildIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              No equipment yet
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 3, opacity: 0.9, maxWidth: 400, mx: 'auto' }}
            >
              Be the first to add equipment to the hackspace inventory.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                backgroundColor: 'white',
                color: '#000',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.9),
                },
              }}
            >
              Add Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {equipment.map((item) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.id}>
              <Card
                onClick={() => handleCardClick(item)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 200ms ease-in-out',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                  },
                }}
              >
                {item.images && item.images.length > 0 && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 160,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(item.images[0])}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {item.images.length > 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        +{item.images.length - 1}
                      </Box>
                    )}
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {item.category && categoryIcons[item.category] && (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: alpha('#1A73E8', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem',
                          }}
                        >
                          {categoryIcons[item.category]}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {item.name}
                        </Typography>
                        {item.model && (
                          <Typography variant="caption" color="text.secondary">
                            {item.model}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.category && (
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                      {item.status && (
                        <Chip
                          label={item.status.replace('_', ' ')}
                          color={statusColors[item.status] ?? 'default'}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>

                  {item.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                    {item.induction_required && (
                      <Chip
                        label="Induction required"
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                    {item.require_booking && (
                      <Chip
                        label="Booking required"
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                    {item.risk_level && (
                      <Chip
                        label={item.risk_level}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    )}
                  </Box>

                  {item.maintainers && item.maintainers.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 2 }}
                    >
                      Maintainers: {item.maintainers.map((m) => m.name).join(', ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating action button for mobile */}
      <Fab
        color="primary"
        onClick={handleAdd}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' },
        }}
      >
        <AddIcon />
      </Fab>

      <EquipmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        equipment={null}
      />
    </Box>
  )
}
