'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function HeroSection() {
  const [bgImageUrl, setBgImageUrl] = useState<string>('')
  const [heroContent, setHeroContent] = useState({
    title: "소중한 서약을\n담아드립니다",
    description: "손 쉽게 완성하는 당신만의 특별한 웨딩 초대장.\n우아하고 세련된 모바일 청첩장을 직접 만들어보세요.",
    fontFamily: "font-serif",
    titleFontSize: "text-5xl",
    descFontSize: "text-base",
    layout: "text-center"
  })

  useEffect(() => {
    const fetchMainImage = async () => {
      // 1. 설정 테이블에서 현재 저장된 메인 이미지 경로 가져오기
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'main_image')
        .single()

      const imagePath = settingData?.value?.path || 'main-images/image1'
      
      // 2. Supabase Storage에서 Public URL 가져오기
      const { data } = supabase.storage.from('vow-seoul-storage').getPublicUrl(imagePath)
      
      if (data?.publicUrl) {
        setBgImageUrl(data.publicUrl)
      }

      // 3. 메인 텍스트 설정 가져오기
      const { data: textData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'hero_content')
        .single()
        
      if (textData?.value) {
        setHeroContent(textData.value)
      }
    }
    fetchMainImage()
  }, [])

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-black/50">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: bgImageUrl ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('${bgImageUrl}')` : 'none',
        }}
      />
      
      {/* Content */}
      <div className={`relative z-10 px-4 w-full max-w-5xl mx-auto ${heroContent.layout}`}>
        <p className="mb-4 text-sm tracking-[0.4em] text-white/80">VOW SEOUL</p>
        <h1 className={`mb-6 font-light leading-tight tracking-wide text-white ${heroContent.fontFamily} ${heroContent.titleFontSize}`}>
          {heroContent.title.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i !== heroContent.title.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className={`mb-10 max-w-lg leading-relaxed text-white/80 ${heroContent.descFontSize} ${heroContent.layout === 'text-center' ? 'mx-auto' : heroContent.layout === 'text-right' ? 'ml-auto' : ''}`}>
          {heroContent.description.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i !== heroContent.description.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
        <div className={`flex flex-col gap-4 sm:flex-row ${heroContent.layout === 'text-left' ? 'sm:justify-start items-start' : heroContent.layout === 'text-right' ? 'sm:justify-end items-end' : 'justify-center items-center'}`}>
          <Button 
            size="lg" 
            className="min-w-[180px] bg-white text-foreground hover:bg-white/90"
            asChild
          >
            <Link href="/templates">디자인 템플릿</Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="min-w-[180px] border-white text-white bg-transparent hover:bg-white/10"
            asChild
          >
            <Link href="/editor/new">직접 디자인하기</Link>
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs tracking-widest text-white/60">SCROLL</span>
          <div className="h-8 w-px bg-white/40" />
        </div>
      </div>
    </section>
  )
}
