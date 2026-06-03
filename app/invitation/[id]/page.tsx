"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Phone, 
  Copy, 
  Share2, 
  Heart,
  Navigation,
  ChevronDown,
  Music,
  Pause
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { sampleThemes } from "@/lib/store"
import { cn, getLegibleColor } from "@/lib/utils"

export default function InvitationViewPage() {
  const params = useParams()
  const id = params.id as string

  const [invitation, setInvitation] = useState<any>(null)
  const [themes, setThemes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showRsvp, setShowRsvp] = useState(false)
  const [attendance, setAttendance] = useState("yes")
  const [guestCount, setGuestCount] = useState("2")
  const [mealType, setMealType] = useState("korean")
  const [rsvpName, setRsvpName] = useState("")
  const [rsvpMessage, setRsvpMessage] = useState("")

  // Guestbook states
  const [guestbookMessages, setGuestbookMessages] = useState<any[]>([])
  const [newCommentName, setNewCommentName] = useState("")
  const [newCommentMessage, setNewCommentMessage] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)

  // Audio Ref & State
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [bgmUrl, setBgmUrl] = useState<string | null>(null)

  const [customFonts, setCustomFonts] = useState<any[]>([])

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const { data } = await supabase.from('settings').select('*').eq('key', 'fonts')
        if (data && data.length > 0 && data[0].value) {
          setCustomFonts(data[0].value)
        }
      } catch (err) {
        console.error('Error fetching fonts in InvitationViewPage:', err)
      }
    }
    loadFonts()
  }, [])

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        // Fetch themes
        const { data: themesData } = await supabase.from('themes').select('*')
        if (themesData) setThemes(themesData)

        // 1. Fetch invitation
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', id)
          .single()

        if (inviteError) throw inviteError

        if (inviteData) {
          setInvitation(inviteData)

          // 2. Fetch guestbook comments
          if (inviteData.guestbookType !== 'none') {
            const { data: comments, error: commentsError } = await supabase
              .from('guestbook')
              .select('*')
              .eq('invitationId', id)
              .order('createdAt', { ascending: false })

            if (!commentsError && comments) {
              setGuestbookMessages(comments)
            } else {
              // Fallback to local storage if table doesn't exist
              const localComments = JSON.parse(localStorage.getItem(`guestbook_comments_${id}`) || '[]')
              setGuestbookMessages(localComments)
            }
          }

          // 3. Set BGM URL
          if (inviteData.bgmId) {
            const { data: bgmData } = await supabase
              .from('bgms')
              .select('*')
              .eq('id', inviteData.bgmId)
              .single()

            if (bgmData && bgmData.url) {
              setBgmUrl(bgmData.url)
            } else {
              const sampleBgm = [
                { id: 'bgm1', url: '/bgm/canon.mp3' },
                { id: 'bgm2', url: '/bgm/thousand.mp3' },
                { id: 'bgm3', url: '/bgm/river.mp3' },
                { id: 'bgm4', url: '/bgm/wedding.mp3' },
                { id: 'bgm5', url: '/bgm/perfect.mp3' },
              ].find(b => b.id === inviteData.bgmId)
              if (sampleBgm) {
                setBgmUrl(sampleBgm.url)
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading invitation:", err)
        toast.error("청첩장을 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  useEffect(() => {
    if (bgmUrl && isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(bgmUrl)
        audioRef.current.loop = true
      } else if (audioRef.current.src !== bgmUrl) {
        audioRef.current.pause()
        audioRef.current = new Audio(bgmUrl)
        audioRef.current.loop = true
      }
      audioRef.current.play().catch(e => {
        console.error("Audio playback blocked by browser autocomplete policy:", e)
        setIsPlaying(false)
      })
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [bgmUrl, isPlaying])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("클립보드에 주소/계좌번호가 복사되었습니다.")
  }

  const handleRsvpSubmit = () => {
    if (!rsvpName) {
      toast.error("성함을 입력해주세요.")
      return
    }
    toast.success("참석 의사가 정상적으로 전달되었습니다.")
    setShowRsvp(false)
    setRsvpName("")
    setRsvpMessage("")
  }

  const handleAddComment = async () => {
    if (!newCommentName || !newCommentMessage) {
      toast.error("이름과 축하 메시지를 입력해주세요.")
      return
    }
    setIsSubmittingComment(true)
    const formattedDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/ /g, '').slice(0, -1) // e.g. 2026.06.03

    const newComment = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      invitationId: id,
      name: newCommentName,
      message: newCommentMessage,
      createdAt: formattedDate
    }

    try {
      const { error } = await supabase.from('guestbook').insert(newComment)
      if (error) throw error

      setGuestbookMessages([newComment, ...guestbookMessages])
      setNewCommentName("")
      setNewCommentMessage("")
      setShowCommentModal(false)
      toast.success("축하 메시지가 등록되었습니다!")
    } catch (err: any) {
      console.error("Guestbook insert error:", err)
      if (err.code === 'PGRST205' || err.message?.includes('relation') || err.message?.includes('not exist')) {
        const localCommentsKey = `guestbook_comments_${id}`
        const localComment = {
          ...newComment,
          id: 'msg-local-' + Math.random().toString(36).substring(2, 9),
        }
        const existingLocal = JSON.parse(localStorage.getItem(localCommentsKey) || '[]')
        const updatedLocal = [localComment, ...existingLocal]
        localStorage.setItem(localCommentsKey, JSON.stringify(updatedLocal))
        
        setGuestbookMessages(updatedLocal)
        setNewCommentName("")
        setNewCommentMessage("")
        setShowCommentModal(false)
        toast.success("축하 메시지가 등록되었습니다! (로컬 저장)")
      } else {
        toast.error("방명록 등록에 실패했습니다.")
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center">
        <p className="text-sm text-[#8b7355] tracking-widest animate-pulse">VOW SEOUL</p>
        <p className="text-xs text-gray-400 mt-2">청첩장을 불러오는 중입니다...</p>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center p-8 text-center">
        <p className="text-base text-gray-500">존재하지 않거나 삭제된 청첩장입니다.</p>
        <Button className="mt-4 bg-[#c4a574] text-white" onClick={() => window.close()}>
          닫기
        </Button>
      </div>
    )
  }

  const { year: calYear, month: calMonth, day: calDay, days: calDays } = getCalendarDays(invitation.weddingDate)

  // Determine theme colors and fonts dynamically
  const theme = themes.find(t => t.id === invitation?.themeId) || sampleThemes.find(t => t.id === invitation?.themeId) || sampleThemes[0]
  const colorSet = theme?.colorSets?.find(c => c.id === invitation?.colorSet) || theme?.colorSets?.[0]
  const fontSet = theme?.fontSets?.find(f => f.id === invitation?.fontSet) || theme?.fontSets?.[0]
  
  const bgColor = colorSet?.colors?.[0] || '#faf9f7'
  const rawAccentColor = colorSet?.colors?.[1] || '#c4a574'
  const rawTextColor = colorSet?.colors?.[2] || '#3d3d3d'
  const rawSecondaryTextColor = theme?.styles?.secondaryTextColor || '#8a8a8a'

  const accentColor = getLegibleColor(bgColor, rawAccentColor, false)
  const textColor = getLegibleColor(bgColor, rawTextColor, true)
  const secondaryTextColor = getLegibleColor(bgColor, rawSecondaryTextColor, false)
  const fontClass = fontSet?.id === 'serif' ? 'font-serif' : 'font-sans'

  // Dynamic style values
  const themeStyles = theme?.styles || {}
  const borderRadius = themeStyles.borderRadius || '8px'
  const sectionSpacing = themeStyles.sectionSpacing || 'py-16'
  const cardBg = themeStyles.cardBg || 'bg-white/40'
  const cardShadow = themeStyles.cardShadow || 'shadow-sm'
  const dividerType = themeStyles.dividerType || 'heart'
  const heroStyle = themeStyles.heroStyle || 'center'

  const fontKr = fontSet?.fonts?.[0] || themeStyles.fontKr || 'font-serif'
  const fontEn = fontSet?.fonts?.[1] || themeStyles.fontEn || 'font-serif'

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

    const genericFallback = (enFont === 'font-serif' || krFont === 'font-serif') ? 'serif' : 'sans-serif';
    return `${enFamily}, ${krFamily}, ${genericFallback}`;
  }

  
  const defaultOrder = ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook']
  const sectionOrder = themeStyles.sectionOrder || defaultOrder

  return (
    <div className={cn("min-h-screen", fontClass)} style={{ backgroundColor: bgColor, fontFamily: getFontFamily(fontKr, fontEn) }}>
      {/* Music Toggle */}
      {bgmUrl && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center border border-gray-200 hover:bg-white transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4 text-[#c4a574]" /> : <Music className="w-4 h-4 text-gray-500" />}
        </button>
      )}

      {/* Main Content */}
      <div className="max-w-md mx-auto relative shadow-md min-h-screen pb-12" style={{ backgroundColor: bgColor, color: textColor }}>
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
              return <div className="mx-auto my-8 h-px w-32 bg-current opacity-20" />
            }
            if (dividerType === 'heart') {
              return <div className="text-center opacity-40 my-8 text-xs" style={{ color: accentColor }}>♥</div>
            }
            if (dividerType === 'space') {
              return <div className="my-8 h-6" />
            }
            return null
          }

          switch (sectionId) {
            case 'hero':
              return (
                <div key="hero" className="relative h-screen flex flex-col items-center justify-center text-center px-8 overflow-hidden">
                  {invitation.mainImage && (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={invitation.mainImage}
                        alt="Main Visual"
                        className="w-full h-full object-cover opacity-20"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundImage: `linear-gradient(to top, ${bgColor}, transparent, ${bgColor}80)` }} />
                    </div>
                  )}
                  <div className="space-y-6 z-10 w-full max-w-[280px] mx-auto">
                    <p className="text-sm tracking-[0.3em] opacity-60">WEDDING INVITATION</p>
                    
                    {heroStyle === 'left' ? (
                      <div className="space-y-4 text-left px-4 w-full">
                        <div className="space-y-1">
                          {invitation.groomParentRelation && (
                            <p className="text-xs opacity-75">{invitation.groomParentRelation}</p>
                          )}
                          <h1 className="text-3xl font-light tracking-wide">
                            {invitation.groomName}
                          </h1>
                        </div>
                        <div className="text-xl font-light opacity-60" style={{ color: accentColor }}>&amp;</div>
                        <div className="space-y-1">
                          {invitation.brideParentRelation && (
                            <p className="text-xs opacity-75">{invitation.brideParentRelation}</p>
                          )}
                          <h1 className="text-3xl font-light tracking-wide">
                            {invitation.brideName}
                          </h1>
                        </div>
                      </div>
                    ) : heroStyle === 'classic' ? (
                      <div className="space-y-4 text-center w-full">
                        <h1 className="text-4xl font-light tracking-widest uppercase">
                          {invitation.groomNameEn || 'GROOM'}
                          <span className="block text-base opacity-55 my-1" style={{ color: accentColor }}>&amp;</span>
                          {invitation.brideNameEn || 'BRIDE'}
                        </h1>
                        <div className="w-12 h-px bg-current opacity-30 mx-auto" />
                        <p className="text-sm tracking-wide">
                          {invitation.groomName} · {invitation.brideName}
                        </p>
                      </div>
                    ) : (
                      // Center
                      <div className="space-y-4">
                        <div className="space-y-1">
                          {invitation.groomParentRelation && (
                            <p className="text-xs opacity-75">{invitation.groomParentRelation}</p>
                          )}
                          <h1 className="text-3xl font-light tracking-wide">
                            {invitation.groomName}
                          </h1>
                        </div>
                        <div className="text-xl font-light opacity-60 font-light" style={{ color: accentColor }}>&amp;</div>
                        <div className="space-y-1">
                          {invitation.brideParentRelation && (
                            <p className="text-xs opacity-75">{invitation.brideParentRelation}</p>
                          )}
                          <h1 className="text-3xl font-light tracking-wide">
                            {invitation.brideName}
                          </h1>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 opacity-80 text-sm pt-4 border-t border-current/10">
                      <p>
                        {invitation.weddingDate ? (
                          format(new Date(invitation.weddingDate + 'T00:00:00'), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
                        ) : ''}
                      </p>
                      <p>{invitation.weddingTime}</p>
                      <p>{invitation.venueName} {invitation.venueHall}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-8 animate-bounce z-10">
                    <ChevronDown className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                </div>
              )

            case 'greeting':
              return (
                <section key="greeting" className={cn(spacingClass, "px-8 text-center", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <Heart className="w-6 h-6 mx-auto mb-6 opacity-60" style={{ color: accentColor }} />
                  <p className="leading-relaxed whitespace-pre-line text-sm opacity-80 mb-6">
                    {invitation.invitationMessage || '초대의 말씀을 드립니다.'}
                  </p>
                </section>
              )

            case 'gallery':
              if (!invitation.galleryImages || invitation.galleryImages.length === 0) return null
              const isSlide = invitation?.galleryViewType === 'slide'
              return (
                <section key="gallery" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">GALLERY</h2>
                  {isSlide ? (
                    <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-2 px-1">
                      {invitation.galleryImages.map((img: string, idx: number) => (
                        <div key={idx} className={cn("w-4/5 aspect-[4/3] flex-shrink-0 snap-center overflow-hidden bg-black/10", shadowClass)} style={borderStyle}>
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn("grid gap-2", isTwoColumn ? "grid-cols-3" : "grid-cols-2")}>
                      {invitation.galleryImages.map((img: string, idx: number) => (
                        <div key={idx} className={cn("aspect-square overflow-hidden bg-black/10", shadowClass)} style={borderStyle}>
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )

            case 'calendar':
              if (!invitation.weddingDate) return null
              return (
                <section key="calendar" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">CALENDAR</h2>
                  <Card className={cn("border-0 shadow-none", effectiveCardBg)} style={borderStyle}>
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <p className="text-2xl font-semibold" style={{ color: accentColor }}>{calMonth}</p>
                        <p className="text-sm opacity-40">{calYear}</p>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                          <div key={day} className="py-2 opacity-55 font-semibold text-xs">{day}</div>
                        ))}
                        {calDays.map((day, i) => {
                          if (day === null) return <div key={`empty-${i}`} />
                          return (
                            <div
                              key={i}
                              className={cn(
                                "py-1 text-xs flex items-center justify-center w-8 h-8 mx-auto rounded-full",
                                day === calDay && "text-white font-bold"
                              )}
                              style={day === calDay ? { backgroundColor: accentColor } : { color: secondaryTextColor }}
                            >
                              {day}
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-6 text-center text-xs opacity-80">
                        <p className="font-semibold text-sm" style={{ color: accentColor }}>
                          {format(new Date(invitation.weddingDate + 'T00:00:00'), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                        </p>
                        <p className="text-sm mt-1">{invitation.weddingTime}</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )

            case 'location':
              return (
                <section key="location" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">LOCATION</h2>
                  <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                    <CardContent className="p-6 text-left space-y-4">
                      <div>
                        <h3 className="font-semibold text-base">{invitation.venueName}</h3>
                        {invitation.venueHall && <p className="text-sm" style={{ color: accentColor }}>{invitation.venueHall}</p>}
                        <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>{invitation.venueAddress}</p>
                      </div>

                      {/* Traffic Info & Parking Info */}
                      {(invitation.trafficInfo || invitation.parkingInfo) && (
                        <div className="space-y-4 pt-4 border-t border-gray-100/10 text-xs">
                          {invitation.trafficInfo && (
                            <div>
                              <p className="font-semibold">교통 안내</p>
                              <p className="whitespace-pre-line mt-1 leading-relaxed" style={{ color: secondaryTextColor }}>{invitation.trafficInfo}</p>
                            </div>
                          )}
                          {invitation.parkingInfo && (
                            <div>
                              <p className="font-semibold">주차 안내</p>
                              <p className="whitespace-pre-line mt-1 leading-relaxed" style={{ color: secondaryTextColor }}>{invitation.parkingInfo}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" style={borderStyle} asChild>
                          <a href={`https://map.naver.com/v5/search/${encodeURIComponent(invitation.venueAddress)}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4 mr-2" />
                            네이버지도
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" style={borderStyle} asChild>
                          <a href={`https://map.kakao.com/?q=${encodeURIComponent(invitation.venueAddress)}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4 mr-2" />
                            카카오맵
                          </a>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs opacity-60 hover:opacity-90"
                        style={borderStyle}
                        onClick={() => copyToClipboard(invitation.venueAddress)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        주소 복사
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              )

            case 'contact':
              if (!invitation.contacts || invitation.contacts.length === 0) return null
              return (
                <section key="contact" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">CONTACT</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {invitation.contacts.map((contact: any) => (
                      <Card key={contact.id} className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                        <CardContent className="p-4 text-center">
                          <p className="text-xs mb-1" style={{ color: secondaryTextColor }}>
                            {contact.relation === 'groom' ? '신랑' :
                             contact.relation === 'bride' ? '신부' :
                             contact.relation === 'groomParent' ? '신랑 혼주' :
                             contact.relation === 'brideParent' ? '신부 혼주' :
                             contact.relation}
                          </p>
                          <p className="font-semibold mb-3 text-sm truncate">{contact.name}</p>
                          <Button variant="outline" size="sm" className="w-full" style={borderStyle} asChild>
                            <a href={`tel:${contact.phone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              전화
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )

            case 'account':
              if (!invitation.bankAccounts || invitation.bankAccounts.length === 0) return null
              return (
                <section key="account" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-2">ACCOUNT</h2>
                  <p className="text-center text-sm opacity-40 mb-8">마음 전하실 곳</p>
                  <div className={cn("space-y-4", isTwoColumn && "grid grid-cols-2 gap-4 space-y-0")}>
                    {invitation.bankAccounts.map((account: any) => (
                      <Card key={account.id} className={cn("border-0 shadow-sm", effectiveCardBg, shadowClass)} style={borderStyle}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-xs" style={{ color: secondaryTextColor }}>
                                {account.relation === 'groom' && '신랑'}
                                {account.relation === 'bride' && '신부'}
                                {account.relation === 'groomParent' && '신랑 혼주'}
                                {account.relation === 'brideParent' && '신부 혼주'}
                              </p>
                              <p className="font-semibold text-sm mt-1">{account.bank} {account.accountNumber}</p>
                              <p className="text-xs mt-0.5" style={{ color: secondaryTextColor }}>예금주: {account.accountHolder}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              style={borderStyle}
                              onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                              className="hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )

            case 'rsvp':
              if (!invitation.rsvpEnabled) return null
              return (
                <section key="rsvp" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-2">RSVP</h2>
                  <p className="text-center text-sm opacity-40 mb-8">참석 여부를 알려주세요</p>
                  
                  <Dialog open={showRsvp} onOpenChange={setShowRsvp}>
                    <DialogTrigger asChild>
                      <Button className="w-full text-white" style={{ backgroundColor: accentColor, ...borderStyle }}>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        참석 의사 전달하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>참석 여부 전달</DialogTitle>
                        <DialogDescription>참석 여부와 인원을 알려주세요</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label htmlFor="rsvp-name">성함</Label>
                          <Input id="rsvp-name" placeholder="성함을 입력해주세요" value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                          <Label>참석 여부</Label>
                          <RadioGroup value={attendance} onValueChange={setAttendance}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="yes" />
                              <Label htmlFor="yes" className="font-normal">참석</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="no" />
                              <Label htmlFor="no" className="font-normal">불참</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        {attendance === "yes" && (
                          <>
                            <div className="space-y-3">
                              <Label>참석 인원</Label>
                              <RadioGroup value={guestCount} onValueChange={setGuestCount}>
                                <div className="grid grid-cols-4 gap-2">
                                  {["1", "2", "3", "4+"].map((count) => (
                                    <div key={count} className="flex items-center space-x-2">
                                      <RadioGroupItem value={count} id={`count-${count}`} />
                                      <Label htmlFor={`count-${count}`} className="font-normal">{count}명</Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </div>
                            <div className="space-y-3">
                              <Label>식사 선택</Label>
                              <RadioGroup value={mealType} onValueChange={setMealType}>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="korean" id="korean" />
                                  <Label htmlFor="korean" className="font-normal">한식</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="western" id="western" />
                                  <Label htmlFor="western" className="font-normal">양식</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </>
                        )}
                        <div className="space-y-3">
                          <Label htmlFor="rsvp-msg">축하 메시지 (선택)</Label>
                          <Textarea id="rsvp-msg" placeholder="축하 메시지를 남겨주세요" rows={3} value={rsvpMessage} onChange={(e) => setRsvpMessage(e.target.value)} />
                        </div>
                      </div>
                      <Button className="w-full text-white" style={{ backgroundColor: accentColor, ...borderStyle }} onClick={handleRsvpSubmit}>
                        전송하기
                      </Button>
                    </DialogContent>
                  </Dialog>
                </section>
              )

            case 'guestbook':
              if (invitation.guestbookType === 'none' || invitation.guestbookType === undefined) return null
              return (
                <section key="guestbook" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">GUESTBOOK</h2>
                  <div className="space-y-4 text-left">
                    {guestbookMessages.length === 0 ? (
                      <p className="text-center text-sm opacity-40 py-6">남겨진 축하 메시지가 없습니다. 첫 메시지를 남겨보세요!</p>
                    ) : (
                      guestbookMessages.map((comment) => (
                        <Card key={comment.id} className={cn("border-0 shadow-sm", effectiveCardBg, shadowClass)} style={borderStyle}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{comment.name}</span>
                              <span className="text-xs opacity-40">{comment.createdAt}</span>
                            </div>
                            <p className="text-sm opacity-80 leading-relaxed whitespace-pre-line">{comment.message}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-4 border-current/30" style={borderStyle}>
                        축하 메시지 남기기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>축하 메시지 남기기</DialogTitle>
                        <DialogDescription>신랑 신부에게 축하의 메시지를 남겨주세요.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="guestbook-name">이름</Label>
                          <Input id="guestbook-name" placeholder="이름을 입력해주세요" value={newCommentName} onChange={(e) => setNewCommentName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guestbook-msg">축하 메시지</Label>
                          <Textarea id="guestbook-msg" placeholder="축하 메시지를 작성해주세요" rows={4} value={newCommentMessage} onChange={(e) => setNewCommentMessage(e.target.value)} />
                        </div>
                      </div>
                      <Button className="w-full text-white" style={{ backgroundColor: accentColor, ...borderStyle }} onClick={handleAddComment} disabled={isSubmittingComment}>
                        {isSubmittingComment ? "등록 중..." : "등록하기"}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </section>
              )

            default:
              return null
          }
        })}

        {/* Share Section */}
        <section className="py-16 px-8 bg-white/40 backdrop-blur-sm text-center">
          <Button variant="outline" className="gap-2 border-current/30" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("청첩장 주소가 복사되었습니다.");
          }}>
            <Share2 className="w-4 h-4" />
            청첩장 주소 복사하기
          </Button>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 bg-transparent text-center opacity-30 text-xs">
          <p>VOW SEOUL</p>
        </footer>
      </div>
    </div>
  )
}
