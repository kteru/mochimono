import { prisma } from '@/lib/prisma'

export default async function TestPage() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    
    return (
      <div className="p-4">
        <h1>Database Test</h1>
        <p>User count: {userCount}</p>
        <p>Database connection successful!</p>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-4">
        <h1>Database Test Failed</h1>
        <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }
}