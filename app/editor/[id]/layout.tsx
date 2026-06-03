'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MobilePreview } from '@/components/mobile-preview'
import { useAppStore, sampleThemes } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const editorSteps = [
  { id: 1, name: '기본정보', path: '' },
  { id: 2, name: '디자인', path: '/design' },
  { id: 3, name: '콘텐츠', path: '/content' },
  { id: 4, name: '부가기능', path: '/features' },
  { id: 5, name: '결제/발행', path: '/payment' },
]

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { currentInvitation, setCurrentInvitation, loadInvitation, saveInvitation, editorStep, setEditorStep } = useAppStore()

  const invitationId = params.id as string
  const basePath = `/editor/${invitationId}`

  // Initialize or load invitation on mount
  useEffect(() => {
    const initInvitation = async () => {
      if (invitationId === 'new') {
        if (!currentInvitation || currentInvitation.id !== 'new') {
          const { data } = await supabase.from('themes').select('*').limit(1)
          const defaultTheme = (data && data.length > 0) ? data[0] : sampleThemes[0]
          
          setCurrentInvitation({
            id: 'new',
            themeId: defaultTheme.id,
            colorSet: defaultTheme.colorSets?.[0]?.id || 'default',
            fontSet: defaultTheme.fontSets?.[0]?.id || 'default',
            galleryViewType: 'slide',
            rsvpEnabled: true,
            guestbookType: 'text',
            bankAccounts: [],
            contacts: [],
            galleryImages: [],
          })
        }
      } else {
        if (!currentInvitation || currentInvitation.id !== invitationId) {
          await loadInvitation(invitationId)
        }
      }
    }
    initInvitation()
  }, [invitationId, currentInvitation, setCurrentInvitation, loadInvitation])

  const handleSave = async () => {
    const savedId = await saveInvitation()
    if (savedId) {
      alert('청첩장이 성공적으로 저장되었습니다!')
      if (invitationId === 'new') {
        router.push(`/editor/${savedId}`)
      }
    } else {
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  // Update step based on pathname
  useEffect(() => {
    const currentPath = pathname.replace(basePath, '')
    const step = editorSteps.find(s => s.path === currentPath)
    if (step) {
      setEditorStep(step.id)
    }
  }, [pathname, basePath, setEditorStep])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Editor Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">뒤로가기</span>
              </Link>
            </Button>
            <span className="text-lg font-semibold">VOW SEOUL</span>
          </div>

          {/* Step Indicator */}
          <nav className="hidden md:flex">
            <ol className="flex items-center gap-2">
              {editorSteps.map((step, index) => {
                const isActive = editorStep === step.id
                const isCompleted = editorStep > step.id
                return (
                  <li key={step.id} className="flex items-center">
                    <Link
                      href={`${basePath}${step.path}`}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                        isActive && 'bg-foreground text-background',
                        isCompleted && 'text-foreground',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}
                    >
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                        isActive && 'bg-background text-foreground',
                        isCompleted && 'bg-foreground text-background',
                        !isActive && !isCompleted && 'border border-current'
                      )}>
                        {isCompleted ? <Check className="h-3 w-3" /> : step.id}
                      </span>
                      {step.name}
                    </Link>
                    {index < editorSteps.length - 1 && (
                      <div className={cn(
                        'mx-2 h-px w-8',
                        isCompleted ? 'bg-foreground' : 'bg-border'
                      )} />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          <Button onClick={handleSave}>
            저장하기
          </Button>
        </div>

        {/* Mobile Step Indicator */}
        <div className="flex border-t border-border md:hidden">
          {editorSteps.map((step) => {
            const isActive = editorStep === step.id
            return (
              <Link
                key={step.id}
                href={`${basePath}${step.path}`}
                className={cn(
                  'flex-1 py-2 text-center text-xs',
                  isActive ? 'border-b-2 border-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {step.name}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex flex-1">
        {/* Left Panel - Form */}
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-2xl">
            {children}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden w-[400px] border-l border-border bg-muted/30 p-6 lg:block">
          <MobilePreview />
        </div>
      </div>
    </div>
  )
}
