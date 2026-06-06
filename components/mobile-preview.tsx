'use client'

import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, sampleThemes } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { cn, getLegibleColor } from '@/lib/utils'
import { toast } from 'sonner'
import { Logo } from '@/components/logo'
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Phone, 
  Copy, 
  Share2, 
  Heart,
  Circle,
  Star,
  Navigation,
  ChevronDown,
  Image
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export function MobilePreview({ className, isSticky = true }: { className?: string; isSticky?: boolean }) {
  const { currentInvitation, themes, activeSection } = useAppStore()
  const [customFonts, setCustomFonts] = useState<any[]>([])
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)

  useEffect(() => {
    if (activeSection) {
      const element = document.getElementById(`preview-section-${activeSection}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeSection])

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const { data } = await supabase.from('settings').select('*').eq('key', 'fonts')
        if (data && data.length > 0 && data[0].value) {
          setCustomFonts(data[0].value)
        }
      } catch (err) {
        console.error('Error fetching fonts in MobilePreview:', err)
      }
    }
    loadFonts()
  }, [])
  
  // Load themes from DB list, then fallback to sampleThemes
  const theme = themes.find(t => t.id === currentInvitation?.themeId) || sampleThemes.find(t => t.id === currentInvitation?.themeId) || sampleThemes[0]
  const colorSet = theme?.colorSets?.find(c => c.id === currentInvitation?.colorSet) || theme?.colorSets?.[0]
  const fontSet = theme?.fontSets?.find(f => f.id === currentInvitation?.fontSet) || theme?.fontSets?.[0]
  
  // Styles with fallbacks
  const themeStyles = {
    ...theme?.styles,
    ...(currentInvitation?.customStyles || {})
  }

  const bgColor = themeStyles.backgroundColor || colorSet?.colors?.[0] || '#faf9f7'
  const rawAccentColor = themeStyles.primaryColor || colorSet?.colors?.[1] || '#c4a574'
  const rawTextColor = themeStyles.textColor || colorSet?.colors?.[2] || '#3d3d3d'
  const rawSecondaryTextColor = themeStyles.secondaryTextColor || '#8a8a8a'

  const accentColor = getLegibleColor(bgColor, rawAccentColor, false)
  const textColor = getLegibleColor(bgColor, rawTextColor, true)
  const secondaryTextColor = getLegibleColor(bgColor, rawSecondaryTextColor, false)
  const fontClass = fontSet?.id === 'serif' ? 'font-serif' : 'font-sans'

  const borderRadius = themeStyles.borderRadius || '8px'
  const sectionSpacing = themeStyles.sectionSpacing || 'py-12'
  const cardBg = themeStyles.cardBg || 'bg-white/40'
  const cardShadow = themeStyles.cardShadow || 'shadow-sm'
  const dividerType = themeStyles.dividerType || 'heart'
  const heroStyle = themeStyles.heroStyle || 'center'
  const heroConnector = themeStyles.heroConnector === 'none_clear' ? '&' : (themeStyles.heroConnector || '&')
  const accountLayout = themeStyles.accountLayout || '1col'

  const fontKr = themeStyles.fontKr || fontSet?.fonts?.[0] || 'font-serif'
  const fontEn = themeStyles.fontEn || fontSet?.fonts?.[1] || 'font-serif'

  const getFontFamily = (krFont: string, enFont: string) => {
    let enFamily = '';
    if (enFont.startsWith('font-')) {
      enFamily = enFont === 'font-serif' ? "'Playfair Display', Lora, Georgia" : "Inter, Montserrat, Arial";
    } else {
      enFamily = `'${enFont}'`;
    }

    let krFamily = '';
    if (krFont.startsWith('font-')) {
      krFamily = krFont === 'font-serif' ? "'Noto Serif KR', 'Nanum Myeongjo'" : "'Pretendard', 'Noto Sans KR'";
    } else {
      krFamily = `'${krFont}'`;
    }

    const isSerif = enFont.toLowerCase().includes('serif') || 
                    krFont.toLowerCase().includes('serif') || 
                    krFont.toLowerCase().includes('myeongjo') || 
                    enFont.toLowerCase().includes('playfair') || 
                    enFont.toLowerCase().includes('lora') ||
                    enFont.toLowerCase().includes('cormorant') ||
                    enFont.toLowerCase().includes('baskerville') ||
                    krFont === 'font-serif' || 
                    enFont === 'font-serif';
    const genericFallback = isSerif ? 'serif' : 'sans-serif';
    return `${enFamily}, ${krFamily}, ${genericFallback}`;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("클립보드에 계좌번호가 복사되었습니다.")
  }

  const getDDayString = (dateStr: string) => {
    if (!dateStr) return null
    const wedding = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    wedding.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffTime = wedding.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'D-Day'
    if (diffDays > 0) return `D-${diffDays}`
    return `D+${Math.abs(diffDays)}`
  }

  
  // Default section order if missing
  const rawOrder = themeStyles.sectionOrder || defaultOrder
  const sectionOrder = rawOrder.includes('sequence')
    ? rawOrder
    : (() => {
        const idx = rawOrder.indexOf('greeting')
        const newOrder = [...rawOrder]
        newOrder.splice(idx !== -1 ? idx + 1 : 2, 0, 'sequence')
        return newOrder
      })()

  // Generate calendar days
  const getCalendarDays = (dateStr: string) => {
    if (!dateStr) return { year: 2025, month: 3, day: 15, days: [] }
    const date = new Date(dateStr + 'T00:00:00')
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const targetDay = date.getDate()
    
    const firstDay = new Date(year, month - 1, 1)
    const startOfWeek = firstDay.getDay()
    
    const totalDays = new Date(year, month, 0).getDate()
    
    const days = []
    for (let i = 0; i < startOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i)
    }
    
    return { year, month, day: targetDay, days }
  }

  const { year: calYear, month: calMonth, day: calDay, days: calDays } = getCalendarDays(currentInvitation?.weddingDate || '')

  return (
    <div className={cn(isSticky && "sticky top-24", className)}>
      <div 
        className="relative mx-auto overflow-hidden rounded-[40px] border-8 border-foreground/10 bg-foreground/5 shadow-2xl"
        style={{ width: '320px', height: '640px' }}
      >
        {/* Phone notch */}
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/10" />
        
        {/* Screen content */}
        <ScrollArea className="h-full w-full rounded-[32px]" style={{ backgroundColor: bgColor }}>
          {/* Dynamic Style injection for custom fonts */}
          <style dangerouslySetInnerHTML={{
            __html: (() => {
              const defaultGoogleFonts = `@import url('https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&family=Cinzel:wght@400..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@200..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quicksand:wght@300..700&display=swap');`;
              const imports = customFonts
                .filter(f => f.type === 'embed')
                .map(f => (f.embedCode || '').replace(/<\/?style>/gi, ''))
                .join('\n');
              const directImports = customFonts
                .filter(f => f.url)
                .map(f => `@import url('${f.url}');`)
                .join('\n');
              const fontFaces = customFonts
                .filter(f => f.type === 'file' && f.fileUrl)
                .map(f => `
                  @font-face {
                    font-family: '${f.family}';
                    src: url('/api/fonts?url=${encodeURIComponent(f.fileUrl)}') format('truetype');
                    font-display: swap;
                  }
                `)
                .join('\n');
              return `${defaultGoogleFonts}\n${imports}\n${directImports}\n${fontFaces}`;
            })()
          }} />

          <div className={cn("pb-12 text-center select-none", fontClass)} style={{ color: textColor, fontFamily: getFontFamily(fontKr, fontEn) }}>
            
            {sectionOrder.map((sectionId, idx) => {
              // Layout-specific styling rules
              const isMinimal = theme.layout === 'minimal'
              const isGrid = theme.layout === 'grid'
              const isTwoColumn = theme.layout === 'two-column'

              const borderStyle = { borderRadius: isGrid ? '0px' : borderRadius }
              const shadowClass = isMinimal ? 'shadow-none' : cardShadow
              
              let spacingClass = sectionSpacing // py-8, py-12, py-16, py-20
              if (isMinimal) {
                if (sectionSpacing === 'py-8') spacingClass = 'py-16'
                else if (sectionSpacing === 'py-12') spacingClass = 'py-24'
                else if (sectionSpacing === 'py-16') spacingClass = 'py-32'
                else if (sectionSpacing === 'py-20') spacingClass = 'py-40'
              }

              const isEven = idx % 2 === 0
              const sectionBg = isMinimal ? 'bg-transparent' : (isEven ? 'bg-white/40 backdrop-blur-sm' : 'bg-black/5')
              const sectionBorderClass = isGrid ? 'border border-current/15 mx-2 my-2' : ''
              const effectiveCardBg = isMinimal ? 'bg-transparent' : cardBg
              const showDivider = idx > 0
              
              const renderDivider = () => {
                if (dividerType === 'line') {
                  return <div className="mx-auto my-6 h-px w-24 bg-current opacity-20" />
                }
                if (dividerType === 'heart') {
                  return <div className="text-center opacity-40 my-6 text-[10px]" style={{ color: accentColor }}>♥</div>
                }
                if (dividerType === 'space') {
                  return <div className="my-6 h-4" />
                }
                return null
              }

              switch (sectionId) {
                case 'hero':
                  return (
                    <div key="hero" id="preview-section-hero" className="relative h-[560px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                      {currentInvitation?.mainImage && (
                        <div className="absolute inset-0 z-0">
                          <img
                            src={currentInvitation.mainImage}
                            alt="Main Visual"
                            className="w-full h-full object-cover opacity-20"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundImage: `linear-gradient(to top, ${bgColor}, transparent, ${bgColor}80)` }} />
                        </div>
                      )}
                      <div className="space-y-6 z-10 w-full">
                        <p className="text-xs tracking-[0.3em] opacity-60">WEDDING INVITATION</p>
                        
                        {heroStyle === 'left' ? (
                          <div className="space-y-4 text-left px-4 w-full">
                            <div className="space-y-1">
                              {currentInvitation?.groomParentRelation && (
                                <p className="text-[10px] opacity-75">{currentInvitation.groomParentRelation}</p>
                              )}
                              <h1 className="text-2xl font-light tracking-wide">
                                {currentInvitation?.groomName || '신랑'}
                              </h1>
                            </div>
                            {heroConnector !== 'none' && <div className="text-lg opacity-60 font-light" style={{ color: accentColor }}>{heroConnector}</div>}
                            <div className="space-y-1">
                              {currentInvitation?.brideParentRelation && (
                                <p className="text-[10px] opacity-75">{currentInvitation.brideParentRelation}</p>
                              )}
                              <h1 className="text-2xl font-light tracking-wide">
                                {currentInvitation?.brideName || '신부'}
                              </h1>
                            </div>
                          </div>
                        ) : heroStyle === 'classic' ? (
                          <div className="space-y-4 text-center w-full">
                            <h1 className="text-3xl font-light tracking-widest uppercase">
                              {currentInvitation?.groomNameEn || 'GROOM'}
                              {heroConnector !== 'none' && <span className="block text-sm opacity-55 my-1" style={{ color: accentColor }}>{heroConnector}</span>}
                              {currentInvitation?.brideNameEn || 'BRIDE'}
                            </h1>
                            <div className="w-8 h-px bg-current opacity-30 mx-auto" />
                            <p className="text-sm tracking-wide">
                              {currentInvitation?.groomName || '신랑'} · {currentInvitation?.brideName || '신부'}
                            </p>
                          </div>
                        ) : (
                          // Default: Center
                          <div className="space-y-4">
                            <div className="space-y-1">
                              {currentInvitation?.groomParentRelation && (
                                <p className="text-[10px] opacity-75">{currentInvitation.groomParentRelation}</p>
                              )}
                              <h1 className="text-2xl font-light tracking-wide">
                                {currentInvitation?.groomName || '신랑'}
                              </h1>
                            </div>
                            {heroConnector !== 'none' && <div className="text-lg opacity-60 font-light" style={{ color: accentColor }}>{heroConnector}</div>}
                            <div className="space-y-1">
                              {currentInvitation?.brideParentRelation && (
                                <p className="text-[10px] opacity-75">{currentInvitation.brideParentRelation}</p>
                              )}
                              <h1 className="text-2xl font-light tracking-wide">
                                {currentInvitation?.brideName || '신부'}
                              </h1>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1 opacity-80 text-xs pt-4 border-t border-current/10 max-w-[180px] mx-auto">
                          <p>
                            {currentInvitation?.weddingDate ? (
                              format(new Date(currentInvitation.weddingDate + 'T00:00:00'), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
                            ) : '2025년 00월 00일'}
                          </p>
                          <p>{currentInvitation?.weddingTime || '오후 12:00'}</p>
                          <p className="truncate">{currentInvitation?.venueName || '예식장명'}{currentInvitation?.venueHall ? ' ' + currentInvitation.venueHall : ''}</p>
                        </div>
                      </div>
                      <div className="absolute bottom-6 animate-bounce z-10">
                        <ChevronDown className="w-4 h-4 opacity-55" style={{ color: accentColor }} />
                      </div>
                    </div>
                  )
                
                case 'greeting':
                  const greetingIconShape = currentInvitation?.customStyles?.greetingIconShape || 'heart'
                  const greetingIconColor = currentInvitation?.customStyles?.greetingIconColor || accentColor
                  const greetingIconCustomUrl = currentInvitation?.customStyles?.greetingIconCustomUrl
                  const isGreetingCustomSvg = greetingIconCustomUrl?.toLowerCase().split('?')[0].endsWith('.svg') ?? false

                  const renderGreetingIcon = () => {
                    if (greetingIconShape === 'custom' && greetingIconCustomUrl) {
                      if (isGreetingCustomSvg) {
                        return (
                          <div 
                            className="w-5 h-5 mx-auto mb-4 opacity-60 pointer-events-none"
                            style={{
                              backgroundColor: greetingIconColor,
                              WebkitMaskImage: `url(${greetingIconCustomUrl})`,
                              maskImage: `url(${greetingIconCustomUrl})`,
                              WebkitMaskSize: 'contain',
                              maskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              maskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              maskPosition: 'center',
                            }}
                          />
                        )
                      } else {
                        return (
                          <img 
                            src={greetingIconCustomUrl} 
                            alt="custom greeting icon" 
                            className="w-5 h-5 mx-auto mb-4 object-contain opacity-80"
                          />
                        )
                      }
                    }

                    if (greetingIconShape === 'circle') {
                      return <Circle className="w-5 h-5 mx-auto mb-4 opacity-60" style={{ color: greetingIconColor }} />
                    }
                    if (greetingIconShape === 'star') {
                      return <Star className="w-5 h-5 mx-auto mb-4 opacity-60" style={{ color: greetingIconColor }} />
                    }
                    return <Heart className="w-5 h-5 mx-auto mb-4 opacity-60" style={{ color: greetingIconColor }} />
                  }

                  return (
                    <section key="greeting" id="preview-section-greeting" className={cn(spacingClass, "px-6 text-center", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      {renderGreetingIcon()}
                      <p className="leading-relaxed whitespace-pre-line text-xs opacity-80 mb-6">
                        {currentInvitation?.invitationMessage || '초대의 말씀을 드립니다.\n이곳에 초대글이 표시됩니다.'}
                      </p>
                    </section>
                  )

                case 'sequence':
                  const sequenceEnabled = currentInvitation?.customStyles?.sequenceEnabled ?? false
                  if (!sequenceEnabled) return null
                  const sequenceTitle = currentInvitation?.customStyles?.sequenceTitle || '식순 안내'
                  const sequenceSubtitle = currentInvitation?.customStyles?.sequenceSubtitle || 'WEDDING ORDER'
                  const sequenceEvents = currentInvitation?.customStyles?.sequenceEvents || [
                    { id: '1', time: '12:00', title: '식전 영상 상영' },
                    { id: '2', time: '12:10', title: '개식 및 화촉점화' },
                    { id: '3', time: '12:20', title: '신랑 신부 입장' },
                    { id: '4', time: '12:30', title: '혼인서약 및 성혼선언' },
                    { id: '5', time: '12:45', title: '축가 및 하객 인사' },
                    { id: '6', time: '13:00', title: '신랑 신부 행진 및 폐식' }
                  ]

                  return (
                    <section key="sequence" id="preview-section-sequence" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-2">{sequenceTitle}</h2>
                      <p className="text-center text-[10px] opacity-40 mb-6">{sequenceSubtitle}</p>
                      
                      <div className="relative border-l border-current/15 ml-4 pl-6 space-y-4 text-left max-w-[200px] mx-auto">
                        {sequenceEvents.map((event: any) => (
                          <div key={event.id} className="relative">
                            {/* Dot */}
                            <div className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-current opacity-70 border border-background" style={{ backgroundColor: accentColor }} />
                            <div>
                              <span className="font-mono text-[10px] font-semibold" style={{ color: accentColor }}>{event.time}</span>
                              <p className="text-xs font-medium mt-0.5">{event.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )

                case 'gallery':
                  if (!currentInvitation?.galleryImages || currentInvitation.galleryImages.length === 0) return null
                  const isSlide = currentInvitation?.galleryViewType === 'slide'
                  return (
                    <section key="gallery" id="preview-section-gallery" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-6">GALLERY</h2>
                      {isSlide ? (
                        <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-2 px-1">
                          {currentInvitation.galleryImages.map((img: string, idx: number) => (
                            <div key={idx} className={cn("w-4/5 aspect-[4/3] flex-shrink-0 snap-center overflow-hidden bg-black/10", shadowClass)} style={borderStyle}>
                              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={cn("grid gap-1.5", isTwoColumn ? "grid-cols-3" : "grid-cols-2")}>
                          {currentInvitation.galleryImages.map((img: string, idx: number) => (
                            <div key={idx} className={cn("aspect-square overflow-hidden bg-black/10", shadowClass)} style={borderStyle}>
                              <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )

                case 'calendar':
                  if (!currentInvitation?.weddingDate) return null
                  const ddayEnabled = currentInvitation.customStyles?.ddayEnabled ?? false
                  return (
                    <section key="calendar" id="preview-section-calendar" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className={cn("text-center text-xs font-semibold tracking-wider", ddayEnabled ? "mb-1" : "mb-6")}>CALENDAR</h2>
                      {ddayEnabled && (
                        <div 
                          className="text-center text-[11px] font-bold tracking-wider mb-4 animate-pulse" 
                          style={{ color: accentColor }}
                        >
                          {getDDayString(currentInvitation.weddingDate)}
                        </div>
                      )}
                      <Card className={cn("border-0 shadow-none", effectiveCardBg)} style={borderStyle}>
                        <CardContent className="p-4">
                          <div className="text-center mb-2">
                            <p className="text-sm font-medium" style={{ color: accentColor }}>{calMonth}</p>
                            <p className="text-[10px] opacity-40">{calYear}</p>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                              <div key={day} className="py-1 opacity-55 font-semibold">{day}</div>
                            ))}
                            {calDays.map((day, i) => {
                              if (day === null) return <div key={`empty-${i}`} />
                              const isWeddingDay = day === calDay
                              
                              if (isWeddingDay) {
                                const shapeType = currentInvitation.customStyles?.calendarDayShape || 'circle'
                                const customShapeUrl = currentInvitation.customStyles?.calendarDayCustomShapeUrl
                                const highlightTextColor = currentInvitation.customStyles?.calendarDayTextColor || '#ffffff'
                                
                                if (shapeType === 'custom' && customShapeUrl) {
                                  const isSvg = customShapeUrl.toLowerCase().split('?')[0].endsWith('.svg')
                                  return (
                                    <div
                                      key={i}
                                      className="relative py-1 text-[10px] flex items-center justify-center w-6 h-6 mx-auto font-bold"
                                      style={{ color: highlightTextColor }}
                                    >
                                      {isSvg ? (
                                        <div 
                                          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                                          style={{
                                            backgroundColor: currentInvitation.customStyles?.calendarDaySvgColor || accentColor,
                                            WebkitMaskImage: `url(${customShapeUrl})`,
                                            maskImage: `url(${customShapeUrl})`,
                                            WebkitMaskSize: 'contain',
                                            maskSize: 'contain',
                                            WebkitMaskRepeat: 'no-repeat',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            maskPosition: 'center',
                                          }}
                                        />
                                      ) : (
                                        <img 
                                          src={customShapeUrl} 
                                          alt="wedding day mark" 
                                          className="absolute inset-0 w-full h-full object-contain z-0 pointer-events-none"
                                        />
                                      )}
                                      <span className="relative z-10">{day}</span>
                                    </div>
                                  )
                                }
                                
                                if (shapeType === 'heart') {
                                  return (
                                    <div
                                      key={i}
                                      className="relative py-1 text-[10px] flex items-center justify-center w-6 h-6 mx-auto font-bold"
                                      style={{ color: highlightTextColor }}
                                    >
                                      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none fill-current" viewBox="0 0 24 24" style={{ color: accentColor }}>
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                      </svg>
                                      <span className="relative z-10">{day}</span>
                                    </div>
                                  )
                                }
                                
                                return (
                                  <div
                                    key={i}
                                    className="relative py-1 text-[10px] flex items-center justify-center w-6 h-6 mx-auto rounded-full font-bold"
                                    style={{ backgroundColor: accentColor, color: highlightTextColor }}
                                  >
                                    <span className="relative z-10">{day}</span>
                                  </div>
                                )
                              }
                              
                              return (
                                <div
                                  key={i}
                                  className="py-1 text-[10px] flex items-center justify-center w-6 h-6 mx-auto text-center"
                                  style={{ color: secondaryTextColor }}
                                >
                                  {day}
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-4 text-center text-[10px] opacity-80">
                            <p className="font-medium" style={{ color: accentColor }}>
                              {format(new Date(currentInvitation.weddingDate + 'T00:00:00'), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                            </p>
                            <p className="mt-0.5">{currentInvitation.weddingTime}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  )

                case 'location':
                  return (
                    <section key="location" id="preview-section-location" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-6">LOCATION</h2>
                      <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                        <CardContent className="p-4 text-left space-y-3">
                          <div>
                            <h3 className="font-semibold text-xs">{currentInvitation?.venueName || '예식장명'}</h3>
                            {currentInvitation?.venueHall && <p className="text-[10px]" style={{ color: accentColor }}>{currentInvitation.venueHall}</p>}
                            <p className="text-[10px] mt-0.5" style={{ color: secondaryTextColor }}>{currentInvitation?.venueAddress || '주소를 입력해주세요.'}</p>
                          </div>

                          {/* Traffic Info & Parking Info */}
                          {(currentInvitation?.trafficInfo || currentInvitation?.parkingInfo || currentInvitation?.customStyles?.subwayImage || currentInvitation?.customStyles?.parkingImage) && (
                            <div className="space-y-3 pt-3 border-t border-gray-100/10 text-[10px]">
                              {(currentInvitation.trafficInfo || currentInvitation.customStyles?.subwayImage) && (
                                <div>
                                  <p className="font-semibold">교통 안내</p>
                                  {currentInvitation.trafficInfo && (
                                    <p className="whitespace-pre-line mt-0.5 leading-relaxed" style={{ color: secondaryTextColor }}>{currentInvitation.trafficInfo}</p>
                                  )}
                                  {currentInvitation.customStyles?.subwayImage && (
                                    currentInvitation.customStyles.subwayDisplayType === 'direct' ? (
                                      <div className="mt-1.5 rounded overflow-hidden bg-black/5 dark:bg-white/5 border border-border/50">
                                        <img 
                                          src={currentInvitation.customStyles.subwayImage} 
                                          className="w-full h-auto cursor-pointer" 
                                          onClick={() => setActiveImageModal(currentInvitation.customStyles.subwayImage)}
                                        />
                                      </div>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => setActiveImageModal(currentInvitation.customStyles.subwayImage)}
                                        className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 border border-border/30 rounded-[4px] text-[8px] font-medium hover:bg-black/10 transition-colors"
                                        style={{ color: accentColor }}
                                      >
                                        <Image className="w-2.5 h-2.5" />
                                        <span>{currentInvitation.customStyles.subwayButtonText || '이미지 보기'}</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                              {(currentInvitation.parkingInfo || currentInvitation.customStyles?.parkingImage) && (
                                <div>
                                  <p className="font-semibold">주차 안내</p>
                                  {currentInvitation.parkingInfo && (
                                    <p className="whitespace-pre-line mt-0.5 leading-relaxed" style={{ color: secondaryTextColor }}>{currentInvitation.parkingInfo}</p>
                                  )}
                                  {currentInvitation.customStyles?.parkingImage && (
                                    currentInvitation.customStyles.parkingDisplayType === 'direct' ? (
                                      <div className="mt-1.5 rounded overflow-hidden bg-black/5 dark:bg-white/5 border border-border/50">
                                        <img 
                                          src={currentInvitation.customStyles.parkingImage} 
                                          className="w-full h-auto cursor-pointer" 
                                          onClick={() => setActiveImageModal(currentInvitation.customStyles.parkingImage)}
                                        />
                                      </div>
                                    ) : (
                                      <button 
                                        type="button"
                                        onClick={() => setActiveImageModal(currentInvitation.customStyles.parkingImage)}
                                        className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-black/5 dark:bg-white/5 border border-border/30 rounded-[4px] text-[8px] font-medium hover:bg-black/10 transition-colors"
                                        style={{ color: accentColor }}
                                      >
                                        <Image className="w-2.5 h-2.5" />
                                        <span>{currentInvitation.customStyles.parkingButtonText || '이미지 보기'}</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex gap-1.5 pt-1">
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 px-0" style={borderStyle}>
                              <Navigation className="w-3 h-3 mr-1" />
                              네이버지도
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7 px-0" style={borderStyle}>
                              <Navigation className="w-3 h-3 mr-1" />
                              카카오맵
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  )

                case 'contact':
                  if (!currentInvitation?.contacts || currentInvitation.contacts.length === 0) return null
                  return (
                    <section key="contact" id="preview-section-contact" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-6">CONTACT</h2>
                      <div className="grid grid-cols-2 gap-2">
                        {currentInvitation.contacts.map((contact: any) => (
                          <Card key={contact.id} className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                            <CardContent className="p-3 text-center">
                              <p className="text-[10px] mb-0.5" style={{ color: secondaryTextColor }}>
                                {contact.relation === 'groom' ? '신랑' :
                                 contact.relation === 'bride' ? '신부' :
                                 contact.relation === 'groomParent' ? '신랑 혼주' :
                                 contact.relation === 'brideParent' ? '신부 혼주' :
                                 contact.relation}
                              </p>
                              <p className="font-semibold text-xs mb-2 truncate">{contact.name}</p>
                              <Button variant="outline" size="sm" className="w-full text-[10px] h-7 px-0" style={borderStyle}>
                                <Phone className="w-3 h-3 mr-1" />
                                전화
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  )

                case 'account':
                  if (!currentInvitation?.bankAccounts || currentInvitation.bankAccounts.length === 0) return null
                  const accountsList = currentInvitation.bankAccounts || []
                  const groomAccounts = accountsList.filter((acc: any) => acc.relation === 'groom' || acc.relation === 'groomParent')
                  const brideAccounts = accountsList.filter((acc: any) => acc.relation === 'bride' || acc.relation === 'brideParent')

                  return (
                    <section key="account" id="preview-section-account" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-2">ACCOUNT</h2>
                      <p className="text-center text-[10px] opacity-40 mb-6">마음 전하실 곳</p>
                      
                      {accountLayout === '2col' ? (
                        <div className="grid grid-cols-2 gap-2 text-left items-start">
                          {/* 신랑측 */}
                          <div className="space-y-1.5">
                            <div className="text-center text-[9px] font-semibold pb-1 border-b opacity-80" style={{ color: accentColor, borderColor: `${accentColor}20` }}>신랑측</div>
                            {groomAccounts.map((account: any) => (
                              <Card 
                                key={account.id} 
                                className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors", effectiveCardBg, shadowClass)} 
                                style={borderStyle}
                                onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                              >
                                <CardContent className="p-1.5 px-2 text-left flex flex-col justify-center min-h-[38px] space-y-0">
                                  <div className="flex justify-between items-center w-full text-[8px] leading-tight">
                                    <span style={{ color: secondaryTextColor }}>
                                      {account.relation === 'groom' ? '신랑' : '신랑 혼주'}
                                    </span>
                                    <span className="font-semibold truncate max-w-[55px]">{account.accountHolder}</span>
                                  </div>
                                  <div className="flex justify-between items-center w-full mt-0.5 text-[8px] leading-none">
                                    <span className="font-mono truncate max-w-[85px]">{account.accountNumber}</span>
                                    <span className="opacity-80 truncate max-w-[45px] text-[7.5px]" style={{ color: secondaryTextColor }}>{account.bank}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {groomAccounts.length === 0 && (
                              <p className="text-center text-[8px] opacity-30 py-3">등록 계좌 없음</p>
                            )}
                          </div>
                          {/* 신부측 */}
                          <div className="space-y-1.5">
                            <div className="text-center text-[9px] font-semibold pb-1 border-b opacity-80" style={{ color: accentColor, borderColor: `${accentColor}20` }}>신부측</div>
                            {brideAccounts.map((account: any) => (
                              <Card 
                                key={account.id} 
                                className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors", effectiveCardBg, shadowClass)} 
                                style={borderStyle}
                                onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                              >
                                <CardContent className="p-1.5 px-2 text-left flex flex-col justify-center min-h-[38px] space-y-0">
                                  <div className="flex justify-between items-center w-full text-[8px] leading-tight">
                                    <span style={{ color: secondaryTextColor }}>
                                      {account.relation === 'bride' ? '신부' : '신부 혼주'}
                                    </span>
                                    <span className="font-semibold truncate max-w-[55px]">{account.accountHolder}</span>
                                  </div>
                                  <div className="flex justify-between items-center w-full mt-0.5 text-[8px] leading-none">
                                    <span className="font-mono truncate max-w-[85px]">{account.accountNumber}</span>
                                    <span className="opacity-80 truncate max-w-[45px] text-[7.5px]" style={{ color: secondaryTextColor }}>{account.bank}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {brideAccounts.length === 0 && (
                              <p className="text-center text-[8px] opacity-30 py-3">등록 계좌 없음</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // 1열 배치 (1col)
                        <div className="space-y-2">
                          {accountsList.map((account: any) => (
                            <Card 
                              key={account.id} 
                              className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors", effectiveCardBg, shadowClass)} 
                              style={borderStyle}
                              onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                            >
                              <CardContent className="p-3 text-left">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px]" style={{ color: secondaryTextColor }}>
                                      {account.relation === 'groom' && '신랑'}
                                      {account.relation === 'bride' && '신부'}
                                      {account.relation === 'groomParent' && '신랑 혼주'}
                                      {account.relation === 'brideParent' && '신부 혼주'}
                                    </p>
                                    <p className="font-semibold text-xs mt-0.5">{account.bank} {account.accountNumber}</p>
                                    <p className="text-[10px] mt-0.5" style={{ color: secondaryTextColor }}>예금주: {account.accountHolder}</p>
                                  </div>
                                  <div className="text-[9px] opacity-40 flex items-center justify-center">
                                    <Copy className="w-3.5 h-3.5 opacity-70" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </section>
                  )

                case 'rsvp':
                  if (!currentInvitation?.rsvpEnabled) return null
                  return (
                    <section key="rsvp" id="preview-section-rsvp" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-2">RSVP</h2>
                      <p className="text-center text-[10px] opacity-40 mb-6">참석 여부를 알려주세요</p>
                      <Button className="w-full text-xs text-white" style={{ backgroundColor: accentColor, ...borderStyle }}>
                        <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                        참석 의사 전달하기
                      </Button>
                    </section>
                  )

                case 'guestbook':
                  if (currentInvitation?.guestbookType === 'none' || currentInvitation?.guestbookType === undefined) return null
                  return (
                    <section key="guestbook" id="preview-section-guestbook" className={cn(spacingClass, "px-6", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                      {showDivider && renderDivider()}
                      <h2 className="text-center text-xs font-semibold tracking-wider mb-6">GUESTBOOK</h2>
                      <div className="space-y-2 text-left">
                        <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-[10px]">하객 성함</span>
                              <span className="text-[9px] opacity-40">2026.06.03</span>
                            </div>
                            <p className="text-[10px] opacity-70">결혼을 진심으로 축하드립니다!</p>
                          </CardContent>
                        </Card>
                      </div>
                      <Button variant="outline" className="w-full mt-3 text-[10px] h-8 border-current/30" style={borderStyle}>
                        축하 메시지 남기기
                      </Button>
                    </section>
                  )

                default:
                  return null
              }
            })}

            {/* Share Section */}
            <section className="py-6 px-6 bg-transparent text-center">
              <Button variant="ghost" className="text-[10px] h-auto p-0 text-muted-foreground opacity-60 hover:opacity-100 hover:bg-transparent gap-1">
                <Share2 className="w-3 h-3" />
                청첩장 주소 복사하기
              </Button>
            </section>

            {/* Footer */}
            <footer className="py-6 px-6 text-center opacity-30 text-[9px] tracking-wider flex justify-center">
              <Logo className="h-3.5 w-auto text-current" />
            </footer>
            
          </div>
        </ScrollArea>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">실시간 미리보기</p>
      {activeImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto cursor-pointer" 
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={activeImageModal} alt="Popup Image" className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl" />
            <button 
              className="absolute -top-10 right-0 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 w-8 h-8 flex items-center justify-center font-bold text-sm"
              onClick={() => setActiveImageModal(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
