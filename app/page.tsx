'use client'

import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/hero-section'
import { InvitationCard } from '@/components/invitation-card'
import { Button } from '@/components/ui/button'
import { Plus, Home, FileText, User } from 'lucide-react'
import { useAppStore, sampleInvitations } from '@/lib/store'
import { useEffect } from 'react'

export default function LandingPage() {
  const { invitations, setInvitations, isAuthenticated } = useAppStore()

  useEffect(() => {
    // Load sample data on mount
    if (invitations.length === 0) {
      setInvitations(sampleInvitations)
    }
  }, [invitations.length, setInvitations])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* My Invitations Section (if authenticated) */}
        {isAuthenticated && invitations.length > 0 && (
          <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">내 청첩장</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    작성 중인 청첩장을 확인하고 관리하세요.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/editor/new">
                    <Plus className="mr-2 h-4 w-4" />
                    새 청첩장 만들기
                  </Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {invitations.map((invitation) => (
                  <InvitationCard key={invitation.id} invitation={invitation} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="border-t border-border py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">
                왜 VOW SEOUL인가요?
              </h2>
              <p className="mt-3 text-muted-foreground">
                특별한 날을 위한 최고의 선택
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="mb-3 text-lg font-medium">간편한 편집</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  드래그 앤 드롭으로 쉽게 편집하고,
                  <br />
                  실시간 미리보기로 바로 확인하세요.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-lg font-medium">다양한 템플릿</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  클래식부터 모던까지 다양한 스타일의
                  <br />
                  프리미엄 템플릿을 제공합니다.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-lg font-medium">손쉬운 공유</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  카카오톡, 문자, SNS로
                  <br />
                  간편하게 청첩장을 공유하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-foreground py-20 text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight">
              지금 바로 시작하세요
            </h2>
            <p className="mt-4 text-lg opacity-80">
              5분 만에 완성하는 나만의 특별한 청첩장
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                size="lg" 
                variant="secondary"
                className="min-w-[180px]"
                asChild
              >
                <Link href="/templates">템플릿 둘러보기</Link>
              </Button>
              <Button 
                size="lg" 
                className="min-w-[180px] bg-background text-foreground hover:bg-muted"
                asChild
              >
                <Link href="/editor/new">청첩장 만들기</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
        <div className="flex h-16 items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs">홈</span>
          </Link>
          <Link href="/editor/new" className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileText className="h-5 w-5" />
            <span className="text-xs">새 청첩장</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs">마이페이지</span>
          </Link>
        </div>
      </nav>

      {/* Floating Action Button (Mobile) */}
      <Button 
        size="lg" 
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg md:hidden"
        asChild
      >
        <Link href="/editor/new">
          <Plus className="h-6 w-6" />
          <span className="sr-only">새 청첩장 만들기</span>
        </Link>
      </Button>
    </div>
  )
}
