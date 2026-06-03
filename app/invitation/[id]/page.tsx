"use client"

import { useState } from "react"
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
  Calendar, 
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

export default function InvitationViewPage() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [showRsvp, setShowRsvp] = useState(false)
  const [attendance, setAttendance] = useState("yes")
  const [guestCount, setGuestCount] = useState("2")
  const [mealType, setMealType] = useState("korean")

  // Mock invitation data
  const invitation = {
    groomName: "김민수",
    brideName: "이서연",
    groomFather: "김영호",
    groomMother: "박순희",
    brideFather: "이상철",
    brideMother: "최미영",
    weddingDate: "2024년 5월 25일",
    weddingTime: "오후 2시",
    weddingDay: "토요일",
    venue: "더 플라자 호텔 그랜드볼룸",
    address: "서울특별시 중구 소공로 119",
    greeting: "서로 다른 길을 걸어온 두 사람이\n이제 하나의 길을 함께 걸어가려 합니다.\n\n귀한 발걸음 하시어\n저희의 새로운 시작을 축복해 주시면\n더없는 기쁨으로 간직하겠습니다.",
    groomAccount: { bank: "신한은행", number: "110-123-456789", holder: "김민수" },
    brideAccount: { bank: "국민은행", number: "123-45-6789012", holder: "이서연" },
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Music Toggle */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center"
      >
        {isPlaying ? <Music className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {/* Hero Section */}
        <div className="relative h-screen flex flex-col items-center justify-center text-center px-8">
          <div className="space-y-6">
            <p className="text-sm tracking-[0.3em] text-[#8b7355]">WEDDING INVITATION</p>
            <div className="space-y-2">
              <h1 className="text-4xl font-serif text-[#3d3d3d]">
                {invitation.groomName} <span className="text-[#c4a574]">&</span> {invitation.brideName}
              </h1>
            </div>
            <div className="space-y-1 text-[#666]">
              <p>{invitation.weddingDate} {invitation.weddingDay}</p>
              <p>{invitation.weddingTime}</p>
              <p>{invitation.venue}</p>
            </div>
          </div>
          <div className="absolute bottom-8 animate-bounce">
            <ChevronDown className="w-6 h-6 text-[#c4a574]" />
          </div>
        </div>

        {/* Greeting Section */}
        <section className="py-16 px-8 text-center bg-white">
          <Heart className="w-6 h-6 text-[#c4a574] mx-auto mb-6" />
          <p className="text-[#666] leading-relaxed whitespace-pre-line">
            {invitation.greeting}
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-[#666]">
            <div>
              <p className="text-[#999] mb-1">신랑측</p>
              <p>{invitation.groomFather} · {invitation.groomMother}의 아들 {invitation.groomName}</p>
            </div>
            <div>
              <p className="text-[#999] mb-1">신부측</p>
              <p>{invitation.brideFather} · {invitation.brideMother}의 딸 {invitation.brideName}</p>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-16 px-8 bg-[#faf9f7]">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-8">GALLERY</h2>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-[#e8e4de] rounded-lg" />
            ))}
          </div>
        </section>

        {/* Calendar Section */}
        <section className="py-16 px-8 bg-white">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-8">CALENDAR</h2>
          <Card className="border-0 shadow-none bg-[#faf9f7]">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-2xl font-serif text-[#c4a574]">5</p>
                <p className="text-sm text-[#999]">2024</p>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div key={day} className="py-2 text-[#999] text-xs">{day}</div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 2
                  if (day < 1 || day > 31) return <div key={i} />
                  return (
                    <div
                      key={i}
                      className={`py-2 ${
                        day === 25
                          ? "bg-[#c4a574] text-white rounded-full"
                          : "text-[#666]"
                      }`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 text-center">
                <p className="text-[#c4a574] font-medium">{invitation.weddingDate}</p>
                <p className="text-sm text-[#666]">{invitation.weddingDay} {invitation.weddingTime}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Location Section */}
        <section className="py-16 px-8 bg-[#faf9f7]">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-8">LOCATION</h2>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="aspect-video bg-[#e8e4de] rounded-t-lg flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#999]" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-[#3d3d3d]">{invitation.venue}</h3>
                  <p className="text-sm text-[#666] mt-1">{invitation.address}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    네이버지도
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Navigation className="w-4 h-4 mr-2" />
                    카카오맵
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => copyToClipboard(invitation.address)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  주소 복사
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-8 bg-white">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-8">CONTACT</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-0 bg-[#faf9f7]">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[#999] mb-2">신랑에게 연락하기</p>
                <p className="font-medium text-[#3d3d3d] mb-3">{invitation.groomName}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  전화
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#faf9f7]">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[#999] mb-2">신부에게 연락하기</p>
                <p className="font-medium text-[#3d3d3d] mb-3">{invitation.brideName}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  전화
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Account Section */}
        <section className="py-16 px-8 bg-[#faf9f7]">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-2">ACCOUNT</h2>
          <p className="text-center text-sm text-[#999] mb-8">마음 전하실 곳</p>
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#999]">신랑측</p>
                    <p className="font-medium">{invitation.groomAccount.bank} {invitation.groomAccount.number}</p>
                    <p className="text-sm text-[#666]">{invitation.groomAccount.holder}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${invitation.groomAccount.bank} ${invitation.groomAccount.number}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#999]">신부측</p>
                    <p className="font-medium">{invitation.brideAccount.bank} {invitation.brideAccount.number}</p>
                    <p className="text-sm text-[#666]">{invitation.brideAccount.holder}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`${invitation.brideAccount.bank} ${invitation.brideAccount.number}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* RSVP Section */}
        <section className="py-16 px-8 bg-white">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-2">RSVP</h2>
          <p className="text-center text-sm text-[#999] mb-8">참석 여부를 알려주세요</p>
          
          <Dialog open={showRsvp} onOpenChange={setShowRsvp}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#c4a574] hover:bg-[#b39464]">
                <Calendar className="w-4 h-4 mr-2" />
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
                  <Label>성함</Label>
                  <Input placeholder="성함을 입력해주세요" />
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
                  <Label>축하 메시지 (선택)</Label>
                  <Textarea placeholder="축하 메시지를 남겨주세요" rows={3} />
                </div>
              </div>
              <Button className="w-full bg-[#c4a574] hover:bg-[#b39464]">
                전송하기
              </Button>
            </DialogContent>
          </Dialog>
        </section>

        {/* Guestbook Section */}
        <section className="py-16 px-8 bg-[#faf9f7]">
          <h2 className="text-center text-lg font-serif text-[#3d3d3d] mb-8">GUESTBOOK</h2>
          <div className="space-y-4">
            {[
              { name: "박지영", message: "결혼 축하해! 행복하게 살아~", date: "2024.03.10" },
              { name: "최현수", message: "두 분의 앞날에 축복이 가득하길 바랍니다.", date: "2024.03.09" },
              { name: "이미나", message: "민수야 서연아 결혼 진심으로 축하해!!", date: "2024.03.08" },
            ].map((comment, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#3d3d3d]">{comment.name}</span>
                    <span className="text-xs text-[#999]">{comment.date}</span>
                  </div>
                  <p className="text-sm text-[#666]">{comment.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            축하 메시지 남기기
          </Button>
        </section>

        {/* Share Section */}
        <section className="py-16 px-8 bg-white text-center">
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            청첩장 공유하기
          </Button>
        </section>

        {/* Footer */}
        <footer className="py-8 px-8 bg-[#faf9f7] text-center">
          <p className="text-xs text-[#999]">VOW SEOUL</p>
        </footer>
      </div>
    </div>
  )
}
