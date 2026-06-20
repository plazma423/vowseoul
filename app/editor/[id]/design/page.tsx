'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, sampleThemes, Theme } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

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

export default function DesignPage() {
  const router = useRouter()
  const params = useParams()
  const { currentInvitation, updateCurrentInvitation, saveInvitation } = useAppStore()
  const invitationId = params.id as string

  const [themes, setThemes] = useState<Theme[]>([])
  const [customFonts, setCustomFonts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchThemesAndFonts = async () => {
      const { data: themeData } = await supabase.from('themes').select('*')
      if (themeData && themeData.length > 0) {
        setThemes(themeData as any)
      } else {
        setThemes(sampleThemes)
      }
      
      try {
        const { data: fontData } = await supabase.from('settings').select('*').eq('key', 'fonts')
        if (fontData && fontData.length > 0 && fontData[0].value) {
          setCustomFonts(fontData[0].value)
        }
      } catch (err) {
        console.error('Error fetching fonts in DesignPage:', err)
      }
      
      setIsLoading(false)
    }
    fetchThemesAndFonts()
  }, [])

  const selectedTheme = themes.find(t => t.id === currentInvitation?.themeId) || themes[0]

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  const handleNext = async () => {
    const savedId = await saveInvitation()
    const targetId = savedId || invitationId
    router.push(`/editor/${targetId}/content`)
  }

  const handleBack = () => {
    router.push(`/editor/${invitationId}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">디자인/테마</h1>
        <p className="mt-1 text-muted-foreground">
          청첩장의 테마와 스타일을 선택해주세요.
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">테마 선택</CardTitle>
          <CardDescription>원하는 분위기의 테마를 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => {
              const isSelected = currentInvitation?.themeId === theme.id
              const defaultBg = theme.colorSets?.[0]?.colors?.[0] || theme.styles?.backgroundColor || '#FFF8F0';
              const defaultText = theme.colorSets?.[0]?.colors?.[2] || theme.styles?.textColor || '#3A3A3A';
              const defaultPrimary = theme.colorSets?.[0]?.colors?.[1] || theme.styles?.primaryColor || '#E8A87C';

              return (
                <button
                  key={theme.id}
                  onClick={() => updateCurrentInvitation({ 
                    themeId: theme.id,
                    colorSet: theme.colorSets?.[0]?.id || 'default',
                    fontSet: theme.fontSets?.[0]?.id || 'default',
                  })}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border-2 text-left transition-all',
                    isSelected ? 'border-foreground' : 'border-border hover:border-foreground/50'
                  )}
                >
                  {/* Theme Preview */}
                  <div 
                    className="aspect-[3/4] p-4"
                    style={{ backgroundColor: defaultBg }}
                  >
                    <div 
                      className="flex h-full flex-col items-center justify-center text-center"
                      style={{ color: defaultText }}
                    >
                      <p className="text-[8px] tracking-[0.2em] opacity-60">WEDDING</p>
                      <p className="mt-1 font-serif text-sm">Groom</p>
                      <p className="text-xs opacity-60">&amp;</p>
                      <p className="font-serif text-sm">Bride</p>
                      <div 
                        className="mt-3 h-12 w-10 rounded-sm"
                        style={{ backgroundColor: defaultPrimary }}
                      />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="border-t border-border bg-background p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{theme.name}</span>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground">
                          <Check className="h-3 w-3 text-background" />
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(Array.isArray(theme.tags) ? theme.tags : []).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Set Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">컬러셋</CardTitle>
          <CardDescription>테마에 어울리는 색상 조합을 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentInvitation?.colorSet || selectedTheme?.colorSets?.[0]?.id || 'default'}
            onValueChange={(value) => updateCurrentInvitation({ colorSet: value })}
            className="grid gap-4 sm:grid-cols-2"
          >
            {selectedTheme?.colorSets?.map((colorSet) => (
              <div key={colorSet.id}>
                <RadioGroupItem
                  value={colorSet.id}
                  id={`color-${colorSet.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`color-${colorSet.id}`}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-all',
                    'peer-data-[state=checked]:border-foreground peer-data-[state=unchecked]:border-border',
                    'hover:border-foreground/50'
                  )}
                >
                  <div className="flex gap-1">
                    {colorSet.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{colorSet.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* 직접 설정하기 Toggle */}
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="custom-colors-toggle" className="text-sm font-medium">직접 설정하기 (커스텀 듀오톤)</Label>
                <p className="text-xs text-muted-foreground">테마 프리셋 대신 내가 원하는 두 가지 색상 조합으로 청첩장을 꾸밉니다.</p>
              </div>
              <Switch 
                id="custom-colors-toggle"
                checked={currentInvitation?.customStyles?.customColorsEnabled || false}
                onCheckedChange={(checked) => {
                  updateCurrentInvitation({
                    customStyles: {
                      ...(currentInvitation?.customStyles || {}),
                      customColorsEnabled: checked,
                      duotoneEnabled: checked // automatically enable duotone alternating if custom colors are used
                    }
                  })
                }}
              />
            </div>

            {currentInvitation?.customStyles?.customColorsEnabled && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label className="text-xs">배경 색상 (Color 1 - 밝은색 권장)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-10 h-10 p-1 cursor-pointer border" 
                      value={currentInvitation?.customStyles?.customBgColor || '#CCECFF'} 
                      onChange={(e) => {
                        updateCurrentInvitation({
                          customStyles: {
                            ...(currentInvitation?.customStyles || {}),
                            customBgColor: e.target.value
                          }
                        })
                      }}
                    />
                    <Input 
                      className="flex-1 uppercase font-mono text-sm" 
                      value={currentInvitation?.customStyles?.customBgColor || '#CCECFF'} 
                      onChange={(e) => {
                        updateCurrentInvitation({
                          customStyles: {
                            ...(currentInvitation?.customStyles || {}),
                            customBgColor: e.target.value
                          }
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">주요 색상 (Color 2 - 어두운색 권장)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-10 h-10 p-1 cursor-pointer border" 
                      value={currentInvitation?.customStyles?.customPrimaryColor || '#361623'} 
                      onChange={(e) => {
                        updateCurrentInvitation({
                          customStyles: {
                            ...(currentInvitation?.customStyles || {}),
                            customPrimaryColor: e.target.value
                          }
                        })
                      }}
                    />
                    <Input 
                      className="flex-1 uppercase font-mono text-sm" 
                      value={currentInvitation?.customStyles?.customPrimaryColor || '#361623'} 
                      onChange={(e) => {
                        updateCurrentInvitation({
                          customStyles: {
                            ...(currentInvitation?.customStyles || {}),
                            customPrimaryColor: e.target.value
                          }
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Font Set Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">폰트 조합</CardTitle>
          <CardDescription>청첩장에 사용될 폰트 스타일을 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentInvitation?.fontSet || selectedTheme?.fontSets?.[0]?.id || 'default'}
            onValueChange={(value) => {
              const updatedStyles = { ...(currentInvitation?.customStyles || {}) }
              delete updatedStyles.fontKr
              delete updatedStyles.fontEn
              updateCurrentInvitation({ 
                fontSet: value,
                customStyles: updatedStyles
              })
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {selectedTheme?.fontSets?.map((fontSet) => {
              const krFont = fontSet.fonts[0] || 'font-sans'
              const enFont = fontSet.fonts[1] || 'font-sans'
              const fontFamilyVal = getFontFamily(krFont, enFont)

              return (
                <div key={fontSet.id}>
                  <RadioGroupItem
                    value={fontSet.id}
                    id={`font-${fontSet.id}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`font-${fontSet.id}`}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-4 transition-all',
                      'peer-data-[state=checked]:border-foreground peer-data-[state=unchecked]:border-border',
                      'hover:border-foreground/50'
                    )}
                    style={{ fontFamily: fontFamilyVal }}
                  >
                    <span className="font-semibold text-base">{fontSet.name}</span>
                    <span className="text-sm opacity-85 py-1">
                      신랑 신부 결혼합니다. Groom & Bride
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 pt-1 border-t border-muted/20">
                      {fontSet.fonts.join(' + ')}
                    </span>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Hero Subtitle settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">히어로 서브타이틀 설정 (대문 이미지 문구)</CardTitle>
          <CardDescription>청첩장 최상단 대문 섹션에 표시될 영어 서브타이틀의 문구와 스타일을 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">타이틀 문구</Label>
              <Input 
                value={currentInvitation?.customStyles?.heroSubtitleText ?? 'save the date'} 
                placeholder="save the date" 
                onChange={(e) => {
                  updateCurrentInvitation({
                    customStyles: {
                      ...(currentInvitation?.customStyles || {}),
                      heroSubtitleText: e.target.value
                    }
                  })
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">폰트 선택</Label>
              <Select
                value={currentInvitation?.customStyles?.heroSubtitleFont || 'font-serif'}
                onValueChange={(val) => {
                  updateCurrentInvitation({
                    customStyles: {
                      ...(currentInvitation?.customStyles || {}),
                      heroSubtitleFont: val
                    }
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="font-serif">기본 명조체 (Playfair / Lora)</SelectItem>
                  <SelectItem value="font-sans">기본 고딕체 (Inter)</SelectItem>
                  {customFonts.map((font) => (
                    <SelectItem key={font.id} value={font.family}>{font.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">폰트 크기</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min="10" 
                  max="60" 
                  value={currentInvitation?.customStyles?.heroSubtitleSize ?? 20} 
                  onChange={(e) => {
                    updateCurrentInvitation({
                      customStyles: {
                        ...(currentInvitation?.customStyles || {}),
                        heroSubtitleSize: parseInt(e.target.value) || 20
                      }
                    })
                  }}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">px</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          이전 단계
        </Button>
        <Button onClick={handleNext}>
          다음 단계
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
