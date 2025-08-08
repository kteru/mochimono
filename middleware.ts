import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page, api/auth routes, and test page
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/api/auth') ||
            req.nextUrl.pathname.startsWith('/test')) {
          return true
        }
        // Require token for other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}