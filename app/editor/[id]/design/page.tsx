'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAppStore, sampleThemes, Theme } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export default function DesignPage() {
  const router = useRouter()
  const params = useParams()
  const { currentInvitation, updateCurrentInvitation, saveInvitation } = useAppStore()
  const invitationId = params.id as string

  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchThemes = async () => {
      const { data } = await supabase.from('themes').select('*')
      if (data && data.length > 0) {
        setThemes(data as any)
      } else {
        setThemes(sampleThemes)
      }
      setIsLoading(false)
    }
    fetchThemes()
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
            onValueChange={(value) => updateCurrentInvitation({ fontSet: value })}
            className="grid gap-4 sm:grid-cols-2"
          >
            {selectedTheme?.fontSets?.map((fontSet) => (
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
                >
                  <span className="font-medium">{fontSet.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {fontSet.fonts.join(' + ')}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
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
