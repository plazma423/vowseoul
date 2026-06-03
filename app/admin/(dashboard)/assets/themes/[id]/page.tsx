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
import { ChevronLeft, Save, Upload, Loader2, Link as LinkIcon, Music } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { sampleThemes } from '@/lib/store'

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
    recommendedBgms: [] as string[]
  })

  useEffect(() => {
    fetchBgms()
    if (!isNew) {
      fetchTheme()
    }
  }, [themeId])

  const fetchBgms = async () => {
    const { data } = await supabase.from('bgms').select('*')
    if (data) setBgms(data)
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
        recommendedBgms: data.recommendedBgms || []
      })
    } else {
      // Fallback to sample themes if not found in DB
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
          primaryColor: sample.colorSets[0]?.colors[1] || '#E8A87C',
          backgroundColor: sample.colorSets[0]?.colors[0] || '#FFF8F0',
          textColor: sample.colorSets[0]?.colors[2] || '#3A3A3A',
          secondaryColor: '#D3D3D3',
          recommendedBgms: []
        })
      }
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!theme.name) return toast.error('테마명을 입력해주세요.')

    setIsSaving(true)
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
      },
      colorSets: [{
        id: 'default',
        name: '기본 색상',
        colors: [theme.backgroundColor, theme.primaryColor, theme.textColor]
      }],
      fontSets: [{
        id: 'default',
        name: '기본 폰트',
        fonts: [theme.fontKr, theme.fontEn]
      }]
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

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <SelectItem value="font-maru">마루부리</SelectItem>
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
                    <SelectItem value="font-cormorant">Cormorant Garamond</SelectItem>
                    <SelectItem value="font-outfit">Outfit</SelectItem>
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

          {/* Section 5: Recommended BGMs */}
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
          className="w-[320px] h-[650px] bg-white border-8 border-gray-900 rounded-[2.5rem] shadow-xl overflow-y-auto relative transition-colors duration-300 scrollbar-hide"
          style={{ 
            backgroundColor: theme.backgroundColor, 
            color: theme.textColor,
            fontSize: `${theme.fontSize}px`,
            letterSpacing: `${theme.letterSpacing}em`
          }}
        >
          {/* Top Notch */}
          <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl mx-24 z-20"></div>

          {/* Preview Content */}
          <div className="p-6 pt-12 space-y-12">
            <div className={`text-center space-y-4 ${theme.fontEn}`}>
              <p className="tracking-widest uppercase text-[0.8em]" style={{ color: theme.primaryColor }}>Wedding Invitation</p>
              <h1 className={`text-3xl ${theme.fontKr}`}>{theme.name || '테마 이름'}</h1>
              <p className="text-[0.9em] opacity-80 mt-2">2026. 05. 24. SAT 12:00 PM</p>
            </div>
            
            <div className="aspect-[3/4] bg-muted w-full rounded-md overflow-hidden relative border" style={{ borderColor: theme.secondaryColor }}>
              {theme.thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={theme.thumbnail} alt="미리보기 썸네일" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Image Preview
                </div>
              )}
            </div>

            <div className={`text-center space-y-4 leading-loose ${theme.fontKr}`}>
              <p>서로 다른 길을 걸어온 저희 두 사람이<br/>이제 하나의 길을 함께 걸어가려 합니다.</p>
              <p>귀한 걸음 하시어 축복해 주시면<br/>큰 기쁨으로 간직하겠습니다.</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="outline" 
                className="w-full rounded-full transition-colors"
                style={{ 
                  borderColor: theme.primaryColor, 
                  color: theme.primaryColor,
                  backgroundColor: 'transparent'
                }}
              >
                갤러리 보기
              </Button>
              <Button 
                className="w-full rounded-full transition-colors"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor
                }}
              >
                마음 전하실 곳
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
