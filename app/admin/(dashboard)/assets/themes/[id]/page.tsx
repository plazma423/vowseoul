'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, Save, Upload, Loader2, Link as LinkIcon, Music, Heart, Copy, Phone, Calendar as CalendarIcon, Share2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { sampleThemes } from '@/lib/store'
import { cn, getLegibleColor } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function ThemeEditorPage() {
  const params = useParams()
  const router = useRouter()
  const themeId = params.id as string
  const isNew = themeId === 'new'

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingTheme, setIsUploadingTheme] = useState(false)
  const [bgms, setBgms] = useState<any[]>([])
  const themeImageInputRef = useRef<HTMLInputElement>(null)

  const [theme, setTheme] = useState({
    name: '',
    thumbnail: '',
    tags: '',
    layout: 'single-column',
    fontKr: 'font-serif',
    fontEn: 'font-serif',
    fontSize: '16', // px
    letterSpacing: '-0.02', // em
    primaryColor: '#E8A87C',
    backgroundColor: '#FFF8F0',
    textColor: '#3A3A3A',
    secondaryColor: '#D3D3D3',
    secondaryTextColor: '#8A8A8A',
    // Custom controls
    borderRadius: '8', // px
    sectionSpacing: 'py-12',
    cardBg: 'bg-white/40',
    cardShadow: 'shadow-sm',
    dividerType: 'heart',
    heroStyle: 'center',
    sectionOrder: ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook'] as string[],
    recommendedBgms: [] as string[]
  })

  const sectionLabels: Record<string, string> = {
    hero: '대문 이미지 (Hero)',
    greeting: '인사말 (Greeting)',
    gallery: '갤러리 (Gallery)',
    calendar: '달력 (Calendar)',
    location: '예식장 위치/지도 (Location)',
    contact: '연락처 (Contact)',
    account: '축의금 송금 계좌 (Account)',
    rsvp: '참석 여부 (RSVP)',
    guestbook: '방명록 (Guestbook)'
  }

  const [customFonts, setCustomFonts] = useState<any[]>([])
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null)
  const [isSectionStyleDialogOpen, setIsSectionStyleDialogOpen] = useState(false)
  const [colorSets, setColorSets] = useState<any[]>([])
  const [fontSets, setFontSets] = useState<any[]>([])
  const [newColorSetName, setNewColorSetName] = useState('')
  const [newFontSetName, setNewFontSetName] = useState('')

  useEffect(() => {
    fetchBgms()
    fetchFonts()
    if (!isNew) {
      fetchTheme()
    }
  }, [themeId])

  const fetchBgms = async () => {
    const { data } = await supabase.from('bgms').select('*')
    if (data) setBgms(data)
  }

  const fetchFonts = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').eq('key', 'fonts')
      if (data && data.length > 0 && data[0].value) {
        setCustomFonts(data[0].value)
      }
    } catch (e) {
      console.error('Error fetching fonts in theme editor:', e)
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

    const genericFallback = (enFont === 'font-serif' || krFont === 'font-serif') ? 'serif' : 'sans-serif';
    return `${enFamily}, ${krFamily}, ${genericFallback}`;
  }


  const fetchTheme = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from('themes').select('*').eq('id', themeId).single()
    if (data) {
      setTheme({
        name: data.name || '',
        thumbnail: data.thumbnail || '',
        tags: data.tags ? data.tags.join(', ') : '',
        layout: data.layout || 'single-column',
        fontKr: data.styles?.fontKr || 'font-serif',
        fontEn: data.styles?.fontEn || 'font-serif',
        fontSize: data.styles?.fontSize?.replace('px', '') || '16',
        letterSpacing: data.styles?.letterSpacing?.replace('em', '') || '-0.02',
        primaryColor: data.styles?.primaryColor || '#E8A87C',
        backgroundColor: data.styles?.backgroundColor || '#FFF8F0',
        textColor: data.styles?.textColor || '#3A3A3A',
        secondaryColor: data.styles?.secondaryColor || '#D3D3D3',
        secondaryTextColor: data.styles?.secondaryTextColor || '#8A8A8A',
        // Custom style values
        borderRadius: data.styles?.borderRadius?.replace('px', '') || '8',
        sectionSpacing: data.styles?.sectionSpacing || 'py-12',
        cardBg: data.styles?.cardBg || 'bg-white/40',
        cardShadow: data.styles?.cardShadow || 'shadow-sm',
        dividerType: data.styles?.dividerType || 'heart',
        heroStyle: data.styles?.heroStyle || 'center',
        sectionOrder: data.styles?.sectionOrder || ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook'],
        recommendedBgms: data.recommendedBgms || []
      })
      setColorSets(data.colorSets || [{
        id: 'default',
        name: '기본 색상',
        colors: [data.styles?.backgroundColor || '#FFF8F0', data.styles?.primaryColor || '#E8A87C', data.styles?.textColor || '#3A3A3A']
      }])
      setFontSets(data.fontSets || [{
        id: 'default',
        name: '기본 폰트',
        fonts: [data.styles?.fontKr || 'font-serif', data.styles?.fontEn || 'font-serif']
      }])
    } else {
      const sample = sampleThemes.find(t => t.id === themeId)
      if (sample) {
        setTheme({
          name: sample.name,
          thumbnail: sample.thumbnail,
          tags: sample.tags.join(', '),
          layout: sample.layout || 'single-column',
          fontKr: 'font-serif',
          fontEn: 'font-serif',
          fontSize: '16',
          letterSpacing: '-0.02',
          primaryColor: sample.colorSets?.[0]?.colors?.[1] || '#E8A87C',
          backgroundColor: sample.colorSets?.[0]?.colors?.[0] || '#FFF8F0',
          textColor: sample.colorSets?.[0]?.colors?.[2] || '#3A3A3A',
          secondaryColor: '#D3D3D3',
          secondaryTextColor: '#8A8A8A',
          // Custom style values defaults
          borderRadius: '8',
          sectionSpacing: 'py-12',
          cardBg: 'bg-white/40',
          cardShadow: 'shadow-sm',
          dividerType: 'heart',
          heroStyle: 'center',
          sectionOrder: ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook'],
          recommendedBgms: sample.recommendedBgms || []
        })
        setColorSets(sample.colorSets || [])
        setFontSets(sample.fontSets || [])
      }
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!theme.name) return toast.error('테마명을 입력해주세요.')

    setIsSaving(true)

    // Sync default color set with the current editor inputs
    const updatedColorSets = colorSets.map(set => {
      if (set.id === 'default') {
        return {
          ...set,
          colors: [theme.backgroundColor, theme.primaryColor, theme.textColor]
        }
      }
      return set
    })

    if (!updatedColorSets.some(set => set.id === 'default')) {
      updatedColorSets.unshift({
        id: 'default',
        name: '기본 색상',
        colors: [theme.backgroundColor, theme.primaryColor, theme.textColor]
      })
    }

    // Sync default font set with the current editor inputs
    const updatedFontSets = fontSets.map(set => {
      if (set.id === 'default') {
        return {
          ...set,
          fonts: [theme.fontKr, theme.fontEn]
        }
      }
      return set
    })

    if (!updatedFontSets.some(set => set.id === 'default')) {
      updatedFontSets.unshift({
        id: 'default',
        name: '기본 폰트',
        fonts: [theme.fontKr, theme.fontEn]
      })
    }

    const payload = {
      id: isNew ? `theme_${Date.now()}` : themeId,
      name: theme.name,
      thumbnail: theme.thumbnail,
      tags: theme.tags.split(',').map(t => t.trim()).filter(Boolean),
      layout: theme.layout,
      recommendedBgms: theme.recommendedBgms,
      styles: {
        fontKr: theme.fontKr,
        fontEn: theme.fontEn,
        fontSize: `${theme.fontSize}px`,
        letterSpacing: `${theme.letterSpacing}em`,
        primaryColor: theme.primaryColor,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        secondaryColor: theme.secondaryColor,
        secondaryTextColor: theme.secondaryTextColor,
        // Save customized values
        borderRadius: `${theme.borderRadius}px`,
        sectionSpacing: theme.sectionSpacing,
        cardBg: theme.cardBg,
        cardShadow: theme.cardShadow,
        dividerType: theme.dividerType,
        heroStyle: theme.heroStyle,
        sectionOrder: theme.sectionOrder,
      },
      colorSets: updatedColorSets,
      fontSets: updatedFontSets,
    }

    const { error } = await supabase.from('themes').upsert(payload)
    setIsSaving(false)

    if (error) {
      toast.error('테마 저장에 실패했습니다.')
      console.error(error)
    } else {
      toast.success(isNew ? '테마가 생성되었습니다.' : '테마가 수정되었습니다.')
      if (isNew) {
        router.push(`/admin/assets/themes/${payload.id}`)
      }
    }
  }

  const handleThemeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploadingTheme(true)
    try {
      const url = await uploadFile(e.target.files[0], 'theme-thumbnails')
      setTheme({ ...theme, thumbnail: url })
    } catch (err) {
      toast.error('테마 이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingTheme(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...theme.sectionOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    setTheme({ ...theme, sectionOrder: newOrder })
  }

  const handleMoveDown = (index: number) => {
    if (index === theme.sectionOrder.length - 1) return
    const newOrder = [...theme.sectionOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    setTheme({ ...theme, sectionOrder: newOrder })
  }

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  // Preview calendar config
  const calMonth = 5
  const calYear = 2026
  const calDay = 24
  const calDays = [
    null, null, null, null, null, null, 1,
    2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, 29,
    30, 31
  ]

  const fontClass = theme.fontKr === 'font-serif' ? 'font-serif' : 'font-sans'

  const legibleTextColor = getLegibleColor(theme.backgroundColor, theme.textColor, true)
  const legiblePrimaryColor = getLegibleColor(theme.backgroundColor, theme.primaryColor, false)
  const legibleSecondaryTextColor = getLegibleColor(theme.backgroundColor, theme.secondaryTextColor, false)

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 -mt-2">
      {/* Left Panel: Settings */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background border rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin/assets')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">{isNew ? '새 테마 등록' : '테마 상세 설정'}</h2>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            저장
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>테마명</Label>
                <Input value={theme.name} onChange={e => setTheme({...theme, name: e.target.value})} placeholder="테마 이름을 입력하세요" />
              </div>
              <div className="space-y-2">
                <Label>썸네일 이미지</Label>
                <div 
                  className="flex aspect-video max-w-sm items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 cursor-pointer overflow-hidden relative group" 
                  onClick={() => themeImageInputRef.current?.click()}
                >
                  {theme.thumbnail ? (
                    <>
                      <img src={theme.thumbnail} alt="썸네일" className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      {isUploadingTheme ? (
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{isUploadingTheme ? '업로드 중...' : '이미지 업로드'}</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={themeImageInputRef} onChange={handleThemeImageUpload} disabled={isUploadingTheme} />
              </div>
              <div className="space-y-2">
                <Label>태그 (쉼표 구분)</Label>
                <Input value={theme.tags} onChange={e => setTheme({...theme, tags: e.target.value})} placeholder="ex) 모던, 심플, 블랙" />
              </div>
            </div>
          </section>
          
          <Separator />

          {/* Section 2: Typography */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">타이포그래피 설정</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>한글 폰트</Label>
                <Select value={theme.fontKr} onValueChange={v => setTheme({...theme, fontKr: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="font-sans">Pretendard / Noto Sans KR</SelectItem>
                    <SelectItem value="font-serif">Noto Serif KR / 나눔명조</SelectItem>
                    <SelectItem value="font-mono">나눔바른고딕</SelectItem>
                    {customFonts.map(font => (
                      <SelectItem key={font.id} value={font.family}>{font.name} (사용자 정의)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>영문/숫자 폰트</Label>
                <Select value={theme.fontEn} onValueChange={v => setTheme({...theme, fontEn: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="font-sans">Inter</SelectItem>
                    <SelectItem value="font-serif">Playfair Display / Lora</SelectItem>
                    <SelectItem value="font-mono">Roboto Mono</SelectItem>
                    {customFonts.map(font => (
                      <SelectItem key={font.id} value={font.family}>{font.name} (사용자 정의)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>기본 글꼴 크기 (px)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" value={theme.fontSize} onChange={e => setTheme({...theme, fontSize: e.target.value})} />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>기본 자간 (em)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.01" value={theme.letterSpacing} onChange={e => setTheme({...theme, letterSpacing: e.target.value})} />
                  <span className="text-sm text-muted-foreground">em</span>
                </div>
              </div>
            </div>

            {/* Font Set Manager */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="text-sm font-medium">등록된 폰트 조합 (Font Sets)</h4>
              <div className="space-y-2">
                {fontSets.map(set => (
                  <div key={set.id} className="flex items-center justify-between p-2.5 bg-background border rounded-md text-sm">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{set.name}</span>
                        {set.id === 'default' && <Badge variant="outline" className="text-[10px] py-0 px-1">기본</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        한글: {set.fonts[0] === 'font-sans' ? 'Pretendard' : set.fonts[0] === 'font-serif' ? 'Noto Serif KR' : set.fonts[0] === 'font-mono' ? '나눔바른고딕' : set.fonts[0]} / 
                        영문: {set.fonts[1] === 'font-sans' ? 'Inter' : set.fonts[1] === 'font-serif' ? 'Playfair Display' : set.fonts[1] === 'font-mono' ? 'Roboto Mono' : set.fonts[1]}
                      </span>
                    </div>
                    {set.id !== 'default' && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setFontSets(prev => prev.filter(s => s.id !== set.id))
                          toast.success('폰트 조합이 삭제되었습니다. 저장 버튼을 눌러야 반영됩니다.')
                        }}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="새 폰트 조합 이름 (예: 모던 고딕)" 
                  value={newFontSetName} 
                  onChange={e => setNewFontSetName(e.target.value)} 
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => {
                    if (!newFontSetName.trim()) return toast.error('이름을 입력해주세요.')
                    const newId = `font_${Date.now()}`
                    const newSet = {
                      id: newId,
                      name: newFontSetName.trim(),
                      fonts: [theme.fontKr, theme.fontEn]
                    }
                    setFontSets(prev => [...prev, newSet])
                    setNewFontSetName('')
                    toast.success('현재 선택된 폰트 조합이 추가되었습니다. 저장 버튼을 눌러야 최종 반영됩니다.')
                  }}
                >
                  현재 폰트 등록
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 3: Colors */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">색상 (Hex Code)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>배경 색상 (Background)</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded border" style={{ backgroundColor: theme.backgroundColor }}>
                    <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                  </div>
                  <Input className="flex-1 uppercase font-mono" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>포인트 색상 (Primary)</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded border" style={{ backgroundColor: theme.primaryColor }}>
                    <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                  </div>
                  <Input className="flex-1 uppercase font-mono" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>텍스트 색상 (Text)</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded border" style={{ backgroundColor: theme.textColor }}>
                    <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                  </div>
                  <Input className="flex-1 uppercase font-mono" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>보조 색상 (Secondary/Border)</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded border" style={{ backgroundColor: theme.secondaryColor }}>
                    <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.secondaryColor} onChange={e => setTheme({...theme, secondaryColor: e.target.value})} />
                  </div>
                  <Input className="flex-1 uppercase font-mono" value={theme.secondaryColor} onChange={e => setTheme({...theme, secondaryColor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>보조 텍스트 색상 (Secondary Text)</Label>
                <div className="flex gap-2">
                  <div className="h-10 w-10 rounded border" style={{ backgroundColor: theme.secondaryTextColor }}>
                    <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.secondaryTextColor} onChange={e => setTheme({...theme, secondaryTextColor: e.target.value})} />
                  </div>
                  <Input className="flex-1 uppercase font-mono" value={theme.secondaryTextColor} onChange={e => setTheme({...theme, secondaryTextColor: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Color Set Manager */}
            <div className="mt-4 p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="text-sm font-medium">등록된 컬러 조합 (Color Sets)</h4>
              <div className="space-y-2">
                {colorSets.map(set => (
                  <div key={set.id} className="flex items-center justify-between p-2.5 bg-background border rounded-md text-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {set.colors.map((c, i) => (
                          <div 
                            key={i} 
                            className="w-5 h-5 rounded-full border border-background shadow-sm" 
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{set.name}</span>
                        {set.id === 'default' && <Badge variant="outline" className="text-[10px] py-0 px-1">기본</Badge>}
                      </div>
                    </div>
                    {set.id !== 'default' && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setColorSets(prev => prev.filter(s => s.id !== set.id))
                          toast.success('컬러 조합이 삭제되었습니다. 저장 버튼을 눌러야 반영됩니다.')
                        }}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="새 컬러 조합 이름 (예: 러블리 핑크)" 
                  value={newColorSetName} 
                  onChange={e => setNewColorSetName(e.target.value)} 
                />
                <Button 
                  type="button" 
                  variant="secondary"
                  className="whitespace-nowrap"
                  onClick={() => {
                    if (!newColorSetName.trim()) return toast.error('이름을 입력해주세요.')
                    const newId = `color_${Date.now()}`
                    const newSet = {
                      id: newId,
                      name: newColorSetName.trim(),
                      colors: [theme.backgroundColor, theme.primaryColor, theme.textColor]
                    }
                    setColorSets(prev => [...prev, newSet])
                    setNewColorSetName('')
                    toast.success('현재 선택된 색상이 컬러 조합으로 추가되었습니다. 저장 버튼을 눌러야 최종 반영됩니다.')
                  }}
                >
                  현재 컬러 등록
                </Button>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 4: Layout */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">레이아웃 구조</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>전체 레이아웃</Label>
                <Select value={theme.layout} onValueChange={v => setTheme({...theme, layout: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-column">1단 레이아웃 (세로형)</SelectItem>
                    <SelectItem value="two-column">2단 레이아웃 (혼합형)</SelectItem>
                    <SelectItem value="grid">그리드 레이아웃 (포토 위주)</SelectItem>
                    <SelectItem value="minimal">미니멀 (여백 위주)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 5: 디테일 스타일 설정 (둥글기, 그림자, 구분선 등) */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">세부 디자인 스타일</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>테두리 둥글기 (Border Radius)</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="30" value={theme.borderRadius} onChange={e => setTheme({...theme, borderRadius: e.target.value})} />
                  <span className="text-sm text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>섹션 위아래 여백 (Spacing)</Label>
                <Select value={theme.sectionSpacing} onValueChange={v => setTheme({...theme, sectionSpacing: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="py-8">좁게 (py-8)</SelectItem>
                    <SelectItem value="py-12">보통 (py-12)</SelectItem>
                    <SelectItem value="py-16">넓게 (py-16)</SelectItem>
                    <SelectItem value="py-20">매우 넓게 (py-20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>카드 배경 스타일 (Card Background)</Label>
                <Select value={theme.cardBg} onValueChange={v => setTheme({...theme, cardBg: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-white">단색 흰색 (bg-white)</SelectItem>
                    <SelectItem value="bg-white/40">반투명 흰색 (bg-white/40)</SelectItem>
                    <SelectItem value="bg-black/5">밝은 그레이 (bg-black/5)</SelectItem>
                    <SelectItem value="bg-transparent">투명 배경 (bg-transparent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>카드 그림자 (Card Shadow)</Label>
                <Select value={theme.cardShadow} onValueChange={v => setTheme({...theme, cardShadow: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shadow-none">그림자 없음 (shadow-none)</SelectItem>
                    <SelectItem value="shadow-sm">약한 그림자 (shadow-sm)</SelectItem>
                    <SelectItem value="shadow-md">보통 그림자 (shadow-md)</SelectItem>
                    <SelectItem value="shadow-lg">강한 그림자 (shadow-lg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>섹션 구분선 기호 (Divider Type)</Label>
                <Select value={theme.dividerType} onValueChange={v => setTheme({...theme, dividerType: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음 (공백으로 구분)</SelectItem>
                    <SelectItem value="line">얇은 직선</SelectItem>
                    <SelectItem value="heart">하트 기호 (♥)</SelectItem>
                    <SelectItem value="space">약간의 간격</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>대문(Hero) 레이아웃 스타일</Label>
                <Select value={theme.heroStyle} onValueChange={v => setTheme({...theme, heroStyle: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">중앙 정렬 (Center)</SelectItem>
                    <SelectItem value="left">왼쪽 정렬 (Left)</SelectItem>
                    <SelectItem value="classic">클래식 스타일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 6: 청첩장 섹션 순서 및 관리 */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">청첩장 섹션 순서 및 관리</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">활성 영역은 순서를 조정(▲/▼)할 수 있으며, 비활성 시 화면에 노출되지 않습니다.</p>
              <div className="border rounded-lg divide-y bg-card text-card-foreground">
                {theme.sectionOrder.map((sectionId, index) => {
                  const label = sectionLabels[sectionId] || sectionId
                  return (
                    <div key={sectionId} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-muted-foreground mr-2">{index + 1}</span>
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[10px]" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                            ▲
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[10px]" onClick={() => handleMoveDown(index)} disabled={index === theme.sectionOrder.length - 1}>
                            ▼
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="h-7 px-2 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setTheme({ ...theme, sectionOrder: theme.sectionOrder.filter(id => id !== sectionId) })
                          }}
                        >
                          비활성화
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {/* Display inactive sections */}
                {Object.keys(sectionLabels).filter(id => !theme.sectionOrder.includes(id)).map((sectionId) => {
                  return (
                    <div key={sectionId} className="flex items-center justify-between p-3 text-sm bg-muted/30 opacity-70">
                      <span className="font-medium text-muted-foreground">{sectionLabels[sectionId]} (비활성)</span>
                      <Button 
                        variant="outline" 
                        className="h-7 px-2 text-[10px]"
                        onClick={() => {
                          setTheme({ ...theme, sectionOrder: [...theme.sectionOrder, sectionId] })
                        }}
                      >
                        활성화
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 7: Recommended BGMs */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">추천 BGM 설정</h3>
            <div className="space-y-2">
              <Label>이 테마에 어울리는 추천 음원 (다중 선택 가능)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {bgms.map(bgm => {
                  const isSelected = theme.recommendedBgms.includes(bgm.id)
                  return (
                    <Badge 
                      key={bgm.id} 
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer flex items-center gap-1.5 py-1.5 px-3"
                      onClick={() => {
                        setTheme(prev => ({
                          ...prev,
                          recommendedBgms: isSelected 
                            ? prev.recommendedBgms.filter(id => id !== bgm.id)
                            : [...prev.recommendedBgms, bgm.id]
                        }))
                      }}
                    >
                      <Music className="w-3 h-3" />
                      {bgm.name}
                    </Badge>
                  )
                })}
                {bgms.length === 0 && <span className="text-sm text-muted-foreground">등록된 BGM이 없습니다.</span>}
              </div>
            </div>
          </section>

          {/* Figma Instructions */}
          <section className="space-y-4 mt-8 p-4 bg-muted/30 rounded-lg border">
            <h3 className="text-sm font-semibold flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Figma 파일 등록 가이드</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              피그마에서 디자인한 토큰(색상, 폰트)을 직접 불러오려면 Figma REST API와 플러그인이 필요합니다.<br/>
              현재는 <strong>Figma의 Inspect 탭(혹은 Dev Mode)</strong>에서 추출한 Hex 코드와 폰트 크기를 위의 설정 패널에 그대로 옮겨 적는 방식으로 완벽하게 구현 가능합니다.<br/>
              자동 연동을 원하실 경우 VOW SEOUL 개발팀의 추가 API 통합(Figma Personal Access Token)이 필요합니다.
            </p>
          </section>
        </div>
      </div>

      {/* Right Panel: Mobile Preview */}
      <div className="w-full md:w-[400px] flex-shrink-0 bg-muted/20 border rounded-lg p-6 flex flex-col items-center justify-center shadow-inner overflow-hidden">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">실시간 모바일 미리보기</h3>
        <div 
          className="w-[320px] h-[650px] border-8 border-gray-900 rounded-[2.5rem] shadow-xl overflow-y-auto relative transition-colors duration-300 scrollbar-hide"
          style={{ 
            backgroundColor: theme.backgroundColor, 
            fontSize: `${theme.fontSize}px`,
            letterSpacing: `${theme.letterSpacing}em`,
            fontFamily: getFontFamily(theme.fontKr, theme.fontEn)
          }}
        >
          {/* Top Notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl mx-24 z-20"></div>

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

          {/* Preview Content */}
          <div className={cn("pb-12 text-center select-none", fontClass)} style={{ color: legibleTextColor, fontFamily: getFontFamily(theme.fontKr, theme.fontEn) }}>
            {theme.sectionOrder.map((sectionId, idx) => {
              // Layout-specific styling rules
              const isMinimal = theme.layout === 'minimal'
              const isGrid = theme.layout === 'grid'
              const isTwoColumn = theme.layout === 'two-column'

              const borderStyle = { borderRadius: isGrid ? '0px' : `${theme.borderRadius}px` }
              const shadowClass = isMinimal ? 'shadow-none' : theme.cardShadow
              
              let spacingClass = theme.sectionSpacing // py-8, py-12, py-16, py-20
              if (isMinimal) {
                if (theme.sectionSpacing === 'py-8') spacingClass = 'py-16'
                else if (theme.sectionSpacing === 'py-12') spacingClass = 'py-24'
                else if (theme.sectionSpacing === 'py-16') spacingClass = 'py-32'
                else if (theme.sectionSpacing === 'py-20') spacingClass = 'py-40'
              }

              const isEven = idx % 2 === 0
              const sectionBg = isMinimal ? 'bg-transparent' : (isEven ? 'bg-white/40 backdrop-blur-sm' : 'bg-black/5')
              const sectionBorderClass = isGrid ? 'border border-current/15 mx-2 my-2' : ''
              const effectiveCardBg = isMinimal ? 'bg-transparent' : theme.cardBg

              const renderDivider = () => {
                if (theme.dividerType === 'line') {
                  return <div className="mx-auto my-6 h-px w-24 bg-current opacity-20" />
                }
                if (theme.dividerType === 'heart') {
                  return <div className="text-center opacity-40 my-6 text-[10px]" style={{ color: legiblePrimaryColor }}>♥</div>
                }
                if (theme.dividerType === 'space') {
                  return <div className="my-6 h-4" />
                }
                return null
              }

              const sectionContent = (() => {
                switch (sectionId) {
                  case 'hero':
                    return (
                      <div key="hero" className="relative h-[320px] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                        {theme.thumbnail && (
                          <div className="absolute inset-0 z-0">
                            <img src={theme.thumbnail} alt="Main Visual" className="w-full h-full object-cover opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-t" style={{ backgroundImage: `linear-gradient(to top, ${theme.backgroundColor}, transparent, ${theme.backgroundColor}80)` }} />
                          </div>
                        )}
                        <div className="space-y-4 z-10 w-full max-w-[200px] mx-auto">
                          <p className="text-[10px] tracking-[0.3em] opacity-60">WEDDING INVITATION</p>
                          
                          {theme.heroStyle === 'left' ? (
                            <div className="space-y-2 text-left w-full">
                              <div>
                                {theme.name && <p className="text-[8px] opacity-75">{theme.name}</p>}
                                <h1 className="text-xl font-light">홍길동</h1>
                              </div>
                              <div className="text-xs opacity-50">&amp;</div>
                              <div>
                                {theme.name && <p className="text-[8px] opacity-75">{theme.name}</p>}
                                <h1 className="text-xl font-light">김영희</h1>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="space-y-0.5">
                                <p className="text-[8px] opacity-75">신랑 혼주 정보</p>
                                <h1 className="text-xl font-light">홍길동</h1>
                              </div>
                              <div className="text-md" style={{ color: legiblePrimaryColor }}>&amp;</div>
                              <div className="space-y-0.5">
                                <p className="text-[8px] opacity-75">신부 혼주 정보</p>
                                <h1 className="text-xl font-light">김영희</h1>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  case 'greeting':
                    return (
                      <section key="greeting" className={cn(spacingClass, "px-4 text-center", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <Heart className="w-4 h-4 mx-auto mb-3 opacity-60" style={{ color: legiblePrimaryColor }} />
                        <p className="leading-relaxed text-[10px] opacity-80">
                          서로 다른 길을 걸어온 저희 두 사람이<br/>이제 하나의 길을 함께 걸어가려 합니다.<br/>오셔서 축복해주시면 감사하겠습니다.
                        </p>
                      </section>
                    )
                  case 'gallery':
                    return (
                      <section key="gallery" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-4">GALLERY</h2>
                        <div className={cn("grid gap-1.5", isTwoColumn ? "grid-cols-3" : "grid-cols-2")}>
                          <div className="aspect-square bg-black/10 rounded-md" style={borderStyle} />
                          <div className="aspect-square bg-black/10 rounded-md" style={borderStyle} />
                          {isTwoColumn && <div className="aspect-square bg-black/10 rounded-md" style={borderStyle} />}
                        </div>
                      </section>
                    )
                  case 'calendar':
                    return (
                      <section key="calendar" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-4">CALENDAR</h2>
                        <Card className={cn("border-0 shadow-none", effectiveCardBg)} style={borderStyle}>
                          <CardContent className="p-3">
                            <div className="text-center mb-2">
                              <p className="text-sm font-medium" style={{ color: legiblePrimaryColor }}>{calMonth}</p>
                              <p className="text-[9px] opacity-40">{calYear}</p>
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 text-center text-[8px]">
                              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                                <div key={day} className="py-0.5 opacity-55 font-semibold">{day}</div>
                              ))}
                              {calDays.map((day, i) => {
                                if (day === null) return <div key={`empty-${i}`} />
                                return (
                                  <div
                                    key={i}
                                    className="py-0.5 text-[8px] flex items-center justify-center w-5 h-5 mx-auto rounded-full"
                                    style={day === calDay ? { backgroundColor: legiblePrimaryColor, color: '#fff', fontWeight: 'bold' } : { color: legibleSecondaryTextColor }}
                                  >
                                    {day}
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </section>
                    )
                  case 'location':
                    return (
                      <section key="location" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-4">LOCATION</h2>
                        <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                          <CardContent className="p-3 text-left space-y-2">
                            <div>
                              <h3 className="font-semibold text-[10px]">예식장명</h3>
                              <p className="text-[8px]" style={{ color: legibleSecondaryTextColor }}>서울특별시 용산구 소월로 322</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="flex-1 text-[9px] h-6 px-0" style={borderStyle}>
                                네이버지도
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 text-[9px] h-6 px-0" style={borderStyle}>
                                카카오맵
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </section>
                    )
                  case 'contact':
                    return (
                      <section key="contact" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-4">CONTACT</h2>
                        <div className="grid grid-cols-2 gap-2">
                          <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                            <CardContent className="p-2 text-center">
                              <p className="text-[9px] mb-0.5" style={{ color: legibleSecondaryTextColor }}>신랑</p>
                              <p className="font-semibold text-[10px] mb-1.5 truncate">홍길동</p>
                              <Button variant="outline" size="sm" className="w-full text-[9px] h-6 px-0" style={borderStyle}>
                                전화
                              </Button>
                            </CardContent>
                          </Card>
                          <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                            <CardContent className="p-2 text-center">
                              <p className="text-[9px] mb-0.5" style={{ color: legibleSecondaryTextColor }}>신부</p>
                              <p className="font-semibold text-[10px] mb-1.5 truncate">김영희</p>
                              <Button variant="outline" size="sm" className="w-full text-[9px] h-6 px-0" style={borderStyle}>
                                전화
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </section>
                    )
                  case 'account':
                    return (
                      <section key="account" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-1">ACCOUNT</h2>
                        <p className="text-center text-[9px] opacity-40 mb-4">마음 전하실 곳</p>
                        <div className={cn("space-y-2", isTwoColumn && "grid grid-cols-2 gap-2 space-y-0")}>
                          <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                            <CardContent className="p-2.5 flex items-center justify-between text-left">
                              <div>
                                <p className="text-[9px]" style={{ color: legibleSecondaryTextColor }}>신랑측</p>
                                <p className="font-semibold text-[10px]">신한은행 110-123-456789</p>
                              </div>
                              <Button variant="outline" size="sm" className="h-6 w-6 p-0" style={borderStyle}>
                                <Copy className="w-3 h-3" />
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </section>
                    )
                  case 'rsvp':
                    return (
                      <section key="rsvp" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-1">RSVP</h2>
                        <p className="text-center text-[9px] opacity-40 mb-4">참석 여부를 알려주세요</p>
                        <Button className="w-full text-[10px] text-white h-8" style={{ backgroundColor: legiblePrimaryColor, ...borderStyle }}>
                          참석 의사 전달하기
                        </Button>
                      </section>
                    )
                  case 'guestbook':
                    return (
                      <section key="guestbook" className={cn(spacingClass, "px-4", sectionBg, sectionBorderClass)} style={isGrid ? borderStyle : undefined}>
                        {renderDivider()}
                        <h2 className="text-center text-[10px] font-semibold tracking-wider mb-4">GUESTBOOK</h2>
                        <Card className={cn("border-0", effectiveCardBg, shadowClass)} style={borderStyle}>
                          <CardContent className="p-2.5 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-[9px]">하객 성함</span>
                              <span className="text-[8px] opacity-40">2026.06.03</span>
                            </div>
                            <p className="text-[9px] opacity-70">결혼을 진심으로 축하드립니다!</p>
                          </CardContent>
                        </Card>
                      </section>
                    )
                  default:
                    return null
                }
              })()

              if (!sectionContent) return null

              return (
                <div
                  key={sectionId}
                  onClick={() => {
                    setActiveEditSection(sectionId)
                    setIsSectionStyleDialogOpen(true)
                  }}
                  className={cn(
                    "relative group cursor-pointer border-2 border-transparent hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 rounded-lg my-1",
                    activeEditSection === sectionId && "border-primary bg-primary/5"
                  )}
                >
                  <div className="absolute top-1.5 right-1.5 bg-primary text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                    {sectionLabels[sectionId] || sectionId} 스타일 수정
                  </div>
                  {sectionContent}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Visual Section Style Customizer Dialog */}
      <Dialog open={isSectionStyleDialogOpen} onOpenChange={setIsSectionStyleDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeEditSection ? sectionLabels[activeEditSection] : '섹션'} 스타일 커스텀
            </DialogTitle>
            <DialogDescription>
              이 섹션에 적용할 색상, 크기, 여백, 자간 등을 직접 수정하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Color section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">색상 설정</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>배경 색상</Label>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded border flex-shrink-0" style={{ backgroundColor: theme.backgroundColor }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                    </div>
                    <Input className="h-8 text-xs uppercase font-mono" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>포인트 색상</Label>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded border flex-shrink-0" style={{ backgroundColor: theme.primaryColor }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                    </div>
                    <Input className="h-8 text-xs uppercase font-mono" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>텍스트 색상</Label>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded border flex-shrink-0" style={{ backgroundColor: theme.textColor }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                    </div>
                    <Input className="h-8 text-xs uppercase font-mono" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>보조 색상 (테두리)</Label>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded border flex-shrink-0" style={{ backgroundColor: theme.secondaryColor }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.secondaryColor} onChange={e => setTheme({...theme, secondaryColor: e.target.value})} />
                    </div>
                    <Input className="h-8 text-xs uppercase font-mono" value={theme.secondaryColor} onChange={e => setTheme({...theme, secondaryColor: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>보조 텍스트 색상</Label>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 rounded border flex-shrink-0" style={{ backgroundColor: theme.secondaryTextColor }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={theme.secondaryTextColor} onChange={e => setTheme({...theme, secondaryTextColor: e.target.value})} />
                    </div>
                    <Input className="h-8 text-xs uppercase font-mono" value={theme.secondaryTextColor} onChange={e => setTheme({...theme, secondaryTextColor: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>카드 배경 스타일</Label>
                  <Select value={theme.cardBg} onValueChange={v => setTheme({...theme, cardBg: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-white">단색 흰색 (bg-white)</SelectItem>
                      <SelectItem value="bg-white/40">반투명 흰색 (bg-white/40)</SelectItem>
                      <SelectItem value="bg-black/5">밝은 그레이 (bg-black/5)</SelectItem>
                      <SelectItem value="bg-transparent">투명 배경 (bg-transparent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Typography & Sizes */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">글꼴 및 크기 설정</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>기본 글꼴 크기</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" className="h-8 text-xs" value={theme.fontSize} onChange={e => setTheme({...theme, fontSize: e.target.value})} />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>기본 자간</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" step="0.01" className="h-8 text-xs" value={theme.letterSpacing} onChange={e => setTheme({...theme, letterSpacing: e.target.value})} />
                    <span className="text-xs text-muted-foreground">em</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>한글 폰트</Label>
                  <Select value={theme.fontKr} onValueChange={v => setTheme({...theme, fontKr: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="font-sans">Pretendard / Noto Sans KR</SelectItem>
                      <SelectItem value="font-serif">Noto Serif KR / 나눔명조</SelectItem>
                      <SelectItem value="font-mono">나눔바른고딕</SelectItem>
                      {customFonts.map(font => (
                        <SelectItem key={font.id} value={font.family}>{font.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>영문/숫자 폰트</Label>
                  <Select value={theme.fontEn} onValueChange={v => setTheme({...theme, fontEn: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="font-sans">Inter</SelectItem>
                      <SelectItem value="font-serif">Playfair Display / Lora</SelectItem>
                      <SelectItem value="font-mono">Roboto Mono</SelectItem>
                      {customFonts.map(font => (
                        <SelectItem key={font.id} value={font.family}>{font.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Layout details */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">세부 디자인 스타일</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>테두리 둥글기</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="number" min="0" max="30" className="h-8 text-xs" value={theme.borderRadius} onChange={e => setTheme({...theme, borderRadius: e.target.value})} />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>섹션 위아래 여백</Label>
                  <Select value={theme.sectionSpacing} onValueChange={v => setTheme({...theme, sectionSpacing: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="py-8">좁게 (py-8)</SelectItem>
                      <SelectItem value="py-12">보통 (py-12)</SelectItem>
                      <SelectItem value="py-16">넓게 (py-16)</SelectItem>
                      <SelectItem value="py-20">매우 넓게 (py-20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>카드 그림자</Label>
                  <Select value={theme.cardShadow} onValueChange={v => setTheme({...theme, cardShadow: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shadow-none">그림자 없음 (shadow-none)</SelectItem>
                      <SelectItem value="shadow-sm">약한 그림자 (shadow-sm)</SelectItem>
                      <SelectItem value="shadow-md">보통 그림자 (shadow-md)</SelectItem>
                      <SelectItem value="shadow-lg">강한 그림자 (shadow-lg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>섹션 구분선 기호</Label>
                  <Select value={theme.dividerType} onValueChange={v => setTheme({...theme, dividerType: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음 (공백으로 구분)</SelectItem>
                      <SelectItem value="line">얇은 직선</SelectItem>
                      <SelectItem value="heart">하트 기호 (♥)</SelectItem>
                      <SelectItem value="space">약간의 간격</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Conditional section-specific settings */}
              {activeEditSection === 'hero' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5 col-span-2">
                    <Label>대문(Hero) 레이아웃 스타일</Label>
                    <Select value={theme.heroStyle} onValueChange={v => setTheme({...theme, heroStyle: v})}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">중앙 정렬 (Center)</SelectItem>
                        <SelectItem value="left">왼쪽 정렬 (Left)</SelectItem>
                        <SelectItem value="classic">클래식 스타일</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5 col-span-2">
                  <Label>전체 레이아웃</Label>
                  <Select value={theme.layout} onValueChange={v => setTheme({...theme, layout: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-column">1단 레이아웃 (세로형)</SelectItem>
                      <SelectItem value="two-column">2단 레이아웃 (혼합형)</SelectItem>
                      <SelectItem value="grid">그리드 레이아웃 (포토 위주)</SelectItem>
                      <SelectItem value="minimal">미니멀 (여백 위주)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <Button className="w-full" onClick={() => setIsSectionStyleDialogOpen(false)}>
            설정 적용 완료
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
