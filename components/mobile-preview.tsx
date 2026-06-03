'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, sampleThemes } from '@/lib/store'

export function MobilePreview() {
  const { currentInvitation } = useAppStore()
  
  const theme = sampleThemes.find(t => t.id === currentInvitation?.themeId) || sampleThemes[0]
  const colorSet = theme.colorSets.find(c => c.id === currentInvitation?.colorSet) || theme.colorSets[0]
  
  const bgColor = colorSet?.colors[0] || '#FFFFFF'
  const accentColor = colorSet?.colors[1] || '#F0F0F0'
  const textColor = colorSet?.colors[2] || '#2C2C2C'

  return (
    <div className="sticky top-24">
      <div 
        className="relative mx-auto overflow-hidden rounded-[40px] border-8 border-foreground/10 bg-foreground/5 shadow-2xl"
        style={{ width: '320px', height: '640px' }}
      >
        {/* Phone notch */}
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/10" />
        
        {/* Screen content */}
        <ScrollArea className="h-full w-full rounded-[32px]" style={{ backgroundColor: bgColor }}>
          <div className="px-6 pb-12 pt-12" style={{ color: textColor }}>
            {/* Header */}
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs tracking-[0.3em] opacity-60">WEDDING INVITATION</p>
              <div className="mx-auto my-4 h-px w-12 bg-current opacity-30" />
            </div>

            {/* Names */}
            <div className="mb-12 text-center">
              <h1 className="mb-2 font-serif text-2xl font-light tracking-wide">
                {currentInvitation?.groomName || '신랑'}
              </h1>
              <p className="mb-4 text-xs tracking-[0.2em] opacity-60">
                {currentInvitation?.groomNameEn || 'GROOM'}
              </p>
              <div className="my-4 flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-current opacity-30" />
                <span className="font-serif text-lg" style={{ color: accentColor !== bgColor ? accentColor : textColor }}>
                  &amp;
                </span>
                <div className="h-px w-8 bg-current opacity-30" />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-light tracking-wide">
                {currentInvitation?.brideName || '신부'}
              </h1>
              <p className="text-xs tracking-[0.2em] opacity-60">
                {currentInvitation?.brideNameEn || 'BRIDE'}
              </p>
            </div>

            {/* Main Image Placeholder */}
            <div 
              className="mx-auto mb-12 aspect-[3/4] w-full max-w-[240px] rounded-sm"
              style={{ backgroundColor: accentColor }}
            >
              {currentInvitation?.mainImage ? (
                <img 
                  src={currentInvitation.mainImage} 
                  alt="메인 사진" 
                  className="h-full w-full rounded-sm object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs opacity-40" style={{ color: textColor }}>메인 사진</p>
                </div>
              )}
            </div>

            {/* Invitation Message */}
            <div className="mb-12 text-center">
              <p className="whitespace-pre-line font-serif text-sm leading-loose opacity-80">
                {currentInvitation?.invitationMessage || '초대의 말씀을\n입력해주세요.'}
              </p>
            </div>

            {/* Date & Time */}
            <div className="mb-12 rounded-sm p-6 text-center" style={{ backgroundColor: accentColor }}>
              <p className="mb-2 text-xs tracking-[0.2em] opacity-60">DATE</p>
              <p className="font-serif text-lg">
                {currentInvitation?.weddingDate 
                  ? new Date(currentInvitation.weddingDate).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })
                  : '2025년 0월 0일 토요일'}
              </p>
              <p className="mt-1 text-sm opacity-60">
                {currentInvitation?.weddingTime || '오후 0시'}
              </p>
            </div>

            {/* Venue */}
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs tracking-[0.2em] opacity-60">LOCATION</p>
              <p className="font-serif text-base">
                {currentInvitation?.venueName || '예식장명'}
              </p>
              <p className="mt-1 text-sm opacity-60">
                {currentInvitation?.venueHall || '층/홀 이름'}
              </p>
              <p className="mt-2 text-xs opacity-50">
                {currentInvitation?.venueAddress || '주소를 입력해주세요'}
              </p>
            </div>

            {/* Parent Relations */}
            <div className="text-center">
              <div className="mb-4">
                <p className="text-xs opacity-60">{currentInvitation?.groomParentRelation || '신랑 혼주 정보'}</p>
              </div>
              <div>
                <p className="text-xs opacity-60">{currentInvitation?.brideParentRelation || '신부 혼주 정보'}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">실시간 미리보기</p>
    </div>
  )
}
