'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore, sampleThemes } from '@/lib/store'
import { ArrowLeft, CreditCard, Copy, Check, ExternalLink } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const { currentInvitation, updateCurrentInvitation, saveInvitation } = useAppStore()
  const invitationId = params.id as string
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [copied, setCopied] = useState(false)

  const theme = sampleThemes.find(t => t.id === currentInvitation?.themeId) || sampleThemes[0]
  const colorSet = theme.colorSets.find(c => c.id === currentInvitation?.colorSet) || theme.colorSets[0]
  
  const publishedUrl = `https://vow.seoul/inv/${invitationId}`

  const handleBack = () => {
    router.push(`/editor/${invitationId}/features`)
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setIsPaid(true)
    setIsPaymentOpen(false)
    updateCurrentInvitation({ status: 'published', publishedUrl })
    await saveInvitation()
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publishedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('URL 복사에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">결제 및 발행</h1>
        <p className="mt-1 text-muted-foreground">
          최종 시안을 확인하고 결제를 진행해주세요.
        </p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최종 시안 미리보기</CardTitle>
          <CardDescription>완성된 청첩장을 확인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-border shadow-lg"
            style={{ backgroundColor: colorSet.colors[0] }}
          >
            <ScrollArea className="h-[500px]">
              <div className="p-6 text-center" style={{ color: colorSet.colors[2] }}>
                {/* Header */}
                <p className="mb-2 text-xs tracking-[0.3em] opacity-60">WEDDING INVITATION</p>
                <div className="mx-auto my-4 h-px w-12 bg-current opacity-30" />

                {/* Names */}
                <h1 className="mb-2 font-serif text-2xl font-light tracking-wide">
                  {currentInvitation?.groomName || '신랑'}
                </h1>
                <p className="mb-4 text-xs tracking-[0.2em] opacity-60">
                  {currentInvitation?.groomNameEn || 'GROOM'}
                </p>
                <span className="font-serif text-lg" style={{ color: colorSet.colors[1] !== colorSet.colors[0] ? colorSet.colors[1] : colorSet.colors[2] }}>
                  &amp;
                </span>
                <h1 className="mb-2 mt-4 font-serif text-2xl font-light tracking-wide">
                  {currentInvitation?.brideName || '신부'}
                </h1>
                <p className="text-xs tracking-[0.2em] opacity-60">
                  {currentInvitation?.brideNameEn || 'BRIDE'}
                </p>

                {/* Main Image */}
                <div 
                  className="mx-auto my-8 aspect-[3/4] w-full max-w-[200px] rounded-sm"
                  style={{ backgroundColor: colorSet.colors[1] }}
                >
                  {currentInvitation?.mainImage ? (
                    <img 
                      src={currentInvitation.mainImage} 
                      alt="메인 사진" 
                      className="h-full w-full rounded-sm object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-xs opacity-40">메인 사진</p>
                    </div>
                  )}
                </div>

                {/* Message */}
                <p className="whitespace-pre-line font-serif text-sm leading-loose opacity-80">
                  {currentInvitation?.invitationMessage || '초대의 말씀'}
                </p>

                {/* Date */}
                <div className="my-8 rounded-sm p-4" style={{ backgroundColor: colorSet.colors[1] }}>
                  <p className="text-xs tracking-[0.2em] opacity-60">DATE</p>
                  <p className="mt-1 font-serif">
                    {currentInvitation?.weddingDate 
                      ? new Date(currentInvitation.weddingDate).toLocaleDateString('ko-KR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'long'
                        })
                      : '2025년 0월 0일'}
                  </p>
                  <p className="mt-1 text-sm opacity-60">
                    {currentInvitation?.weddingTime || '오후 0시'}
                  </p>
                </div>

                {/* Venue */}
                <p className="text-xs tracking-[0.2em] opacity-60">LOCATION</p>
                <p className="mt-1 font-serif">
                  {currentInvitation?.venueName || '예식장명'}
                </p>
                <p className="mt-1 text-sm opacity-60">
                  {currentInvitation?.venueHall || '홀'}
                </p>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      {!isPaid ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">결제 정보</CardTitle>
            <CardDescription>청첩장 발행을 위해 결제를 진행해주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">모바일 청첩장</span>
                <span className="font-medium">50,000원</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium">총 결제금액</span>
                <span className="text-xl font-semibold">50,000원</span>
              </div>
            </div>
            <Button className="mt-4 w-full" size="lg" onClick={() => setIsPaymentOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              결제하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-800">
              <Check className="h-5 w-5" />
              발행 완료
            </CardTitle>
            <CardDescription className="text-green-700">
              청첩장이 성공적으로 발행되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white p-4">
              <p className="mb-2 text-sm text-muted-foreground">청첩장 URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm">
                  {publishedUrl}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" variant="outline">
                카카오톡 공유
              </Button>
              <Button className="flex-1" variant="outline">
                문자 공유
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          이전 단계
        </Button>
        {isPaid && (
          <Button onClick={() => router.push('/')}>
            홈으로 돌아가기
          </Button>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결제하기</DialogTitle>
            <DialogDescription>
              결제 수단을 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <button
              className="flex w-full items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">신용/체크카드</p>
                <p className="text-sm text-muted-foreground">모든 카드 결제 가능</p>
              </div>
            </button>
            <button
              className="flex w-full items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEE500]">
                <span className="text-lg font-bold">K</span>
              </div>
              <div className="text-left">
                <p className="font-medium">카카오페이</p>
                <p className="text-sm text-muted-foreground">간편결제</p>
              </div>
            </button>
            <button
              className="flex w-full items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#03C75A]">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <div className="text-left">
                <p className="font-medium">네이버페이</p>
                <p className="text-sm text-muted-foreground">간편결제</p>
              </div>
            </button>
          </div>
          {isProcessing && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              결제 처리 중...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
