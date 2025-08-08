'use client'

import { signIn } from 'next-auth/react'
import { Center, Paper, Stack, Title, Text, Button, ThemeIcon } from '@mantine/core'
import { IconBrandGoogle, IconClipboardList } from '@tabler/icons-react'

export default function LoginPage() {
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Paper className="card-container" p="xl" radius="xl" shadow="lg" style={{ width: '100%', maxWidth: 400 }}>
        <Stack align="center" gap="xl">
          <Stack align="center" gap="md">
            <ThemeIcon
              size="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                width: 64,
                height: 64,
              }}
            >
              <IconClipboardList size={32} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
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
            </Stack>
          </Stack>
          
          <Button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            leftSection={<IconBrandGoogle size={20} />}
            size="md"
            radius="xl"
            fullWidth
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            }}
          >
            Googleでログイン
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}