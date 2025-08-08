/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/**/*'],
  },
}

module.exports = nextConfig