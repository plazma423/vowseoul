'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MobilePreview } from '@/components/mobile-preview'
import { useAppStore, sampleThemes, samplePhrases, type BankAccount, type Contact, type Order } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { ChevronLeft, Save, Upload, Loader2, Plus, Trash2, Play, Pause, FileText, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { 
    currentInvitation, 
    setCurrentInvitation, 
    updateCurrentInvitation,
    themes,
    fetchData
  } = useAppStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [bgms, setBgms] = useState<any[]>([])
  const [customFonts, setCustomFonts] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('order')

  // Upload States
  const [isUploadingMain, setIsUploadingMain] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [isUploadingKakao, setIsUploadingKakao] = useState(false)

  // Dialog / Modal States
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    bank: '',
    accountNumber: '',
    accountHolder: '',
    relation: 'groom' as 'groom' | 'bride' | 'groomParent' | 'brideParent'
  })

  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: 'groom'
  })

  const [showMessageModal, setShowMessageModal] = useState(false)

  // Audio Play States
  const [playingBgmUrl, setPlayingBgmUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Refs
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const kakaoImageInputRef = useRef<HTMLInputElement>(null)

  // Load Initial Data
  useEffect(() => {
    fetchData()
    fetchBgms()
    fetchFonts()
    loadOrderAndInvitation()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [orderId])

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
      console.error('Error fetching fonts:', e)
    }
  }

  const loadOrderAndInvitation = async () => {
    setIsLoading(true)
    try {
      // 1. Load Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      if (orderData) {
        setOrder(orderData)

        // 2. Load Invitation
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('id', orderData.invitationId)
          .single()

        if (inviteError) throw inviteError
        if (inviteData) {
          // Normalize customStyles in case it is null/undefined
          const normalizedInvitation = {
            ...inviteData,
            customStyles: inviteData.customStyles || {}
          }
          setCurrentInvitation(normalizedInvitation)
        }
      }
    } catch (err: any) {
      console.error('Error loading order or invitation:', err)
      toast.error('주문 정보 또는 청첩장을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!order || !currentInvitation) return
    setIsSaving(true)
    try {
      // 1. Update Order in DB
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          customerName: order.customerName,
          amount: order.amount,
          status: order.status,
          notes: order.notes,
          weddingDate: currentInvitation.weddingDate || order.weddingDate
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // 2. Update Invitation in DB
      const { error: inviteError } = await supabase
        .from('invitations')
        .update(currentInvitation)
        .eq('id', currentInvitation.id)

      if (inviteError) throw inviteError

      toast.success('설정이 성공적으로 저장되었습니다!')
    } catch (err: any) {
      console.error('Error saving configurations:', err)
      
      const isMissingColumn = err.code === 'PGRST204' || 
                              (err.message && (err.message.includes('customStyles') || err.message.includes('column')));
      
      if (isMissingColumn) {
        toast.error(
          'Supabase 테이블에 "customStyles" 컬럼이 없거나 캐시되지 않았습니다. Supabase SQL Editor에서 ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS "customStyles" jsonb; 를 실행해주세요.',
          { duration: 8000 }
        )
      } else {
        toast.error(err.message || '저장 중 오류가 발생했습니다.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Address lookup via Daum Postcode API
  const handleAddressSearch = () => {
    const script = document.createElement('script')
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          let fullAddr = data.address
          let extraAddr = ''
          if(data.addressType === 'R'){
            if(data.bname !== ''){
              extraAddr += data.bname
            }
            if(data.buildingName !== ''){
              extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName)
            }
            fullAddr += (extraAddr !== '' ? ' ('+ extraAddr +')' : '')
          }
          updateCurrentInvitation({ venueAddress: fullAddr })
        }
      }).open()
    }
    document.body.appendChild(script)
  }

  // Image Upload Handlers
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploadingMain(true)
    try {
      const url = await uploadFile(e.target.files[0], 'main-images')
      updateCurrentInvitation({ mainImage: url })
      toast.success('대문 사진이 업로드되었습니다.')
    } catch (err) {
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingMain(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploadingGallery(true)
    try {
      const urls = []
      for (const file of Array.from(e.target.files)) {
        const url = await uploadFile(file, 'gallery')
        urls.push(url)
      }
      const currentImages = currentInvitation?.galleryImages || []
      updateCurrentInvitation({ galleryImages: [...currentImages, ...urls] })
      toast.success('갤러리 이미지가 추가되었습니다.')
    } catch (err) {
      toast.error('갤러리 이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingGallery(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleKakaoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploadingKakao(true)
    try {
      const url = await uploadFile(e.target.files[0], 'kakao-thumbnails')
      updateCurrentInvitation({ kakaoThumbnail: url })
      toast.success('카카오 공유 썸네일이 업로드되었습니다.')
    } catch (err) {
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingKakao(false)
      if (e.target) e.target.value = ''
    }
  }

  // BGM Audio Play Handler
  const handlePlayBgm = (url: string) => {
    if (playingBgmUrl === url) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingBgmUrl(null)
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      audioRef.current.src = url
      audioRef.current.play().catch((e) => console.error(e))
      setPlayingBgmUrl(url)
    }
  }

  // bank account handlers
  const handleAddAccount = () => {
    if (!newAccount.bank || !newAccount.accountNumber || !newAccount.accountHolder) {
      toast.error('모든 계좌 정보를 입력해주세요.')
      return
    }
    const currentAccounts = currentInvitation?.bankAccounts || []
    let updatedAccounts
    if (editingAccountId) {
      updatedAccounts = currentAccounts.map(acc => 
        acc.id === editingAccountId ? { ...acc, ...newAccount } : acc
      )
      setEditingAccountId(null)
    } else {
      updatedAccounts = [
        ...currentAccounts,
        {
          id: 'acc-' + Math.random().toString(36).substring(2, 9),
          ...newAccount
        }
      ]
    }
    updateCurrentInvitation({ bankAccounts: updatedAccounts })
    setIsAccountDialogOpen(false)
    setNewAccount({ bank: '', accountNumber: '', accountHolder: '', relation: 'groom' })
  }

  const handleDeleteAccount = (id: string) => {
    const currentAccounts = currentInvitation?.bankAccounts || []
    updateCurrentInvitation({ bankAccounts: currentAccounts.filter(acc => acc.id !== id) })
  }

  // contact handlers
  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      toast.error('모든 연락처 정보를 입력해주세요.')
      return
    }
    const currentContacts = currentInvitation?.contacts || []
    let updatedContacts
    if (editingContactId) {
      updatedContacts = currentContacts.map(con => 
        con.id === editingContactId ? { ...con, ...newContact } : con
      )
      setEditingContactId(null)
    } else {
      updatedContacts = [
        ...currentContacts,
        {
          id: 'con-' + Math.random().toString(36).substring(2, 9),
          ...newContact
        }
      ]
    }
    updateCurrentInvitation({ contacts: updatedContacts })
    setIsContactDialogOpen(false)
    setNewContact({ name: '', phone: '', relation: 'groom' })
  }

  const handleDeleteContact = (id: string) => {
    const currentContacts = currentInvitation?.contacts || []
    updateCurrentInvitation({ contacts: currentContacts.filter(con => con.id !== id) })
  }

  // custom styles handlers
  const updateCustomStyle = (key: string, value: any) => {
    if (!currentInvitation) return
    const customStyles = {
      ...(currentInvitation.customStyles || {}),
      [key]: value
    }
    updateCurrentInvitation({ customStyles })
  }

  const activeTheme = themes.find(t => t.id === currentInvitation?.themeId) || sampleThemes.find(t => t.id === currentInvitation?.themeId) || sampleThemes[0]

  // Reorder Sections
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (!currentInvitation) return
    const defaultOrder = ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook']
    const sectionOrder = [...(currentInvitation.customStyles?.sectionOrder || activeTheme?.styles?.sectionOrder || defaultOrder)]
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return

    // Swap
    const temp = sectionOrder[index]
    sectionOrder[index] = sectionOrder[targetIndex]
    sectionOrder[targetIndex] = temp

    updateCustomStyle('sectionOrder', sectionOrder)
  }

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

  if (isLoading || !order || !currentInvitation) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">의뢰 청첩장 맞춤 제작</h1>
            <p className="text-muted-foreground">
              주문 번호: <span className="font-semibold">{order.id}</span> · 고객명:{' '}
              <span className="font-semibold">{order.customerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentInvitation.id && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/invitation/${currentInvitation.id}`} target="_blank" className="flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4" />
                배포된 화면 보기
              </Link>
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="text-white bg-foreground hover:bg-foreground/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            설정 저장하기
          </Button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Form Editor */}
        <div className="flex-1 max-w-3xl space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-background border border-border rounded-lg p-1">
              <TabsTrigger value="order">주문 관리</TabsTrigger>
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="content">내용 & 사진</TabsTrigger>
              <TabsTrigger value="features">상세 기능</TabsTrigger>
              <TabsTrigger value="design">스타일 커스텀</TabsTrigger>
            </TabsList>

            {/* TAB: Order Info */}
            <TabsContent value="order" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">주문 내역 제어</CardTitle>
                  <CardDescription>수동 등록된 개인 의뢰 주문 내역을 편집합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="custName">고객 / 주문자명</FieldLabel>
                      <Input
                        id="custName"
                        value={order.customerName}
                        onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="ordAmount">결제 금액 (원)</FieldLabel>
                        <Input
                          id="ordAmount"
                          type="number"
                          value={order.amount}
                          onChange={(e) => setOrder({ ...order, amount: parseInt(e.target.value) || 0 })}
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="ordStatus">주문 상태</FieldLabel>
                        <Select
                          value={order.status}
                          onValueChange={(val: Order['status']) => setOrder({ ...order, status: val })}
                        >
                          <SelectTrigger id="ordStatus">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기중</SelectItem>
                            <SelectItem value="paid">결제완료</SelectItem>
                            <SelectItem value="deployed">배포중</SelectItem>
                            <SelectItem value="expired">만료됨</SelectItem>
                            <SelectItem value="refunded">환불</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="ordNotes">관리 메모 / 특이사항</FieldLabel>
                      <Textarea
                        id="ordNotes"
                        rows={6}
                        placeholder="이곳에 제작 관련 의뢰 파일 링크나 가이드를 입력하세요."
                        value={order.notes}
                        onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Basic Info */}
            <TabsContent value="basic" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">신랑 & 신부 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Groom */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">신랑측</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="gr-name">성함</FieldLabel>
                        <Input
                          id="gr-name"
                          value={currentInvitation.groomName || ''}
                          onChange={(e) => updateCurrentInvitation({ groomName: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="gr-name-en">영문 이름</FieldLabel>
                        <Input
                          id="gr-name-en"
                          value={currentInvitation.groomNameEn || ''}
                          onChange={(e) => updateCurrentInvitation({ groomNameEn: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="gr-relation">혼주 및 관계 표기</FieldLabel>
                      <Input
                        id="gr-relation"
                        placeholder="예: 아버지 홍길동, 어머니 김영희의 장남"
                        value={currentInvitation.groomParentRelation || ''}
                        onChange={(e) => updateCurrentInvitation({ groomParentRelation: e.target.value })}
                      />
                    </Field>
                  </div>

                  {/* Bride */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-base border-b pb-2">신부측</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="br-name">성함</FieldLabel>
                        <Input
                          id="br-name"
                          value={currentInvitation.brideName || ''}
                          onChange={(e) => updateCurrentInvitation({ brideName: e.target.value })}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="br-name-en">영문 이름</FieldLabel>
                        <Input
                          id="br-name-en"
                          value={currentInvitation.brideNameEn || ''}
                          onChange={(e) => updateCurrentInvitation({ brideNameEn: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel htmlFor="br-relation">혼주 및 관계 표기</FieldLabel>
                      <Input
                        id="br-relation"
                        placeholder="예: 아버지 이철수, 어머니 박미경의 장녀"
                        value={currentInvitation.brideParentRelation || ''}
                        onChange={(e) => updateCurrentInvitation({ brideParentRelation: e.target.value })}
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">예식 일시 및 장소</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="w-date">예식 날짜</FieldLabel>
                      <Input
                        id="w-date"
                        type="date"
                        value={currentInvitation.weddingDate || ''}
                        onChange={(e) => updateCurrentInvitation({ weddingDate: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="w-time">예식 시간</FieldLabel>
                      <Input
                        id="w-time"
                        placeholder="예: 12:30 또는 오후 1시 30분"
                        value={currentInvitation.weddingTime || ''}
                        onChange={(e) => updateCurrentInvitation({ weddingTime: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="v-name">예식장명</FieldLabel>
                      <Input
                        id="v-name"
                        placeholder="예: 아펠가모 반포"
                        value={currentInvitation.venueName || ''}
                        onChange={(e) => updateCurrentInvitation({ venueName: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="v-hall">홀 이름</FieldLabel>
                      <Input
                        id="v-hall"
                        placeholder="예: 단독홀 또는 2층 그랜드볼룸"
                        value={currentInvitation.venueHall || ''}
                        onChange={(e) => updateCurrentInvitation({ venueHall: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="v-addr">예식장 주소</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="v-addr"
                        placeholder="주소를 선택하거나 입력하세요"
                        value={currentInvitation.venueAddress || ''}
                        onChange={(e) => updateCurrentInvitation({ venueAddress: e.target.value })}
                        className="flex-1"
                      />
                      <Button variant="outline" type="button" onClick={handleAddressSearch}>
                        주소 검색
                      </Button>
                    </div>
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Content & Images */}
            <TabsContent value="content" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">초대 인사말</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">하객들을 모시는 정중한 초대글을 입력하세요.</span>
                    <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          샘플 문구 보기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>샘플 문구</DialogTitle>
                          <DialogDescription>선택하시면 초대 인사말 창에 자동으로 입력됩니다.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {samplePhrases.map((phrase) => (
                            <button
                              key={phrase.id}
                              onClick={() => {
                                updateCurrentInvitation({ invitationMessage: phrase.text })
                                setShowMessageModal(false)
                              }}
                              className="w-full rounded-lg border border-border p-4 text-left text-sm leading-relaxed transition-colors hover:bg-muted"
                            >
                              <div className="mb-2">
                                <Badge variant="secondary" className="text-[10px]">
                                  {phrase.category === 'classic' ? '클래식' : 
                                   phrase.category === 'modern' ? '모던' : 
                                   phrase.category === 'romantic' ? '로맨틱' : '심플'}
                                </Badge>
                              </div>
                              <p className="whitespace-pre-line">{phrase.text}</p>
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Textarea
                    rows={8}
                    value={currentInvitation.invitationMessage || ''}
                    onChange={(e) => updateCurrentInvitation({ invitationMessage: e.target.value })}
                  />
                </CardContent>
              </Card>

              {/* Main Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">대문 사진 (Hero Image)</CardTitle>
                  <CardDescription>청첩장의 메인 비주얼 사진을 업로드합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 overflow-hidden">
                    {currentInvitation.mainImage ? (
                      <div className="relative h-full w-full">
                        <img 
                          src={currentInvitation.mainImage} 
                          alt="대문 사진" 
                          className="h-full w-full object-cover"
                        />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="absolute right-2 top-2"
                          onClick={() => updateCurrentInvitation({ mainImage: null })}
                        >
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => mainImageInputRef.current?.click()}
                          disabled={isUploadingMain}
                        >
                          {isUploadingMain ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          사진 업로드
                        </Button>
                        <input 
                          type="file"
                          ref={mainImageInputRef}
                          onChange={handleMainImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gallery */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">하객용 포토 갤러리</CardTitle>
                    <CardDescription>웨딩 포토 이미지를 추가 및 정렬합니다.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={currentInvitation.galleryViewType || 'slide'}
                      onValueChange={(val: any) => updateCurrentInvitation({ galleryViewType: val })}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slide">슬라이드형</SelectItem>
                        <SelectItem value="grid">그리드형</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" onClick={() => galleryInputRef.current?.click()} disabled={isUploadingGallery}>
                      {isUploadingGallery ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                      사진 추가
                    </Button>
                    <input 
                      type="file" 
                      ref={galleryInputRef} 
                      onChange={handleGalleryUpload} 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {(currentInvitation.galleryImages || []).map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg border border-border overflow-hidden bg-muted group">
                        <img src={img} alt="갤러리" className="h-full w-full object-cover" />
                        <button
                          onClick={() => {
                            const updated = (currentInvitation.galleryImages || []).filter((_, i) => i !== idx)
                            updateCurrentInvitation({ galleryImages: updated })
                          }}
                          className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {(currentInvitation.galleryImages || []).length === 0 && (
                      <div className="col-span-3 py-8 text-center text-xs text-muted-foreground">
                        등록된 갤러리 이미지가 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">오시는 길 교통 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="t-info">지하철 / 대중교통 안내</FieldLabel>
                      <Textarea
                        id="t-info"
                        rows={3}
                        placeholder="예: 3호선 신사역 4번 출구 도보 5분 거리"
                        value={currentInvitation.trafficInfo || ''}
                        onChange={(e) => updateCurrentInvitation({ trafficInfo: e.target.value })}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="p-info">자가용 / 주차 안내</FieldLabel>
                      <Textarea
                        id="p-info"
                        rows={3}
                        placeholder="예: 예식장 건물 지하 주차장 200대 가능 (하객 2시간 무료)"
                        value={currentInvitation.parkingInfo || ''}
                        onChange={(e) => updateCurrentInvitation({ parkingInfo: e.target.value })}
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Features Settings */}
            <TabsContent value="features" className="mt-6 space-y-4">
              {/* RSVP & Guestbook & BGM */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">부가 기능 제어</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* BGM Selection */}
                  <Field>
                    <FieldLabel>배경 음악 (BGM)</FieldLabel>
                    <div className="flex gap-2">
                      <Select
                        value={currentInvitation.bgmId || 'none'}
                        onValueChange={(val) => updateCurrentInvitation({ bgmId: val === 'none' ? null : val })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="BGM 없음" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">음악 없음 (None)</SelectItem>
                          {bgms.map((bgm) => (
                            <SelectItem key={bgm.id} value={bgm.id}>
                              {bgm.name} - {bgm.artist} ({bgm.duration})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {currentInvitation.bgmId && (
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            const selectedBgm = bgms.find(b => b.id === currentInvitation.bgmId)
                            if (selectedBgm) handlePlayBgm(selectedBgm.url)
                          }}
                        >
                          {playingBgmUrl ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </Field>

                  <Separator />

                  {/* Guestbook Option */}
                  <Field>
                    <FieldLabel>방명록 타입</FieldLabel>
                    <Select
                      value={currentInvitation.guestbookType || 'text'}
                      onValueChange={(val: any) => updateCurrentInvitation({ guestbookType: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">텍스트 방명록</SelectItem>
                        <SelectItem value="none">방명록 미노출</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Separator />

                  {/* RSVP Option Toggles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">RSVP (참석 의사 수집)</p>
                        <p className="text-xs text-muted-foreground">게스트의 참석여부 피드백 버튼을 활성화합니다.</p>
                      </div>
                      <Switch
                        checked={currentInvitation.rsvpEnabled || false}
                        onCheckedChange={(checked) => updateCurrentInvitation({ rsvpEnabled: checked })}
                      />
                    </div>

                    {currentInvitation.rsvpEnabled && (
                      <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-3 pl-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-xs">식사 선택 제공</p>
                            <p className="text-[10px] text-muted-foreground">식사(한식/양식) 여부 조사를 폼에 추가합니다.</p>
                          </div>
                          <Switch
                            checked={currentInvitation.rsvpMealEnabled !== false}
                            onCheckedChange={(checked) => updateCurrentInvitation({ rsvpMealEnabled: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                          <div>
                            <p className="font-medium text-xs">축하 한마디 메시지 작성</p>
                            <p className="text-[10px] text-muted-foreground">참석 정보 전송 시 한마디 코멘트 작성을 지원합니다.</p>
                          </div>
                          <Switch
                            checked={currentInvitation.rsvpCommentEnabled !== false}
                            onCheckedChange={(checked) => updateCurrentInvitation({ rsvpCommentEnabled: checked })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Kakao Share */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">카카오 공유 메시지 설정</CardTitle>
                  <CardDescription>카카오톡 링크 공유 시 표시될 정보를 등록합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <FieldLabel>공유 썸네일 이미지</FieldLabel>
                        <div className="relative aspect-square w-full rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                          {currentInvitation.kakaoThumbnail ? (
                            <>
                              <img src={currentInvitation.kakaoThumbnail} alt="Kakao" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => updateCurrentInvitation({ kakaoThumbnail: null })}
                                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white hover:bg-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <Button variant="ghost" size="sm" type="button" onClick={() => kakaoImageInputRef.current?.click()} disabled={isUploadingKakao}>
                              {isUploadingKakao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </Button>
                          )}
                          <input 
                            type="file" 
                            ref={kakaoImageInputRef} 
                            onChange={handleKakaoUpload} 
                            accept="image/*" 
                            className="hidden" 
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-4">
                        <Field>
                          <FieldLabel htmlFor="k-title">공유 제목</FieldLabel>
                          <Input
                            id="k-title"
                            placeholder="예: 철수 ❤️ 영희 결혼합니다!"
                            value={currentInvitation.kakaoTitle || ''}
                            onChange={(e) => updateCurrentInvitation({ kakaoTitle: e.target.value })}
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="k-desc">공유 부제목/설명</FieldLabel>
                          <Input
                            id="k-desc"
                            placeholder="예: 2026년 10월 24일 오후 12시"
                            value={currentInvitation.kakaoDescription || ''}
                            onChange={(e) => updateCurrentInvitation({ kakaoDescription: e.target.value })}
                          />
                        </Field>
                      </div>
                    </div>
                  </FieldGroup>
                </CardContent>
              </Card>

              {/* Accounts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">축의금 송금 계좌 관리</CardTitle>
                    <CardDescription>가족 및 혼주의 계좌번호를 표시합니다.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsAccountDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    계좌 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(currentInvitation.bankAccounts || []).map((acc) => (
                      <div key={acc.id} className="flex justify-between items-center border border-border rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold">
                            {acc.relation === 'groom' ? '신랑' : 
                             acc.relation === 'bride' ? '신부' : 
                             acc.relation === 'groomParent' ? '신랑 혼주' : '신부 혼주'}
                            {' · '}
                            {acc.bank} {acc.accountNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">예금주: {acc.accountHolder}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAccount(acc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(currentInvitation.bankAccounts || []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">등록된 계좌가 없습니다.</p>
                    )}
                  </div>

                  {/* Add Account Dialog */}
                  <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>송금 계좌 추가</DialogTitle>
                      </DialogHeader>
                      <FieldGroup className="mt-4">
                        <Field>
                          <FieldLabel>관계</FieldLabel>
                          <Select 
                            value={newAccount.relation} 
                            onValueChange={(val: any) => setNewAccount({ ...newAccount, relation: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="groom">신랑</SelectItem>
                              <SelectItem value="bride">신부</SelectItem>
                              <SelectItem value="groomParent">신랑 혼주</SelectItem>
                              <SelectItem value="brideParent">신부 혼주</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <div className="grid gap-2 grid-cols-2">
                          <Field>
                            <FieldLabel>은행명</FieldLabel>
                            <Input placeholder="예: 신한은행" value={newAccount.bank} onChange={e => setNewAccount({...newAccount, bank: e.target.value})} />
                          </Field>
                          <Field>
                            <FieldLabel>예금주</FieldLabel>
                            <Input placeholder="예: 홍길동" value={newAccount.accountHolder} onChange={e => setNewAccount({...newAccount, accountHolder: e.target.value})} />
                          </Field>
                        </div>
                        <Field>
                          <FieldLabel>계좌번호</FieldLabel>
                          <Input placeholder="하이픈(-) 제외 숫자만" value={newAccount.accountNumber} onChange={e => setNewAccount({...newAccount, accountNumber: e.target.value})} />
                        </Field>
                      </FieldGroup>
                      <Button className="w-full text-white" onClick={handleAddAccount}>
                        저장하기
                      </Button>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Contacts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">축하 연락처 관리</CardTitle>
                    <CardDescription>하객들이 모바일에서 바로 통화할 수 있는 전화번호 목록입니다.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setIsContactDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    연락처 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(currentInvitation.contacts || []).map((con) => (
                      <div key={con.id} className="flex justify-between items-center border border-border rounded-lg p-3">
                        <div>
                          <p className="text-sm font-semibold">{con.name} ({con.relation})</p>
                          <p className="text-xs text-muted-foreground">{con.phone}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteContact(con.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(currentInvitation.contacts || []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">등록된 연락처가 없습니다.</p>
                    )}
                  </div>

                  {/* Add Contact Dialog */}
                  <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>연락처 추가</DialogTitle>
                      </DialogHeader>
                      <FieldGroup className="mt-4">
                        <Field>
                          <FieldLabel>이름</FieldLabel>
                          <Input placeholder="예: 신랑 홍길동" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                        </Field>
                        <Field>
                          <FieldLabel>관계</FieldLabel>
                          <Select 
                            value={newContact.relation} 
                            onValueChange={(val) => setNewContact({ ...newContact, relation: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="신랑">신랑</SelectItem>
                              <SelectItem value="신부">신부</SelectItem>
                              <SelectItem value="신랑 아버지">신랑 아버님</SelectItem>
                              <SelectItem value="신랑 어머니">신랑 어머님</SelectItem>
                              <SelectItem value="신부 아버님">신부 아버님</SelectItem>
                              <SelectItem value="신부 어머님">신부 어머님</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field>
                          <FieldLabel>전화번호</FieldLabel>
                          <Input placeholder="예: 010-1234-5678" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                        </Field>
                      </FieldGroup>
                      <Button className="w-full text-white" onClick={handleAddContact}>
                        저장하기
                      </Button>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Design Custom Overrides */}
            <TabsContent value="design" className="mt-6 space-y-4">
              {/* Theme selection overrides */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">디자인 테마 선택</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field className="sm:col-span-1">
                      <FieldLabel>기본 테마</FieldLabel>
                      <Select
                        value={currentInvitation.themeId}
                        onValueChange={(val) => {
                          const newTheme = themes.find(t => t.id === val) || sampleThemes.find(t => t.id === val) || sampleThemes[0]
                          updateCurrentInvitation({ 
                            themeId: val,
                            colorSet: newTheme.colorSets?.[0]?.id || 'default',
                            fontSet: newTheme.fontSets?.[0]?.id || 'default'
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {themes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field className="sm:col-span-1">
                      <FieldLabel>색상 세트 (Preset)</FieldLabel>
                      <Select
                        value={currentInvitation.colorSet || 'default'}
                        onValueChange={(val) => updateCurrentInvitation({ colorSet: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">테마 기본값</SelectItem>
                          {activeTheme?.colorSets?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field className="sm:col-span-1">
                      <FieldLabel>폰트 세트 (Preset)</FieldLabel>
                      <Select
                        value={currentInvitation.fontSet || 'default'}
                        onValueChange={(val) => updateCurrentInvitation({ fontSet: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">테마 기본값</SelectItem>
                          {activeTheme?.fontSets?.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Custom Styling overrides */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">디자인 맞춤 커스터마이징 (Overrides)</CardTitle>
                  <CardDescription>배경색, 자간, 폰트, 여백 등을 개별적으로 재정의하여 맞춤 제작합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm border-b pb-1">맞춤 색상 (Colors)</h3>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <Field>
                        <FieldLabel>배경 색상</FieldLabel>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-1 rounded cursor-pointer border"
                            value={currentInvitation.customStyles?.backgroundColor || activeTheme?.styles?.backgroundColor || '#FFF8F0'} 
                            onChange={(e) => updateCustomStyle('backgroundColor', e.target.value)}
                          />
                          <Input 
                            value={currentInvitation.customStyles?.backgroundColor || ''} 
                            placeholder={activeTheme?.styles?.backgroundColor || '#FFF8F0'}
                            onChange={(e) => updateCustomStyle('backgroundColor', e.target.value || null)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>포인트 색상 (Accent)</FieldLabel>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-1 rounded cursor-pointer border"
                            value={currentInvitation.customStyles?.primaryColor || activeTheme?.styles?.primaryColor || '#E8A87C'} 
                            onChange={(e) => updateCustomStyle('primaryColor', e.target.value)}
                          />
                          <Input 
                            value={currentInvitation.customStyles?.primaryColor || ''} 
                            placeholder={activeTheme?.styles?.primaryColor || '#E8A87C'}
                            onChange={(e) => updateCustomStyle('primaryColor', e.target.value || null)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>본문 글자 색상</FieldLabel>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            className="w-10 h-10 p-1 rounded cursor-pointer border"
                            value={currentInvitation.customStyles?.textColor || activeTheme?.styles?.textColor || '#3A3A3A'} 
                            onChange={(e) => updateCustomStyle('textColor', e.target.value)}
                          />
                          <Input 
                            value={currentInvitation.customStyles?.textColor || ''} 
                            placeholder={activeTheme?.styles?.textColor || '#3A3A3A'}
                            onChange={(e) => updateCustomStyle('textColor', e.target.value || null)}
                            className="flex-1 text-xs"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>

                  {/* Typography */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm border-b pb-1">타이포그래피 (Typography)</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>국문 서체 (Korean Font)</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.fontKr || ''}
                          onValueChange={(val) => updateCustomStyle('fontKr', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본 폰트 사용" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 서체 사용</SelectItem>
                            <SelectItem value="font-serif">기본 명조체 (Noto Serif)</SelectItem>
                            <SelectItem value="font-sans">기본 고딕체 (Pretendard)</SelectItem>
                            {customFonts.map(f => (
                              <SelectItem key={f.id} value={f.family || f.name}>
                                {f.name} ({f.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>영문 서체 (English Font)</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.fontEn || ''}
                          onValueChange={(val) => updateCustomStyle('fontEn', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본 폰트 사용" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 서체 사용</SelectItem>
                            <SelectItem value="font-serif">기본 명조체 (Playfair)</SelectItem>
                            <SelectItem value="font-sans">기본 고딕체 (Inter)</SelectItem>
                            {customFonts.map(f => (
                              <SelectItem key={f.id} value={f.family || f.name}>
                                {f.name} ({f.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <Field>
                        <FieldLabel>기본 글꼴 크기</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.fontSize || ''}
                          onValueChange={(val) => updateCustomStyle('fontSize', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (16px)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 16px</SelectItem>
                            <SelectItem value="14px">작게 (14px)</SelectItem>
                            <SelectItem value="15px">약간 작게 (15px)</SelectItem>
                            <SelectItem value="16px">보통 (16px)</SelectItem>
                            <SelectItem value="17px">약간 크게 (17px)</SelectItem>
                            <SelectItem value="18px">크게 (18px)</SelectItem>
                            <SelectItem value="20px">매우 크게 (20px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>자간 설정 (Letter Spacing)</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.letterSpacing || ''}
                          onValueChange={(val) => updateCustomStyle('letterSpacing', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (-0.02em)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 -0.02em</SelectItem>
                            <SelectItem value="-0.05em">좁게 (-0.05em)</SelectItem>
                            <SelectItem value="-0.02em">보통 (-0.02em)</SelectItem>
                            <SelectItem value="0em">넓게 (0em)</SelectItem>
                            <SelectItem value="0.02em">매우 넓게 (0.02em)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </div>

                  {/* Spacing & Borders */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm border-b pb-1">레이아웃 & 여백 (Layout & Borders)</h3>
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                      <Field>
                        <FieldLabel>카드 테두리 둥글기</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.borderRadius || ''}
                          onValueChange={(val) => updateCustomStyle('borderRadius', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (8px)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 8px</SelectItem>
                            <SelectItem value="0px">둥글기 없음 (0px)</SelectItem>
                            <SelectItem value="4px">약간 둥글게 (4px)</SelectItem>
                            <SelectItem value="8px">보통 (8px)</SelectItem>
                            <SelectItem value="12px">둥글게 (12px)</SelectItem>
                            <SelectItem value="20px">매우 둥글게 (20px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>섹션 위아래 여백</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.sectionSpacing || ''}
                          onValueChange={(val) => updateCustomStyle('sectionSpacing', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (py-16)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 py-16</SelectItem>
                            <SelectItem value="py-8">좁게 (py-8)</SelectItem>
                            <SelectItem value="py-12">약간 좁게 (py-12)</SelectItem>
                            <SelectItem value="py-16">보통 (py-16)</SelectItem>
                            <SelectItem value="py-20">넓게 (py-20)</SelectItem>
                            <SelectItem value="py-24">매우 넓게 (py-24)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>카드 배경 스타일</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.cardBg || ''}
                          onValueChange={(val) => updateCustomStyle('cardBg', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (bg-white/40)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 반투명 (40%)</SelectItem>
                            <SelectItem value="bg-white/10">매우 얇은 반투명 (10%)</SelectItem>
                            <SelectItem value="bg-white/40">반투명 (40%)</SelectItem>
                            <SelectItem value="bg-white/80">진한 반투명 (80%)</SelectItem>
                            <SelectItem value="bg-white">불투명 흰색 (100%)</SelectItem>
                            <SelectItem value="bg-transparent">배경 없음 (투명)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>구분선 디자인</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.dividerType || ''}
                          onValueChange={(val) => updateCustomStyle('dividerType', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (heart)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 heart형</SelectItem>
                            <SelectItem value="none">구분선 없음</SelectItem>
                            <SelectItem value="line">실선형</SelectItem>
                            <SelectItem value="heart">하트 심볼</SelectItem>
                            <SelectItem value="flower">플라워 심볼</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <FieldLabel>대문(Hero) 텍스트 정렬</FieldLabel>
                        <Select
                          value={currentInvitation.customStyles?.heroStyle || ''}
                          onValueChange={(val) => updateCustomStyle('heroStyle', val || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="기본값 (center)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_clear">기본 중앙정렬</SelectItem>
                            <SelectItem value="center">중앙 정렬 (Center)</SelectItem>
                            <SelectItem value="left">좌측 정렬 (Left)</SelectItem>
                            <SelectItem value="right">우측 정렬 (Right)</SelectItem>
                            <SelectItem value="minimal">심플 미니멀</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </div>

                  {/* Section Ordering */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-sm border-b pb-1">노출 섹션 순서 재정렬</h3>
                    <p className="text-xs text-muted-foreground">위/아래 버튼을 클릭하여 모바일 화면 상에 노출될 섹션의 순서를 자유롭게 조정합니다.</p>
                    <div className="space-y-2 max-w-md bg-muted/40 border rounded-lg p-4">
                      {(() => {
                        const defaultOrder = ['hero', 'greeting', 'gallery', 'calendar', 'location', 'contact', 'account', 'rsvp', 'guestbook']
                        const sectionOrder = currentInvitation.customStyles?.sectionOrder || activeTheme?.styles?.sectionOrder || defaultOrder
                        
                        return sectionOrder.map((section, idx) => (
                          <div key={section} className="flex justify-between items-center bg-background border rounded px-3 py-2 text-xs shadow-sm">
                            <span className="font-medium">{idx + 1}. {sectionLabels[section] || section}</span>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveSection(idx, 'up')}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                type="button"
                                disabled={idx === sectionOrder.length - 1}
                                onClick={() => handleMoveSection(idx, 'down')}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Mobile Preview Sticky */}
        <div className="w-full lg:w-[360px] flex justify-center shrink-0">
          <div className="sticky top-20 w-full flex flex-col items-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">실시간 프리뷰</p>
            <MobilePreview className="w-full" isSticky={false} />
          </div>
        </div>
      </div>
      
      {/* Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
