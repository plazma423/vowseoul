'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, ArrowRight, Upload, GripVertical, Plus, Trash2, FileText, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadFile } from '@/lib/storage'

const sampleMessages = [
  '서로 다른 길을 걸어온 저희 두 사람이\n이제 하나의 길을 함께 걸어가려 합니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다.',
  '평생을 함께하고 싶은 사람을 만났습니다.\n서로의 손을 잡고 같은 곳을 바라보며\n행복한 가정을 꾸려가겠습니다.',
  '저희 두 사람이 사랑과 믿음으로\n한 가정을 이루게 되었습니다.\n오셔서 축복해 주시면 큰 기쁨이겠습니다.',
  '소중한 분들을 모시고\n저희의 새로운 시작을 함께하고 싶습니다.\n바쁘시더라도 귀한 걸음 해주시어\n축복해 주시면 감사하겠습니다.',
]

export default function ContentPage() {
  const router = useRouter()
  const params = useParams()
  const { currentInvitation, updateCurrentInvitation, saveInvitation } = useAppStore()
  const invitationId = params.id as string
  const [showMessageModal, setShowMessageModal] = useState(false)
  
  const [isUploadingMain, setIsUploadingMain] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  
  // Bank Account Dialog State
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({
    bank: '',
    accountNumber: '',
    accountHolder: '',
    relation: 'groom' as 'groom' | 'bride' | 'groomParent' | 'brideParent'
  })

  // Contact Dialog State
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relation: 'groom'
  })

  const handleAddAccount = () => {
    if (!newAccount.bank || !newAccount.accountNumber || !newAccount.accountHolder) {
      alert('모든 계좌 정보를 입력해주세요.')
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
    setNewAccount({
      bank: '',
      accountNumber: '',
      accountHolder: '',
      relation: 'groom'
    })
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      alert('모든 연락처 정보를 입력해주세요.')
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
    setNewContact({
      name: '',
      phone: '',
      relation: 'groom'
    })
  }
  
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsUploadingMain(true)
    try {
      const url = await uploadFile(e.target.files[0], 'main-images')
      updateCurrentInvitation({ mainImage: url })
    } catch (err) {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingMain(false)
      // Reset input
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
    } catch (err) {
      alert('갤러리 업로드에 실패했습니다.')
    } finally {
      setIsUploadingGallery(false)
      // Reset input
      if (e.target) e.target.value = ''
    }
  }

  const handleNext = async () => {
    await saveInvitation()
    router.push(`/editor/${invitationId}/features`)
  }

  const handleBack = () => {
    router.push(`/editor/${invitationId}/design`)
  }

  const handleSelectMessage = (message: string) => {
    updateCurrentInvitation({ invitationMessage: message })
    setShowMessageModal(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">콘텐츠</h1>
        <p className="mt-1 text-muted-foreground">
          청첩장에 들어갈 내용을 입력해주세요.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['main-visual', 'message', 'gallery', 'directions']} className="space-y-4">
        {/* Main Visual */}
        <AccordionItem value="main-visual" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">메인 비주얼</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
                {currentInvitation?.mainImage ? (
                  <div className="relative h-full w-full">
                    <img 
                      src={currentInvitation.mainImage} 
                      alt="메인 비주얼" 
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => updateCurrentInvitation({ mainImage: null })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center" onClick={() => mainImageInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                    {isUploadingMain ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {isUploadingMain ? '업로드 중...' : '이미지를 드래그하거나 클릭하여 업로드'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={mainImageInputRef}
                  onChange={handleMainImageUpload}
                  disabled={isUploadingMain}
                />
                <Button variant="outline" className="flex-1" onClick={() => mainImageInputRef.current?.click()} disabled={isUploadingMain}>
                  {isUploadingMain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  이미지 업로드
                </Button>
                <Button variant="outline">
                  자르기
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Invitation Message */}
        <AccordionItem value="message" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">초대말</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FieldGroup>
              <Field>
                <Textarea
                  placeholder="초대의 말씀을 작성해주세요..."
                  rows={5}
                  value={currentInvitation?.invitationMessage || ''}
                  onChange={(e) => updateCurrentInvitation({ invitationMessage: e.target.value })}
                />
                <FieldDescription>
                  청첩장에 표시될 인사말을 작성해주세요.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Dialog open={showMessageModal} onOpenChange={setShowMessageModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  샘플 문구 보기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>샘플 문구</DialogTitle>
                  <DialogDescription>
                    원하는 문구를 선택하시면 자동으로 입력됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  {sampleMessages.map((message, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectMessage(message)}
                      className="w-full rounded-lg border border-border p-4 text-left text-sm leading-relaxed transition-colors hover:bg-muted"
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </AccordionContent>
        </AccordionItem>

        {/* Gallery */}
        <AccordionItem value="gallery" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">갤러리</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FieldGroup>
              <Field>
                <FieldLabel>뷰 타입</FieldLabel>
                <RadioGroup
                  value={currentInvitation?.galleryViewType || 'slide'}
                  onValueChange={(value: 'grid' | 'slide') => updateCurrentInvitation({ galleryViewType: value })}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="slide" id="slide" />
                    <Label htmlFor="slide">슬라이드</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="grid" id="grid" />
                    <Label htmlFor="grid">그리드</Label>
                  </div>
                </RadioGroup>
              </Field>
              <Field>
                <FieldLabel>사진 업로드</FieldLabel>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(currentInvitation?.galleryImages || []).map((image, index) => (
                    <div key={index} className="group relative aspect-square">
                      <img 
                        src={image} 
                        alt={`갤러리 ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white">
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-white"
                          onClick={() => {
                            const newImages = [...(currentInvitation?.galleryImages || [])]
                            newImages.splice(index, 1)
                            updateCurrentInvitation({ galleryImages: newImages })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    ref={galleryInputRef}
                    onChange={handleGalleryUpload}
                    disabled={isUploadingGallery}
                  />
                  <button 
                    className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted disabled:opacity-50"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingGallery}
                  >
                    {isUploadingGallery ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <FieldDescription>
                  드래그하여 순서를 변경할 수 있습니다.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Directions */}
        <AccordionItem value="directions" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">오시는 길</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="address">주소</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="주소를 검색해주세요"
                    value={currentInvitation?.venueAddress || ''}
                    onChange={(e) => updateCurrentInvitation({ venueAddress: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="outline">주소 검색</Button>
                </div>
              </Field>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  네이버 지도 연동
                </Button>
                <Button variant="outline" className="flex-1">
                  카카오 지도 연동
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor="trafficInfo">교통 안내</FieldLabel>
                <Textarea
                  id="trafficInfo"
                  placeholder="대중교통 이용 방법을 안내해주세요"
                  rows={3}
                  value={currentInvitation?.trafficInfo || ''}
                  onChange={(e) => updateCurrentInvitation({ trafficInfo: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="parkingInfo">주차 안내</FieldLabel>
                <Textarea
                  id="parkingInfo"
                  placeholder="주차장 이용 방법을 안내해주세요"
                  rows={3}
                  value={currentInvitation?.parkingInfo || ''}
                  onChange={(e) => updateCurrentInvitation({ parkingInfo: e.target.value })}
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        {/* RSVP */}
        <AccordionItem value="rsvp" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">RSVP (참석여부)</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">RSVP 기능 사용</p>
                <p className="text-sm text-muted-foreground">
                  하객이 참석여부를 미리 알려줄 수 있습니다.
                </p>
              </div>
              <Switch
                checked={currentInvitation?.rsvpEnabled || false}
                onCheckedChange={(checked) => updateCurrentInvitation({ rsvpEnabled: checked })}
              />
            </div>
            {currentInvitation?.rsvpEnabled && (
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  하객용 RSVP 폼에서는 참석 여부, 참석 인원, 식사 여부를 입력받습니다.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Bank Accounts */}
        <AccordionItem value="bank" className="rounded-lg border border-border">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="font-medium">송금/연락처</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">계좌번호</h4>
                {(currentInvitation?.bankAccounts || []).map((account, index) => (
                  <div key={account.id} className="mb-2 flex items-center gap-2 rounded-lg border border-border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {account.relation === 'groom' && '신랑 '}
                        {account.relation === 'bride' && '신부 '}
                        {account.relation === 'groomParent' && '신랑 혼주 '}
                        {account.relation === 'brideParent' && '신부 혼주 '}
                        · {account.bank} {account.accountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.accountHolder}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingAccountId(account.id)
                        setNewAccount({
                          bank: account.bank,
                          accountNumber: account.accountNumber,
                          accountHolder: account.accountHolder,
                          relation: account.relation
                        })
                        setIsAccountDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const newAccounts = [...(currentInvitation?.bankAccounts || [])]
                        newAccounts.splice(index, 1)
                        updateCurrentInvitation({ bankAccounts: newAccounts })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Dialog open={isAccountDialogOpen} onOpenChange={(open) => {
                  setIsAccountDialogOpen(open)
                  if (!open) {
                    setEditingAccountId(null)
                    setNewAccount({ bank: '', accountNumber: '', accountHolder: '', relation: 'groom' })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setEditingAccountId(null)
                      setNewAccount({ bank: '', accountNumber: '', accountHolder: '', relation: 'groom' })
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      계좌 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingAccountId ? '계좌 수정' : '계좌 추가'}</DialogTitle>
                      <DialogDescription>축의금을 받을 계좌번호를 입력해주세요.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="acc-relation">관계</Label>
                        <Select
                          value={newAccount.relation}
                          onValueChange={(val: any) => setNewAccount({ ...newAccount, relation: val })}
                        >
                          <SelectTrigger id="acc-relation">
                            <SelectValue placeholder="관계를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="groom">신랑</SelectItem>
                            <SelectItem value="bride">신부</SelectItem>
                            <SelectItem value="groomParent">신랑 혼주</SelectItem>
                            <SelectItem value="brideParent">신부 혼주</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="acc-bank">은행명</Label>
                        <Input
                          id="acc-bank"
                          placeholder="예: 신한은행, 국민은행"
                          value={newAccount.bank}
                          onChange={(e) => setNewAccount({ ...newAccount, bank: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="acc-number">계좌번호</Label>
                        <Input
                          id="acc-number"
                          placeholder="예: 110-123-456789"
                          value={newAccount.accountNumber}
                          onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="acc-holder">예금주</Label>
                        <Input
                          id="acc-holder"
                          placeholder="예: 홍길동"
                          value={newAccount.accountHolder}
                          onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleAddAccount}>
                      {editingAccountId ? '수정 완료' : '추가 완료'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              <div>
                <h4 className="mb-2 font-medium">연락처</h4>
                {(currentInvitation?.contacts || []).map((contact, index) => (
                  <div key={contact.id} className="mb-2 flex items-center gap-2 rounded-lg border border-border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {contact.name} ({
                          contact.relation === 'groom' ? '신랑' :
                          contact.relation === 'bride' ? '신부' :
                          contact.relation === 'groomParent' ? '신랑 혼주' :
                          contact.relation === 'brideParent' ? '신부 혼주' :
                          contact.relation
                        })
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.phone}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setEditingContactId(contact.id)
                        setNewContact({
                          name: contact.name,
                          phone: contact.phone,
                          relation: contact.relation
                        })
                        setIsContactDialogOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const newContacts = [...(currentInvitation?.contacts || [])]
                        newContacts.splice(index, 1)
                        updateCurrentInvitation({ contacts: newContacts })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Dialog open={isContactDialogOpen} onOpenChange={(open) => {
                  setIsContactDialogOpen(open)
                  if (!open) {
                    setEditingContactId(null)
                    setNewContact({ name: '', phone: '', relation: 'groom' })
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setEditingContactId(null)
                      setNewContact({ name: '', phone: '', relation: 'groom' })
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      연락처 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingContactId ? '연락처 수정' : '연락처 추가'}</DialogTitle>
                      <DialogDescription>하객들이 연락할 수 있는 전화번호를 입력해주세요.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="con-name">이름</Label>
                        <Input
                          id="con-name"
                          placeholder="예: 홍길동"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="con-relation">관계</Label>
                        <Select
                          value={newContact.relation}
                          onValueChange={(val: any) => setNewContact({ ...newContact, relation: val })}
                        >
                          <SelectTrigger id="con-relation">
                            <SelectValue placeholder="관계를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="groom">신랑</SelectItem>
                            <SelectItem value="bride">신부</SelectItem>
                            <SelectItem value="groomParent">신랑 혼주</SelectItem>
                            <SelectItem value="brideParent">신부 혼주</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="con-phone">전화번호</Label>
                        <Input
                          id="con-phone"
                          placeholder="예: 010-1234-5678"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleAddContact}>
                      {editingContactId ? '수정 완료' : '추가 완료'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
