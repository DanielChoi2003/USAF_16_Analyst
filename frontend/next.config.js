/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Output Configuration ──────────────────────────────────────────────────
  output: 'standalone', // Optimized for Docker deployment
  
  // ── Environment Variables (exposed to browser) ────────────────────────────
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  
  // ── TypeScript & ESLint ───────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false, // Fail build on TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: false, // Fail build on ESLint errors
  },
  
  // ── Performance Optimization ──────────────────────────────────────────────
  swcMinify: true, // Use SWC for faster minification
  compress: true,   // Enable gzip compression
  
  // ── Image Optimization (for logos, diagrams) ──────────────────────────────
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      // Add remote image domains if needed (e.g., MISP logos)
    ],
  },
  
  // ── Headers (Security) ────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // ── Redirects (Optional) ──────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
