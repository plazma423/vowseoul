'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, ArrowRight, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const timeOptions = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
]

const parseParentNames = (fullRelation: string) => {
  if (!fullRelation) return ''
  const match = fullRelation.match(/^(.*?)(의\s+아들|의\s+딸|의\s*\S*)$/)
  return match ? match[1].trim() : fullRelation
}

const parseRelationText = (fullRelation: string) => {
  if (!fullRelation) return ''
  const match = fullRelation.match(/^(.*?)(의\s+아들|의\s+딸|의\s*\S*)$/)
  return match ? match[2].trim() : ''
}

export default function BasicInfoPage() {
  const router = useRouter()
  const params = useParams()
  const { currentInvitation, updateCurrentInvitation, saveInvitation, setActiveSection } = useAppStore()
  const invitationId = params.id as string

  const handleNext = async () => {
    const savedId = await saveInvitation()
    const targetId = savedId || invitationId
    router.push(`/editor/${targetId}/design`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">기본 정보</h1>
        <p className="mt-1 text-muted-foreground">
          신랑, 신부 정보와 예식 일시, 장소를 입력해주세요.
        </p>
      </div>

      {/* Groom Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">신랑 정보</CardTitle>
          <CardDescription>신랑의 이름과 혼주 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="groomName">이름</FieldLabel>
                <Input
                  id="groomName"
                  placeholder="홍길동"
                  value={currentInvitation?.groomName || ''}
                  onChange={(e) => updateCurrentInvitation({ groomName: e.target.value })}
                  onFocus={() => setActiveSection('hero')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="groomNameEn">영문 이름</FieldLabel>
                <Input
                  id="groomNameEn"
                  placeholder="Hong Gildong"
                  value={currentInvitation?.groomNameEn || ''}
                  onChange={(e) => updateCurrentInvitation({ groomNameEn: e.target.value })}
                  onFocus={() => setActiveSection('hero')}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="groomParentNames">혼주 이름</FieldLabel>
                <Input
                  id="groomParentNames"
                  placeholder="아버지 홍길동 · 어머니 김순희"
                  value={currentInvitation?.customStyles?.groomParentNames !== undefined 
                    ? currentInvitation.customStyles.groomParentNames 
                    : parseParentNames(currentInvitation?.groomParentRelation || '')}
                  onChange={(e) => {
                    const newNames = e.target.value;
                    const curRelation = currentInvitation?.customStyles?.groomParentRelationText !== undefined
                      ? currentInvitation.customStyles.groomParentRelationText
                      : parseRelationText(currentInvitation?.groomParentRelation || '');
                    
                    const combined = newNames ? `${newNames} ${curRelation}`.trim() : curRelation;
                    updateCurrentInvitation({
                      groomParentRelation: combined,
                      customStyles: {
                        ...(currentInvitation?.customStyles || {}),
                        groomParentNames: newNames,
                        groomParentRelationText: curRelation
                      }
                    });
                  }}
                  onFocus={() => setActiveSection('hero')}
                />
                <FieldDescription>혼주의 이름을 입력해주세요. (예: 아버지 홍길동 · 어머니 김순희)</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="groomParentRelationText">관계 표기</FieldLabel>
                <Input
                  id="groomParentRelationText"
                  placeholder="의 아들"
                  value={currentInvitation?.customStyles?.groomParentRelationText !== undefined 
                    ? currentInvitation.customStyles.groomParentRelationText 
                    : parseRelationText(currentInvitation?.groomParentRelation || '')}
                  onChange={(e) => {
                    const newRelation = e.target.value;
                    const curNames = currentInvitation?.customStyles?.groomParentNames !== undefined
                      ? currentInvitation.customStyles.groomParentNames
                      : parseParentNames(currentInvitation?.groomParentRelation || '');
                    
                    const combined = curNames ? `${curNames} ${newRelation}`.trim() : newRelation;
                    updateCurrentInvitation({
                      groomParentRelation: combined,
                      customStyles: {
                        ...(currentInvitation?.customStyles || {}),
                        groomParentNames: curNames,
                        groomParentRelationText: newRelation
                      }
                    });
                  }}
                  onFocus={() => setActiveSection('hero')}
                />
                <FieldDescription>신랑과의 관계를 입력해주세요. (예: 의 아들, 의 장남)</FieldDescription>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Bride Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">신부 정보</CardTitle>
          <CardDescription>신부의 이름과 혼주 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="brideName">이름</FieldLabel>
                <Input
                  id="brideName"
                  placeholder="김영희"
                  value={currentInvitation?.brideName || ''}
                  onChange={(e) => updateCurrentInvitation({ brideName: e.target.value })}
                  onFocus={() => setActiveSection('hero')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="brideNameEn">영문 이름</FieldLabel>
                <Input
                  id="brideNameEn"
                  placeholder="Kim Younghee"
                  value={currentInvitation?.brideNameEn || ''}
                  onChange={(e) => updateCurrentInvitation({ brideNameEn: e.target.value })}
                  onFocus={() => setActiveSection('hero')}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="brideParentNames">혼주 이름</FieldLabel>
                <Input
                  id="brideParentNames"
                  placeholder="아버지 김철수 · 어머니 박미경"
                  value={currentInvitation?.customStyles?.brideParentNames !== undefined 
                    ? currentInvitation.customStyles.brideParentNames 
                    : parseParentNames(currentInvitation?.brideParentRelation || '')}
                  onChange={(e) => {
                    const newNames = e.target.value;
                    const curRelation = currentInvitation?.customStyles?.brideParentRelationText !== undefined
                      ? currentInvitation.customStyles.brideParentRelationText
                      : parseRelationText(currentInvitation?.brideParentRelation || '');
                    
                    const combined = newNames ? `${newNames} ${curRelation}`.trim() : curRelation;
                    updateCurrentInvitation({
                      brideParentRelation: combined,
                      customStyles: {
                        ...(currentInvitation?.customStyles || {}),
                        brideParentNames: newNames,
                        brideParentRelationText: curRelation
                      }
                    });
                  }}
                  onFocus={() => setActiveSection('hero')}
                />
                <FieldDescription>혼주의 이름을 입력해주세요. (예: 아버지 김철수 · 어머니 박미경)</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="brideParentRelationText">관계 표기</FieldLabel>
                <Input
                  id="brideParentRelationText"
                  placeholder="의 딸"
                  value={currentInvitation?.customStyles?.brideParentRelationText !== undefined 
                    ? currentInvitation.customStyles.brideParentRelationText 
                    : parseRelationText(currentInvitation?.brideParentRelation || '')}
                  onChange={(e) => {
                    const newRelation = e.target.value;
                    const curNames = currentInvitation?.customStyles?.brideParentNames !== undefined
                      ? currentInvitation.customStyles.brideParentNames
                      : parseParentNames(currentInvitation?.brideParentRelation || '');
                    
                    const combined = curNames ? `${curNames} ${newRelation}`.trim() : newRelation;
                    updateCurrentInvitation({
                      brideParentRelation: combined,
                      customStyles: {
                        ...(currentInvitation?.customStyles || {}),
                        brideParentNames: curNames,
                        brideParentRelationText: newRelation
                      }
                    });
                  }}
                  onFocus={() => setActiveSection('hero')}
                />
                <FieldDescription>신부와의 관계를 입력해주세요. (예: 의 딸, 의 차녀)</FieldDescription>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Wedding Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">예식 일시</CardTitle>
          <CardDescription>결혼식 날짜와 시간을 선택해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>예식일</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !currentInvitation?.weddingDate && 'text-muted-foreground'
                      )}
                      onFocus={() => setActiveSection('calendar')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentInvitation?.weddingDate ? (
                        format(new Date(currentInvitation.weddingDate + 'T00:00:00'), 'PPP', { locale: ko })
                      ) : (
                        '날짜를 선택하세요'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentInvitation?.weddingDate ? new Date(currentInvitation.weddingDate + 'T00:00:00') : undefined}
                      onSelect={(date) => date && updateCurrentInvitation({ weddingDate: format(date, 'yyyy-MM-dd') })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field>
                <FieldLabel htmlFor="weddingTime">예식 시간</FieldLabel>
                <Select
                  value={currentInvitation?.weddingTime || ''}
                  onValueChange={(value) => updateCurrentInvitation({ weddingTime: value })}
                >
                  <SelectTrigger onFocus={() => setActiveSection('calendar')}>
                    <SelectValue placeholder="시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Venue Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">예식 장소</CardTitle>
          <CardDescription>결혼식이 진행될 장소 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="venueName">예식장명</FieldLabel>
                <Input
                  id="venueName"
                  placeholder="그랜드 하얏트 서울"
                  value={currentInvitation?.venueName || ''}
                  onChange={(e) => updateCurrentInvitation({ venueName: e.target.value })}
                  onFocus={() => setActiveSection('location')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="venueHall">층/홀 이름</FieldLabel>
                <Input
                  id="venueHall"
                  placeholder="그랜드볼룸"
                  value={currentInvitation?.venueHall || ''}
                  onChange={(e) => updateCurrentInvitation({ venueHall: e.target.value })}
                  onFocus={() => setActiveSection('location')}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="venueAddress">주소</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="venueAddress"
                  placeholder="서울특별시 용산구 소월로 322"
                  value={currentInvitation?.venueAddress || ''}
                  onChange={(e) => updateCurrentInvitation({ venueAddress: e.target.value })}
                  onFocus={() => setActiveSection('location')}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    const executePostcode = () => {
                      new (window as any).daum.Postcode({
                        oncomplete: (data: any) => {
                          let fullAddress = data.address;
                          let extraAddress = '';

                          if (data.addressType === 'R') {
                            if (data.bname !== '') {
                              extraAddress += data.bname;
                            }
                            if (data.buildingName !== '') {
                              extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
                            }
                            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
                          }

                          updateCurrentInvitation({ venueAddress: fullAddress });
                        },
                      }).open();
                    };

                    if (!(window as any).daum) {
                      const script = document.createElement('script');
                      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
                      script.onload = executePostcode;
                      document.body.appendChild(script);
                    } else {
                      executePostcode();
                    }
                  }}
                >
                  주소 검색
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href={`/editor/${invitationId}/design`}>
            <Palette className="mr-2 h-4 w-4" />
            디자인 수정하기
          </Link>
        </Button>
        <Button onClick={handleNext}>
          다음 단계
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
