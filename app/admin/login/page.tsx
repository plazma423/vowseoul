'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useAppStore } from '@/lib/store'
import { Spinner } from '@/components/ui/spinner'

import { Logo } from '@/components/logo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAuth } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate login
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check admin credentials
    if (username === 'vowseoul' && password === 'test1234') {
      setAuth(true, true)
      router.push('/admin')
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo className="h-6 w-auto text-foreground" />
          </div>
          <CardTitle className="text-xl">관리자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">아이디</FieldLabel>
                <Input
                  id="username"
                  placeholder="관리자 아이디"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
            </FieldGroup>

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              로그인
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              메인 페이지로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
