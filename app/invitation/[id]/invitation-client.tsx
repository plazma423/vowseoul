"use client"

import { useState, useEffect, useRef } from "react"
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
  Circle,
  Star,
  Navigation,
  ChevronDown,
  Music,
  Pause,
  Image
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { sampleThemes } from "@/lib/store"
import { cn, getLegibleColor } from "@/lib/utils"
import { Logo } from "@/components/logo"

export default function InvitationClient({ 
  id, 
  initialInvitation,
  initialThemes,
  initialFonts
}: { 
  id: string; 
  initialInvitation?: any;
  initialThemes?: any[];
  initialFonts?: any[];
}) {
  const [invitation, setInvitation] = useState<any>(initialInvitation || null)
  const [themes, setThemes] = useState<any[]>(initialThemes || [])
  const [customFonts, setCustomFonts] = useState<any[]>(initialFonts || [])
  const [loading, setLoading] = useState(!initialInvitation)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showRsvp, setShowRsvp] = useState(false)
  const [attendance, setAttendance] = useState("yes")
  const [guestCount, setGuestCount] = useState("2")
  const [mealType, setMealType] = useState("korean")
  const [rsvpName, setRsvpName] = useState("")
  const [rsvpMessage, setRsvpMessage] = useState("")
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false)

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

  // Guestbook states
  const [guestbookMessages, setGuestbookMessages] = useState<any[]>([])
  const [newCommentName, setNewCommentName] = useState("")
  const [newCommentMessage, setNewCommentMessage] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)

  // Audio Ref & State
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [bgmUrl, setBgmUrl] = useState<string | null>(null)

  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    if (!invitation?.weddingDate) return
    
    const getCountdown = (dateStr: string, timeStr?: string) => {
      if (!dateStr) return { days: 0, hours: 0, minutes: 0 }
      const timeVal = timeStr || '12:00'
      try {
        const target = new Date(`${dateStr}T${timeVal}:00`)
        const now = new Date()
        const diff = target.getTime() - now.getTime()
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        
        return { days, hours, minutes }
      } catch (e) {
        return { days: 0, hours: 0, minutes: 0 }
      }
    }

    const updateTime = () => {
      const { days, hours, minutes } = getCountdown(invitation.weddingDate!, invitation.weddingTime)
      setTimeLeft({ days, hours, minutes })
    }
    
    updateTime()
    const timer = setInterval(updateTime, 60000) // update every minute
    return () => clearInterval(timer)
  }, [invitation?.weddingDate, invitation?.weddingTime])

  useEffect(() => {
    const loadFonts = async () => {
      if (initialFonts && initialFonts.length > 0) return
      try {
        const { data } = await supabase.from('settings').select('*').eq('key', 'fonts')
        if (data && data.length > 0 && data[0].value) {
          setCustomFonts(data[0].value)
        }
      } catch (err) {
        console.error('Error fetching fonts in InvitationClient:', err)
      }
    }
    loadFonts()
  }, [initialFonts])

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        // Fetch themes (Skip if pre-fetched)
        if (!initialThemes || initialThemes.length === 0) {
          const { data: themesData } = await supabase.from('themes').select('*')
          if (themesData) setThemes(themesData)
        }

        // 1. Fetch invitation to ensure fresh data
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', id)
          .single()

        if (inviteError) throw inviteError
        let currentInvite = inviteData
        if (inviteData) {
          setInvitation(inviteData)
        }

        if (currentInvite) {
          // 2. Fetch guestbook comments
          if (currentInvite.guestbookType !== 'none') {
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
          if (currentInvite.bgmId) {
            const { data: bgmData } = await supabase
              .from('bgms')
              .select('*')
              .eq('id', currentInvite.bgmId)
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
              ].find(b => b.id === currentInvite.bgmId)
              if (sampleBgm) {
                setBgmUrl(sampleBgm.url)
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading invitation data:", err)
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

  const handleRsvpSubmit = async () => {
    if (!rsvpName) {
      toast.error("성함을 입력해주세요.")
      return
    }
    setIsSubmittingRsvp(true)
    const newRsvp = {
      id: 'rsvp-' + Math.random().toString(36).substring(2, 9),
      invitationId: id,
      name: rsvpName,
      attendance: attendance,
      guestCount: attendance === 'yes' ? (parseInt(guestCount) || 1) : 0,
      mealType: (attendance === 'yes' && invitation.rsvpMealEnabled !== false) ? mealType : 'none',
      message: invitation.rsvpCommentEnabled !== false ? rsvpMessage : '',
      createdAt: new Date().toISOString()
    }

    try {
      const { error } = await supabase.from('rsvps').insert(newRsvp)
      if (error) throw error

      toast.success("참석 의사가 정상적으로 전달되었습니다.")
      setShowRsvp(false)
      setRsvpName("")
      setRsvpMessage("")
    } catch (err: any) {
      console.error("RSVP insert error:", err)
      const localRsvpsKey = `rsvps_${id}`
      const existingLocal = JSON.parse(localStorage.getItem(localRsvpsKey) || '[]')
      localStorage.setItem(localRsvpsKey, JSON.stringify([newRsvp, ...existingLocal]))
      
      toast.success("참석 의사가 전달되었습니다. (로컬 저장)")
      setShowRsvp(false)
      setRsvpName("")
      setRsvpMessage("")
    } finally {
      setIsSubmittingRsvp(false)
    }
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
        <Logo className="h-5 w-auto text-[#8b7355] animate-pulse" />
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
  
  const themeStyles = {
    ...theme?.styles,
    ...(invitation?.customStyles || {})
  }

  const isDuotone = theme?.id === 'duotone-contrast' || themeStyles.duotoneEnabled === true
  
  let color1 = '#CCECFF'
  let color2 = '#361623'
  
  if (themeStyles.customColorsEnabled) {
    color1 = themeStyles.customBgColor || '#CCECFF'
    color2 = themeStyles.customPrimaryColor || '#361623'
  } else {
    // Read from selected colorSet
    const activeColorSet = theme?.colorSets?.find(c => c.id === invitation?.colorSet) || theme?.colorSets?.[0]
    if (activeColorSet && activeColorSet.colors && activeColorSet.colors.length >= 2) {
      color1 = activeColorSet.colors[0]
      color2 = activeColorSet.colors[1]
    }
  }

  const bgColor = isDuotone ? color1 : (themeStyles.backgroundColor || colorSet?.colors?.[0] || '#faf9f7')
  const rawAccentColor = isDuotone ? color2 : (themeStyles.primaryColor || colorSet?.colors?.[1] || '#c4a574')
  const rawTextColor = isDuotone ? color2 : (themeStyles.textColor || colorSet?.colors?.[2] || '#3d3d3d')
  const rawSecondaryTextColor = themeStyles.secondaryTextColor || '#8a8a8a'

  const accentColor = getLegibleColor(bgColor, rawAccentColor, false)
  const textColor = getLegibleColor(bgColor, rawTextColor, true)
  const secondaryTextColor = getLegibleColor(bgColor, rawSecondaryTextColor, false)
  const fontClass = fontSet?.id === 'serif' ? 'font-serif' : 'font-sans'

  // Dynamic style values
  const borderRadius = themeStyles.borderRadius || '8px'
  const sectionSpacing = themeStyles.sectionSpacing || 'py-16'
  const cardBg = themeStyles.cardBg || 'bg-white/40'
  const cardShadow = themeStyles.cardShadow || 'shadow-sm'
  const dividerType = themeStyles.dividerType || 'heart'
  const heroStyle = themeStyles.heroStyle || 'center'
  const heroConnector = themeStyles.heroConnector === 'none_clear' ? '&' : (themeStyles.heroConnector || '&')
  const accountLayout = themeStyles.accountLayout || '1col'

  const fontKr = invitation?.customStyles?.fontKr || fontSet?.fonts?.[0] || theme?.styles?.fontKr || 'font-serif'
  const fontEn = invitation?.customStyles?.fontEn || fontSet?.fonts?.[1] || theme?.styles?.fontEn || 'font-serif'

  const getSectionColors = (sectionId: string, index: number) => {
    if (!isDuotone) {
      const isEven = index % 2 === 0
      const bg = theme.layout === 'minimal' ? 'bg-transparent' : (isEven ? 'bg-white/40 backdrop-blur-sm' : 'bg-black/5')
      return {
        bgStyle: theme.layout === 'minimal' ? { backgroundColor: 'transparent' } : {},
        textStyle: { color: textColor },
        accent: accentColor,
        isDark: false,
        bgColorVal: bgColor,
        textColorVal: textColor,
        secondaryTextColorVal: secondaryTextColor,
        cardBgVal: cardBg
      }
    }
    
    // Duotone alternating behavior
    const darkSections = ['hero', 'sequence', 'gallery', 'calendar', 'rsvp', 'guestbook', 'footer']
    const isDark = darkSections.includes(sectionId)
    
    const bgVal = isDark ? color2 : color1
    const textVal = isDark ? color1 : color2
    const accVal = isDark ? color1 : color2
    
    return {
      bgStyle: { backgroundColor: bgVal },
      textStyle: { color: textVal },
      accent: accVal,
      isDark,
      bgColorVal: bgVal,
      textColorVal: textVal,
      secondaryTextColorVal: isDark ? `${color1}cc` : `${color2}cc`,
      cardBgVal: isDark ? 'bg-white/10' : 'bg-black/5' // simple transparent card overlay for contrast
    }
  }

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

  const defaultOrder = ['hero', 'greeting', 'sequence', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook']
  const rawOrder = themeStyles.sectionOrder || defaultOrder
  const sectionOrder = rawOrder.includes('sequence')
    ? rawOrder
    : (() => {
        const idx = rawOrder.indexOf('greeting')
        const newOrder = [...rawOrder]
        newOrder.splice(idx !== -1 ? idx + 1 : 2, 0, 'sequence')
        return newOrder
      })()

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
      <div className={cn("max-w-md mx-auto relative shadow-md min-h-screen", isDuotone ? "" : "pb-12")} style={{ backgroundColor: bgColor, color: textColor }}>
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
          const isMinimal = theme.layout === 'minimal'
          const isGrid = theme.layout === 'grid'
          const isTwoColumn = theme.layout === 'two-column'

          const borderStyle = { borderRadius: isGrid ? '0px' : borderRadius }
          const shadowClass = isMinimal ? 'shadow-none' : cardShadow
          
          let spacingClass = sectionSpacing
          if (isMinimal) {
            if (sectionSpacing === 'py-8') spacingClass = 'py-16'
            else if (sectionSpacing === 'py-12') spacingClass = 'py-24'
            else if (sectionSpacing === 'py-16') spacingClass = 'py-32'
            else if (sectionSpacing === 'py-20') spacingClass = 'py-40'
          }

          const sectColors = getSectionColors(sectionId, idx)
          const isEven = idx % 2 === 0
          const sectionBg = isDuotone ? '' : (isMinimal ? 'bg-transparent' : (isEven ? 'bg-white/40 backdrop-blur-sm' : 'bg-black/5'))
          const sectionBorderClass = isGrid ? 'border border-current/15 mx-2 my-2' : ''
          const effectiveCardBg = isDuotone ? sectColors.cardBgVal : (isMinimal ? 'bg-transparent' : cardBg)
          const showDivider = idx > 0 && !isDuotone
          
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
              if (isDuotone) {
                const subtitleText = themeStyles.heroSubtitleText || 'save the date'
                const subtitleFont = themeStyles.heroSubtitleFont || fontEn
                const subtitleSize = themeStyles.heroSubtitleSize || 24 // slightly larger for full screen
                const subtitleStyle = {
                  fontFamily: getFontFamily(fontKr, subtitleFont),
                  fontSize: `${subtitleSize}px`,
                  letterSpacing: '0.2em'
                }
                
                const getHeroDateString = () => {
                  if (!invitation?.weddingDate) return 'MAY 7, 2026 11 AM'
                  try {
                    const d = new Date(invitation.weddingDate + 'T' + (invitation.weddingTime || '12:00') + ':00')
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
                    const month = months[d.getMonth()]
                    const day = d.getDate()
                    const year = d.getFullYear()
                    
                    let hours = d.getHours()
                    const ampm = hours >= 12 ? 'PM' : 'AM'
                    hours = hours % 12
                    hours = hours ? hours : 12
                    
                    return `${month} ${day}, ${year} ${hours} ${ampm}`
                  } catch (e) {
                    return invitation.weddingDate
                  }
                }

                return (
                  <div 
                    key="hero" 
                    className="relative h-screen flex flex-col items-center justify-between text-center px-8 py-16 overflow-hidden"
                    style={{ ...sectColors.bgStyle, ...sectColors.textStyle }}
                  >
                    {/* Subtitle */}
                    <div style={subtitleStyle} className="mt-4 uppercase tracking-[0.2em] font-light">
                      {subtitleText}
                    </div>
                    
                    {/* Foreground Main Image */}
                    {invitation?.mainImage ? (
                      <div className="w-[220px] h-[300px] my-6 overflow-hidden border border-current/10 shadow-md animate-fade-in">
                        <img
                          src={invitation.mainImage}
                          alt="Main Visual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-[220px] h-[300px] my-6 flex items-center justify-center border border-dashed border-current/30 bg-current/5">
                        <span className="text-xs opacity-40">사진을 등록해주세요</span>
                      </div>
                    )}
                    
                    {/* Groom & Bride names */}
                    <div className="flex items-center justify-center gap-6 text-lg font-light tracking-wide mt-2">
                      <span>{invitation?.groomName || '신랑'}</span>
                      <span className="opacity-60 text-sm font-serif">&amp;</span>
                      <span>{invitation?.brideName || '신부'}</span>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-1 opacity-85 text-xs tracking-wide pt-4 border-t border-current/10 w-full max-w-[240px] mx-auto mb-4">
                      <p className="uppercase truncate">
                        {invitation?.venueName || 'VOW SEOUL GRAND HALL'}
                      </p>
                      <p>
                        {getHeroDateString()}
                      </p>
                    </div>
                    
                    <div className="animate-float">
                      <ChevronDown className="w-6 h-6 opacity-55" style={{ color: sectColors.accent }} />
                    </div>
                  </div>
                )
              }

              return (
                <div key="hero" className="relative h-screen flex flex-col items-center justify-center text-center px-8 overflow-hidden" style={{ ...sectColors.bgStyle, ...sectColors.textStyle }}>
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
                        {heroConnector !== 'none' && <div className="text-xl font-light opacity-60" style={{ color: accentColor }}>{heroConnector}</div>}
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
                          {heroConnector !== 'none' && <span className="block text-base opacity-55 my-1" style={{ color: accentColor }}>{heroConnector}</span>}
                          {invitation.brideNameEn || 'BRIDE'}
                        </h1>
                        <div className="w-12 h-px bg-current opacity-30 mx-auto" />
                        <p className="text-sm tracking-wide">
                          {invitation.groomName} · {invitation.brideName}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          {invitation.groomParentRelation && (
                            <p className="text-xs opacity-75">{invitation.groomParentRelation}</p>
                          )}
                          <h1 className="text-3xl font-light tracking-wide">
                            {invitation.groomName}
                          </h1>
                        </div>
                        {heroConnector !== 'none' && <div className="text-xl font-light opacity-60 font-light" style={{ color: accentColor }}>{heroConnector}</div>}
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
                      <p>{invitation.venueName}{invitation.venueHall ? ' ' + invitation.venueHall : ''}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-8 animate-float z-10">
                    <ChevronDown className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                </div>
              )

            case 'greeting':
              const greetingIconShape = invitation.customStyles?.greetingIconShape || 'heart'
              const greetingIconColor = invitation.customStyles?.greetingIconColor || accentColor
              const greetingIconCustomUrl = invitation.customStyles?.greetingIconCustomUrl
              const isGreetingCustomSvg = greetingIconCustomUrl?.toLowerCase().split('?')[0].endsWith('.svg') ?? false

              const renderGreetingIcon = () => {
                if (greetingIconShape === 'custom' && greetingIconCustomUrl) {
                  if (isGreetingCustomSvg) {
                    return (
                      <div 
                        className="w-6 h-6 mx-auto mb-6 opacity-60 pointer-events-none"
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
                        className="w-6 h-6 mx-auto mb-6 object-contain opacity-80"
                      />
                    )
                  }
                }

                if (greetingIconShape === 'circle') {
                  return <Circle className="w-6 h-6 mx-auto mb-6 opacity-60" style={{ color: greetingIconColor }} />
                }
                if (greetingIconShape === 'star') {
                  return <Star className="w-6 h-6 mx-auto mb-6 opacity-60" style={{ color: greetingIconColor }} />
                }
                return <Heart className="w-6 h-6 mx-auto mb-6 opacity-60" style={{ color: greetingIconColor }} />
              }

              return (
                <section key="greeting" className={cn(spacingClass, "px-8 text-center", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  {renderGreetingIcon()}
                  <p className="leading-relaxed whitespace-pre-line text-sm opacity-80 mb-6">
                    {invitation.invitationMessage || '초대의 말씀을 드립니다.'}
                  </p>
                </section>
              )

            case 'sequence':
              const sequenceEnabled = invitation?.customStyles?.sequenceEnabled ?? false
              if (!sequenceEnabled) return null
              const sequenceTitle = invitation?.customStyles?.sequenceTitle || '식순 안내'
              const sequenceSubtitle = invitation?.customStyles?.sequenceSubtitle || 'WEDDING ORDER'
              const sequenceEvents = invitation?.customStyles?.sequenceEvents || [
                { id: '1', time: '12:00', title: '식전 영상 상영' },
                { id: '2', time: '12:10', title: '개식 및 화촉점화' },
                { id: '3', time: '12:20', title: '신랑 신부 입장' },
                { id: '4', time: '12:30', title: '혼인서약 및 성혼선언' },
                { id: '5', time: '12:45', title: '축가 및 하객 인사' },
                { id: '6', time: '13:00', title: '신랑 신부 행진 및 폐식' }
              ]

              return (
                <section key="sequence" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-2">{sequenceTitle}</h2>
                  <p className="text-center text-sm opacity-40 mb-8">{sequenceSubtitle}</p>
                  
                  <div className="relative border-l border-current/15 ml-6 pl-8 space-y-6 text-left max-w-[280px] mx-auto">
                    {sequenceEvents.map((event: any) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-[37.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-current opacity-70 border-2 border-background" style={{ backgroundColor: sectColors.accent }} />
                        <div>
                          <span className="font-mono text-sm font-semibold" style={{ color: sectColors.accent }}>{event.time}</span>
                          <p className="text-sm font-medium mt-1">{event.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )

            case 'gallery':
              if (!invitation.galleryImages || invitation.galleryImages.length === 0) return null
              const isSlide = invitation?.galleryViewType === 'slide'
              return (
                <section key="gallery" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">GALLERY</h2>
                  {isSlide ? (
                    <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-2 px-1">
                      {invitation.galleryImages.map((img: string, idx: number) => (
                        <div key={idx} className={cn("w-[280px] h-[350px] flex-shrink-0 snap-center overflow-hidden bg-black/5 flex items-center justify-center", shadowClass)} style={borderStyle}>
                          <img src={img} alt={`Gallery ${idx + 1}`} className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300" />
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
              const ddayEnabled = invitation.customStyles?.ddayEnabled ?? false
              return (
                <section key="calendar" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className={cn("text-center text-xs font-semibold tracking-wider", ddayEnabled ? "mb-2" : "mb-8")}>CALENDAR</h2>
                  {ddayEnabled && (
                    <div 
                      className="text-center text-sm font-bold tracking-wider mb-6 animate-pulse" 
                      style={{ color: sectColors.accent }}
                    >
                      {getDDayString(invitation.weddingDate)}
                    </div>
                  )}
                  <Card className={cn("border-0 shadow-none", effectiveCardBg)} style={{ ...borderStyle, color: 'inherit' }}>
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <p className="text-2xl font-semibold" style={{ color: sectColors.accent }}>{calMonth}</p>
                        <p className="text-sm opacity-40">{calYear}</p>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                          <div key={day} className="py-2 opacity-55 font-semibold text-xs">{day}</div>
                        ))}
                        {calDays.map((day, i) => {
                          if (day === null) return <div key={`empty-${i}`} />
                          const isWeddingDay = day === calDay
                          
                          if (isWeddingDay) {
                            const shapeType = invitation.customStyles?.calendarDayShape || 'circle'
                            const customShapeUrl = invitation.customStyles?.calendarDayCustomShapeUrl
                            const highlightTextColor = invitation.customStyles?.calendarDayTextColor || '#ffffff'
                            
                            if (shapeType === 'custom' && customShapeUrl) {
                              const isSvg = customShapeUrl.toLowerCase().split('?')[0].endsWith('.svg')
                              return (
                                <div
                                  key={i}
                                  className="relative py-1 text-xs flex items-center justify-center w-8 h-8 mx-auto font-bold"
                                  style={{ color: highlightTextColor }}
                                >
                                  {isSvg ? (
                                    <div 
                                      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                                      style={{
                                        backgroundColor: invitation.customStyles?.calendarDaySvgColor || sectColors.accent,
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
                                  className="relative py-1 text-xs flex items-center justify-center w-8 h-8 mx-auto font-bold"
                                  style={{ color: highlightTextColor }}
                                >
                                  <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none fill-current" viewBox="0 0 24 24" style={{ color: sectColors.accent }}>
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                  </svg>
                                  <span className="relative z-10">{day}</span>
                                </div>
                              )
                            }
                            
                            return (
                              <div
                                key={i}
                                className="relative py-1 text-xs flex items-center justify-center w-8 h-8 mx-auto rounded-full font-bold"
                                style={{ backgroundColor: sectColors.accent, color: highlightTextColor }}
                              >
                                <span className="relative z-10">{day}</span>
                              </div>
                            )
                          }
                          
                          return (
                            <div
                              key={i}
                              className="py-1 text-xs flex items-center justify-center w-8 h-8 mx-auto text-center"
                              style={{ color: sectColors.secondaryTextColorVal }}
                            >
                              {day}
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-6 text-center text-xs opacity-80">
                        <p className="font-semibold text-sm" style={{ color: sectColors.accent }}>
                          {format(new Date(invitation.weddingDate + 'T00:00:00'), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}
                        </p>
                        <p className="text-sm mt-1">{invitation.weddingTime}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Duotone Countdown Timer */}
                  {isDuotone && (
                    <div className="mt-8 pt-8 border-t border-current/10 text-center space-y-4">
                      <p className="text-xs uppercase tracking-[0.15em] opacity-60">Days left</p>
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider opacity-50">Days</p>
                          <p className="text-2xl font-light font-mono mt-1">{timeLeft.days}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider opacity-50">Hours</p>
                          <p className="text-2xl font-light font-mono mt-1">{timeLeft.hours}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] uppercase tracking-wider opacity-50">Minutes</p>
                          <p className="text-2xl font-light font-mono mt-1">{timeLeft.minutes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )

            case 'location':
              return (
                <section key="location" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">LOCATION</h2>
                  <Card 
                    className={cn("border-0", effectiveCardBg, shadowClass)} 
                    style={isDuotone ? { backgroundColor: color2, color: color1, borderRadius: borderStyle.borderRadius } : borderStyle}
                  >
                    <CardContent className="p-6 text-left space-y-4">
                      <div>
                        <h3 className="font-semibold text-base">{invitation.venueName}</h3>
                        {invitation.venueHall && <p className="text-sm" style={{ color: isDuotone ? color1 : sectColors.accent }}>{invitation.venueHall}</p>}
                        <p className="text-xs mt-1" style={{ color: isDuotone ? `${color1}cc` : sectColors.secondaryTextColorVal }}>{invitation.venueAddress}</p>
                      </div>

                      {(invitation.trafficInfo || invitation.parkingInfo || invitation.customStyles?.subwayImage || invitation.customStyles?.parkingImage) && (
                        <div className="space-y-4 pt-4 border-t border-gray-100/10 text-xs">
                          {(invitation.trafficInfo || invitation.customStyles?.subwayImage) && (
                            <div>
                              <p className="font-semibold">교통 안내</p>
                              {invitation.trafficInfo && (
                                <p className="whitespace-pre-line mt-1 leading-relaxed" style={{ color: isDuotone ? `${color1}b3` : sectColors.secondaryTextColorVal }}>{invitation.trafficInfo}</p>
                              )}
                              {invitation.customStyles?.subwayImage && (
                                invitation.customStyles.subwayDisplayType === 'direct' ? (
                                  <div className="mt-2 rounded overflow-hidden bg-black/5 dark:bg-white/5 border border-border/50">
                                    <img 
                                      src={invitation.customStyles.subwayImage} 
                                      className="w-full h-auto cursor-pointer" 
                                      onClick={() => setActiveImageModal(invitation.customStyles.subwayImage)}
                                    />
                                  </div>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => setActiveImageModal(invitation.customStyles.subwayImage)}
                                    className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-border/30 rounded text-xs font-medium hover:bg-black/10 transition-colors"
                                    style={{ color: isDuotone ? color1 : sectColors.accent }}
                                  >
                                    <Image className="w-3.5 h-3.5" />
                                    <span>{invitation.customStyles.subwayButtonText || '이미지 보기'}</span>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                          {(invitation.parkingInfo || invitation.customStyles?.parkingImage) && (
                            <div>
                              <p className="font-semibold">주차 안내</p>
                              {invitation.parkingInfo && (
                                <p className="whitespace-pre-line mt-1 leading-relaxed" style={{ color: isDuotone ? `${color1}b3` : sectColors.secondaryTextColorVal }}>{invitation.parkingInfo}</p>
                              )}
                              {invitation.customStyles?.parkingImage && (
                                invitation.customStyles.parkingDisplayType === 'direct' ? (
                                  <div className="mt-2 rounded overflow-hidden bg-black/5 dark:bg-white/5 border border-border/50">
                                    <img 
                                      src={invitation.customStyles.parkingImage} 
                                      className="w-full h-auto cursor-pointer" 
                                      onClick={() => setActiveImageModal(invitation.customStyles.parkingImage)}
                                    />
                                  </div>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => setActiveImageModal(invitation.customStyles.parkingImage)}
                                    className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-black/5 dark:bg-white/5 border border-border/30 rounded text-xs font-medium hover:bg-black/10 transition-colors"
                                    style={{ color: isDuotone ? color1 : sectColors.accent }}
                                  >
                                    <Image className="w-3.5 h-3.5" />
                                    <span>{invitation.customStyles.parkingButtonText || '이미지 보기'}</span>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" style={isDuotone ? { borderColor: `${color1}33`, color: color1, backgroundColor: 'transparent', borderRadius: borderStyle.borderRadius } : borderStyle} asChild>
                          <a href={`https://map.naver.com/v5/search/${encodeURIComponent(invitation.venueAddress)}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4 mr-2" />
                            네이버지도
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" style={isDuotone ? { borderColor: `${color1}33`, color: color1, backgroundColor: 'transparent', borderRadius: borderStyle.borderRadius } : borderStyle} asChild>
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
                        style={isDuotone ? { color: color1, backgroundColor: 'transparent', borderRadius: borderStyle.borderRadius } : borderStyle}
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
                <section key="contact" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">CONTACT</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {invitation.contacts.map((contact: any) => (
                      <Card key={contact.id} className={cn("border-0", effectiveCardBg, shadowClass)} style={{ ...borderStyle, color: 'inherit' }}>
                        <CardContent className="p-4 text-center">
                          <p className="text-xs mb-1" style={{ color: sectColors.secondaryTextColorVal }}>
                            {contact.relation === 'groom' ? '신랑' :
                             contact.relation === 'bride' ? '신부' :
                             contact.relation === 'groomParent' ? '신랑 혼주' :
                             contact.relation === 'brideParent' ? '신부 혼주' :
                             contact.relation}
                          </p>
                          <p className="font-semibold mb-3 text-sm truncate">{contact.name}</p>
                          <Button variant="outline" size="sm" className="w-full" style={isDuotone ? { borderColor: `${color2}33`, color: color2, backgroundColor: 'transparent', borderRadius: borderStyle.borderRadius } : borderStyle} asChild>
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
              const accountsList = invitation.bankAccounts || []
              const groomAccounts = accountsList.filter((acc: any) => acc.relation === 'groom' || acc.relation === 'groomParent')
              const brideAccounts = accountsList.filter((acc: any) => acc.relation === 'bride' || acc.relation === 'brideParent')

              return (
                <section key="account" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-2">ACCOUNT</h2>
                  <p className="text-center text-sm opacity-40 mb-8">마음 전하실 곳</p>
                  
                  {accountLayout === '2col' ? (
                    <div className="grid grid-cols-2 gap-3 text-left items-start">
                      <div className="space-y-2">
                        <div className="text-center text-xs font-semibold pb-1.5 border-b opacity-85" style={{ color: sectColors.accent, borderColor: `${sectColors.accent}20` }}>신랑측</div>
                        {groomAccounts.map((account: any) => (
                          <Card 
                            key={account.id} 
                            className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm", effectiveCardBg, shadowClass)} 
                            style={{ ...borderStyle, color: 'inherit' }}
                            onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                          >
                            <CardContent className="p-2 px-2.5 text-left flex flex-col justify-center min-h-[44px] space-y-0.5">
                              <div className="flex justify-between items-center w-full text-[9px] leading-tight">
                                <span style={{ color: sectColors.secondaryTextColorVal }}>
                                  {account.relation === 'groom' ? '신랑' : '신랑 혼주'}
                                </span>
                                <span className="font-semibold truncate max-w-[65px]">{account.accountHolder}</span>
                              </div>
                              <div className="flex justify-between items-center w-full mt-0.5 text-[9px] leading-none">
                                <span className="font-mono truncate max-w-[95px]">{account.accountNumber}</span>
                                <span className="opacity-80 truncate max-w-[50px] text-[8px]" style={{ color: sectColors.secondaryTextColorVal }}>{account.bank}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {groomAccounts.length === 0 && (
                          <p className="text-center text-xs opacity-30 py-4">등록된 계좌 없음</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-center text-xs font-semibold pb-1.5 border-b opacity-85" style={{ color: sectColors.accent, borderColor: `${sectColors.accent}20` }}>신부측</div>
                        {brideAccounts.map((account: any) => (
                          <Card 
                            key={account.id} 
                            className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm", effectiveCardBg, shadowClass)} 
                            style={{ ...borderStyle, color: 'inherit' }}
                            onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                          >
                            <CardContent className="p-2 px-2.5 text-left flex flex-col justify-center min-h-[44px] space-y-0.5">
                              <div className="flex justify-between items-center w-full text-[9px] leading-tight">
                                <span style={{ color: sectColors.secondaryTextColorVal }}>
                                  {account.relation === 'bride' ? '신부' : '신부 혼주'}
                                </span>
                                <span className="font-semibold truncate max-w-[65px]">{account.accountHolder}</span>
                              </div>
                              <div className="flex justify-between items-center w-full mt-0.5 text-[9px] leading-none">
                                <span className="font-mono truncate max-w-[95px]">{account.accountNumber}</span>
                                <span className="opacity-80 truncate max-w-[50px] text-[8px]" style={{ color: sectColors.secondaryTextColorVal }}>{account.bank}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {brideAccounts.length === 0 && (
                          <p className="text-center text-xs opacity-30 py-4">등록된 계좌 없음</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {accountsList.map((account: any) => (
                        <Card 
                          key={account.id} 
                          className={cn("border-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-sm", effectiveCardBg, shadowClass)} 
                          style={{ ...borderStyle, color: 'inherit' }}
                          onClick={() => copyToClipboard(`${account.bank} ${account.accountNumber}`)}
                        >
                          <CardContent className="p-4 text-left">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs" style={{ color: sectColors.secondaryTextColorVal }}>
                                  {account.relation === 'groom' && '신랑'}
                                  {account.relation === 'bride' && '신부'}
                                  {account.relation === 'groomParent' && '신랑 혼주'}
                                  {account.relation === 'brideParent' && '신부 혼주'}
                                </p>
                                <p className="font-semibold text-sm mt-1">{account.bank} {account.accountNumber}</p>
                                <p className="text-xs mt-0.5" style={{ color: sectColors.secondaryTextColorVal }}>예금주: {account.accountHolder}</p>
                              </div>
                              <div className="text-xs opacity-40 flex items-center justify-center">
                                <Copy className="w-4 h-4 opacity-70" />
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
              if (!invitation.rsvpEnabled) return null
              return (
                <section key="rsvp" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-2">RSVP</h2>
                  <p className="text-center text-sm opacity-40 mb-8">참석 여부를 알려주세요</p>
                  
                  <Dialog open={showRsvp} onOpenChange={setShowRsvp}>
                    <DialogTrigger asChild>
                      <Button className="w-full text-white animate-pulse" style={{ backgroundColor: sectColors.accent, color: isDuotone ? color2 : '#ffffff', ...borderStyle }}>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        참석 의사 전달하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm bg-background border border-border p-6 rounded-lg shadow-lg">
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
                            {invitation.rsvpMealEnabled !== false && (
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
                            )}
                          </>
                        )}
                        {invitation.rsvpCommentEnabled !== false && (
                          <div className="space-y-3">
                            <Label htmlFor="rsvp-msg">축하 메시지 (선택)</Label>
                            <Textarea id="rsvp-msg" placeholder="축하 메시지를 남겨주세요" rows={3} value={rsvpMessage} onChange={(e) => setRsvpMessage(e.target.value)} />
                          </div>
                        )}
                      </div>
                      <Button className="w-full text-white" style={{ backgroundColor: sectColors.accent, color: isDuotone ? color2 : '#ffffff', ...borderStyle }} onClick={handleRsvpSubmit} disabled={isSubmittingRsvp}>
                        {isSubmittingRsvp ? "전송 중..." : "전송하기"}
                      </Button>
                    </DialogContent>
                  </Dialog>
                </section>
              )

            case 'guestbook':
              if (invitation.guestbookType === 'none' || invitation.guestbookType === undefined) return null
              return (
                <section key="guestbook" className={cn(spacingClass, "px-8", sectionBg, sectionBorderClass)} style={{ ...sectColors.bgStyle, ...sectColors.textStyle, ...(isGrid ? borderStyle : undefined) }}>
                  {showDivider && renderDivider()}
                  <h2 className="text-center text-xs font-semibold tracking-wider mb-8">GUESTBOOK</h2>
                  <div className="space-y-4 text-left">
                    {guestbookMessages.length === 0 ? (
                      <p className="text-center text-sm opacity-40 py-6">남겨진 축하 메시지가 없습니다. 첫 메시지를 남겨보세요!</p>
                    ) : (
                      guestbookMessages.map((comment) => (
                        <Card key={comment.id} className={cn("border-0 shadow-sm", effectiveCardBg, shadowClass)} style={{ ...borderStyle, color: 'inherit' }}>
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
                      <Button variant="outline" className="w-full mt-4 border-current/30" style={isDuotone ? { borderColor: `${color1}33`, color: color1, backgroundColor: 'transparent', borderRadius: borderStyle.borderRadius } : borderStyle}>
                        축하 메시지 남기기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm bg-background border border-border p-6 rounded-lg shadow-lg">
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
                      <Button className="w-full text-white" style={{ backgroundColor: sectColors.accent, color: isDuotone ? color2 : '#ffffff', ...borderStyle }} onClick={handleAddComment} disabled={isSubmittingComment}>
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
        <section className="py-12 px-8 text-center bg-transparent" style={isDuotone ? { backgroundColor: color2, color: color1 } : undefined}>
          <Button variant="ghost" className={cn("text-xs gap-1.5 hover:bg-transparent", isDuotone ? "text-current opacity-70 hover:opacity-100" : "text-muted-foreground opacity-60 hover:opacity-100")} onClick={() => {
            navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
            toast.success("청첩장 주소가 복사되었습니다.");
          }}>
            <Share2 className="w-3.5 h-3.5" />
            청첩장 주소 복사하기
          </Button>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 text-center text-xs flex flex-col items-center justify-center" style={isDuotone ? { backgroundColor: color2, color: color1 } : undefined}>
          <Logo className={cn("h-3.5 w-auto text-current", isDuotone ? "opacity-60" : "opacity-30")} />
        </footer>
      </div>
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
