'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Paper, Title, Button, Stack, Center, Loader, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { ChildrenManager } from '@/components/children-manager'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>読み込み中...</Text>
        </Stack>
      </Center>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Stack gap="md">
      <Paper className="card-container" p="md" radius="lg" shadow="sm">
        <Title
          order={1}
          size="h2"
          ta="center"
          style={{
            background: 'linear-gradient(45deg, #3b82f6, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          持ち物メモ
        </Title>
      </Paper>

      <ChildrenManager />

      <Center mt="md" mb="sm">
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconLogout size={14} />}
          onClick={() => signOut({ callbackUrl: '/login' })}
          c="dimmed"
        >
          ログアウト
        </Button>
      </Center>
    </Stack>
  )
}