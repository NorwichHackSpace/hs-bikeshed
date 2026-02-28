"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  alpha,
} from "@mui/material";

const steps = [
  {
    number: "01",
    title: "Sign Up",
    description:
      "Create an account and fill out the membership form. We'll review your application — most are approved within a few days.",
  },
  {
    number: "02",
    title: "Get Inducted",
    description:
      "Once approved, visit the hackspace and get inducted on the equipment you want to use. Safety first — every tool has a quick induction.",
  },
  {
    number: "03",
    title: "Start Making",
    description:
      "Book equipment, start your projects, and become part of the community. The space is yours to use whenever it's open.",
  },
];

export default function HowPage() {
  return (
    <>
      {/* Header */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 3,
          textAlign: "center",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? `radial-gradient(ellipse at 50% 0%, ${alpha("#F9B233", 0.06)} 0%, transparent 60%)`
                : `radial-gradient(ellipse at 50% 0%, ${alpha("#F9B233", 0.1)} 0%, transparent 60%)`,
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative" }}>
          <Typography
            variant="overline"
            sx={{ color: "secondary.main", mb: 2, display: "block" }}
          >
            How
          </Typography>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2rem", md: "3rem" }, mb: 3 }}
          >
            How It Works
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.7 }}
          >
            Getting started at Norwich Hackspace is straightforward. Here&apos;s
            what to expect.
          </Typography>
        </Container>
      </Box>

      {/* Steps */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {steps.map((step) => (
            <Card key={step.number}>
              <CardContent
                sx={{ p: 4, display: "flex", gap: 3, alignItems: "flex-start" }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    color: "secondary.main",
                    fontSize: "2.5rem",
                    lineHeight: 1,
                    minWidth: 64,
                    opacity: 0.7,
                  }}
                >
                  {step.number}
                </Typography>
                <Box>
                  <Typography variant="h4" fontWeight={600} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Pricing */}
        <Card sx={{ mt: 6 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography
              variant="overline"
              sx={{ color: "secondary.main", display: "block", mb: 1 }}
            >
              Membership
            </Typography>
            <Typography variant="h3" gutterBottom>
              &pound;15 / month
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 480, mx: "auto", lineHeight: 1.7 }}
            >
              Paid by standing order. Gives you access to the space and all
              equipment (after inductions). No contracts — cancel anytime.
            </Typography>
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: "secondary.main",
                color: "secondary.contrastText",
                px: 4,
                "&:hover": { backgroundColor: "secondary.dark" },
              }}
            >
              Join Now
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
