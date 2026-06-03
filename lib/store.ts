import { create } from 'zustand'
import { supabase } from './supabase'

export interface WeddingInvitation {
  id: string
  groomName: string
  groomNameEn: string
  groomParentRelation: string
  brideName: string
  brideNameEn: string
  brideParentRelation: string
  weddingDate: string
  weddingTime: string
  venueName: string
  venueHall: string
  venueAddress: string
  themeId: string
  colorSet: string
  fontSet: string
  mainImage: string | null
  invitationMessage: string
  galleryImages: string[]
  galleryViewType: 'grid' | 'slide'
  trafficInfo: string
  parkingInfo: string
  rsvpEnabled: boolean
  guestbookType: 'text' | 'audio'
  bgmId: string | null
  kakaoThumbnail: string | null
  kakaoTitle: string
  kakaoDescription: string
  bankAccounts: BankAccount[]
  contacts: Contact[]
  status: 'draft' | 'paid' | 'published' | 'expired'
  createdAt: string
  publishedUrl: string | null
}

export interface BankAccount {
  id: string
  bank: string
  accountNumber: string
  accountHolder: string
  relation: 'groom' | 'bride' | 'groomParent' | 'brideParent'
}

export interface Contact {
  id: string
  name: string
  phone: string
  relation: string
}

export interface Theme {
  id: string
  name: string
  thumbnail: string
  tags: string[]
  colorSets: { id: string; name: string; colors: string[] }[]
  fontSets: { id: string; name: string; fonts: string[] }[]
  layout?: string
  styles?: {
    fontSizeBase?: string
    letterSpacing?: string
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

export interface BGM {
  id: string
  name: string
  artist: string
  duration: string
  url: string
  isRecommended: boolean
}

export interface Order {
  id: string
  invitationId: string
  customerName: string
  groomName: string
  brideName: string
  weddingDate: string
  theme: string
  amount: number
  status: 'pending' | 'paid' | 'deployed' | 'expired' | 'refunded'
  createdAt: string
  notes: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  category?: string
  createdAt: string
}

interface AppState {
  // Data fetching
  fetchData: () => Promise<void>
  
  // Current invitation being edited
  currentInvitation: Partial<WeddingInvitation> | null
  setCurrentInvitation: (invitation: Partial<WeddingInvitation> | null) => void
  updateCurrentInvitation: (updates: Partial<WeddingInvitation>) => void
  loadInvitation: (id: string) => Promise<void>
  saveInvitation: () => Promise<string | null>
  
  // User's invitations
  invitations: WeddingInvitation[]
  setInvitations: (invitations: WeddingInvitation[]) => void
  addInvitation: (invitation: WeddingInvitation) => Promise<void>
  
  // Themes
  themes: Theme[]
  setThemes: (themes: Theme[]) => void
  
  // BGM
  bgmList: BGM[]
  setBgmList: (bgm: BGM[]) => void
  
  // Admin state
  orders: Order[]
  setOrders: (orders: Order[]) => void
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>
  
  // FAQ state
  faqs: FAQ[]
  setFaqs: (faqs: FAQ[]) => void
  addFaq: (faq: FAQ) => Promise<void>
  updateFaq: (id: string, faq: Partial<FAQ>) => Promise<void>
  deleteFaq: (id: string) => Promise<void>
  
  // UI state
  editorStep: number
  setEditorStep: (step: number) => void
  
  // Auth state
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (isAuthenticated: boolean, isAdmin: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  fetchData: async () => {
    try {
      const [
        { data: faqs },
        { data: themes },
        { data: bgms },
        { data: orders },
        { data: invitations }
      ] = await Promise.all([
        supabase.from('faqs').select('*'),
        supabase.from('themes').select('*'),
        supabase.from('bgms').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('invitations').select('*')
      ])
      
      set({
        faqs: faqs || [],
        themes: themes || [],
        bgmList: bgms || [],
        orders: orders || [],
        invitations: invitations || []
      })
    } catch (e) {
      console.error('Error fetching data from Supabase:', e)
    }
  },

  currentInvitation: null,
  setCurrentInvitation: (invitation) => set({ currentInvitation: invitation }),
  updateCurrentInvitation: (updates) => set((state) => ({
    currentInvitation: state.currentInvitation 
      ? { ...state.currentInvitation, ...updates }
      : updates
  })),
  loadInvitation: async (id) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        set({ currentInvitation: data })
      }
    } catch (e) {
      console.error('Error loading invitation from Supabase:', e)
    }
  },
  saveInvitation: async () => {
    const state = useAppStore.getState()
    const current = state.currentInvitation
    if (!current) return null

    try {
      let id = current.id
      const isNew = !id || id === 'new'

      if (isNew) {
        id = typeof window !== 'undefined' && window.crypto?.randomUUID 
          ? window.crypto.randomUUID() 
          : 'inv-' + Math.random().toString(36).substring(2, 15)
      }

      const invitationData = {
        ...current,
        id,
      } as any

      if (isNew) {
        invitationData.createdAt = new Date().toISOString()
        invitationData.status = invitationData.status || 'draft'
        const { error } = await supabase.from('invitations').insert(invitationData)
        if (error) throw error
      } else {
        const { error } = await supabase.from('invitations').update(invitationData).eq('id', id)
        if (error) throw error
      }

      set((state) => {
        const updatedInvitation = { ...current, ...invitationData } as WeddingInvitation
        const updatedList = isNew 
          ? [...state.invitations, updatedInvitation]
          : state.invitations.map(inv => inv.id === id ? updatedInvitation : inv)
        
        return {
          currentInvitation: updatedInvitation,
          invitations: updatedList
        }
      })

      return id
    } catch (e) {
      console.error('Error saving invitation to Supabase:', e)
      return null
    }
  },
  
  invitations: [],
  setInvitations: (invitations) => set({ invitations }),
  addInvitation: async (invitation) => {
    await supabase.from('invitations').insert(invitation)
    set((state) => ({
      invitations: [...state.invitations, invitation]
    }))
  },
  
  themes: [],
  setThemes: (themes) => set({ themes }),
  
  bgmList: [],
  setBgmList: (bgmList) => set({ bgmList }),
  
  orders: [],
  setOrders: (orders) => set({ orders }),
  updateOrder: async (id, updates) => {
    await supabase.from('orders').update(updates).eq('id', id)
    set((state) => ({
      orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
    }))
  },
  
  faqs: [],
  setFaqs: (faqs) => set({ faqs }),
  addFaq: async (faq) => {
    await supabase.from('faqs').insert(faq)
    set((state) => ({ faqs: [...state.faqs, faq] }))
  },
  updateFaq: async (id, faq) => {
    await supabase.from('faqs').update(faq).eq('id', id)
    set((state) => ({
      faqs: state.faqs.map(f => f.id === id ? { ...f, ...faq } : f)
    }))
  },
  deleteFaq: async (id) => {
    await supabase.from('faqs').delete().eq('id', id)
    set((state) => ({
      faqs: state.faqs.filter(f => f.id !== id)
    }))
  },
  
  editorStep: 1,
  setEditorStep: (editorStep) => set({ editorStep }),
  
  isAuthenticated: false,
  isAdmin: false,
  setAuth: (isAuthenticated, isAdmin) => set({ isAuthenticated, isAdmin }),
}))

// Sample data
export const sampleThemes: Theme[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    thumbnail: '/themes/classic-white.jpg',
    tags: ['클래식', '화이트', '미니멀'],
    colorSets: [
      { id: 'ivory', name: 'Ivory', colors: ['#FFFFF0', '#F5F5DC', '#2C2C2C'] },
      { id: 'blush', name: 'Blush', colors: ['#FFF5F5', '#FFE4E1', '#2C2C2C'] },
    ],
    fontSets: [
      { id: 'serif', name: '명조체', fonts: ['Noto Serif KR', 'Georgia'] },
      { id: 'sans', name: '고딕체', fonts: ['Pretendard', 'Arial'] },
    ],
  },
  {
    id: 'romantic-rose',
    name: 'Romantic Rose',
    thumbnail: '/themes/romantic-rose.jpg',
    tags: ['로맨틱', '핑크', '플라워'],
    colorSets: [
      { id: 'rose', name: 'Rose', colors: ['#FFF0F5', '#FFB6C1', '#4A4A4A'] },
      { id: 'coral', name: 'Coral', colors: ['#FFF5EE', '#FFA07A', '#4A4A4A'] },
    ],
    fontSets: [
      { id: 'elegant', name: '엘레강스', fonts: ['Nanum Myeongjo', 'Playfair Display'] },
      { id: 'modern', name: '모던', fonts: ['Pretendard', 'Montserrat'] },
    ],
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    thumbnail: '/themes/modern-minimal.jpg',
    tags: ['모던', '미니멀', '심플'],
    colorSets: [
      { id: 'mono', name: 'Mono', colors: ['#FFFFFF', '#F0F0F0', '#1A1A1A'] },
      { id: 'warm', name: 'Warm', colors: ['#FFFAF5', '#F5E6D3', '#2C2C2C'] },
    ],
    fontSets: [
      { id: 'clean', name: '클린', fonts: ['Pretendard', 'Inter'] },
      { id: 'bold', name: '볼드', fonts: ['Pretendard', 'DM Sans'] },
    ],
  },
  {
    id: 'garden-greenery',
    name: 'Garden Greenery',
    thumbnail: '/themes/garden-greenery.jpg',
    tags: ['가든', '그린', '내추럴'],
    colorSets: [
      { id: 'sage', name: 'Sage', colors: ['#F5F5F0', '#9CAF88', '#3A3A3A'] },
      { id: 'olive', name: 'Olive', colors: ['#FAFAF5', '#808000', '#3A3A3A'] },
    ],
    fontSets: [
      { id: 'natural', name: '내추럴', fonts: ['Nanum Myeongjo', 'Cormorant'] },
      { id: 'fresh', name: '프레시', fonts: ['Pretendard', 'Nunito'] },
    ],
  },
  {
    id: 'elegant-navy',
    name: 'Elegant Navy',
    thumbnail: '/themes/elegant-navy.jpg',
    tags: ['엘레강스', '네이비', '고급'],
    colorSets: [
      { id: 'navy', name: 'Navy', colors: ['#F5F5FA', '#1B2951', '#FFFFFF'] },
      { id: 'midnight', name: 'Midnight', colors: ['#F0F0F5', '#191970', '#FFFFFF'] },
    ],
    fontSets: [
      { id: 'luxury', name: '럭셔리', fonts: ['Nanum Myeongjo', 'Cinzel'] },
      { id: 'refined', name: '정제', fonts: ['Pretendard', 'Libre Baskerville'] },
    ],
  },
  {
    id: 'sunset-warmth',
    name: 'Sunset Warmth',
    thumbnail: '/themes/sunset-warmth.jpg',
    tags: ['웜톤', '선셋', '따뜻한'],
    colorSets: [
      { id: 'sunset', name: 'Sunset', colors: ['#FFF8F0', '#E8A87C', '#3A3A3A'] },
      { id: 'terracotta', name: 'Terracotta', colors: ['#FAF5F0', '#C47151', '#3A3A3A'] },
    ],
    fontSets: [
      { id: 'warm', name: '웜', fonts: ['Nanum Myeongjo', 'Lora'] },
      { id: 'cozy', name: '코지', fonts: ['Pretendard', 'Quicksand'] },
    ],
  },
]

export const sampleBGMs: BGM[] = [
  { id: 'bgm1', name: 'Canon in D', artist: 'Pachelbel', duration: '3:24', url: '/bgm/canon.mp3', isRecommended: true },
  { id: 'bgm2', name: 'A Thousand Years', artist: 'Christina Perri', duration: '4:45', url: '/bgm/thousand.mp3', isRecommended: true },
  { id: 'bgm3', name: 'River Flows in You', artist: 'Yiruma', duration: '3:30', url: '/bgm/river.mp3', isRecommended: false },
  { id: 'bgm4', name: 'Wedding March', artist: 'Mendelssohn', duration: '4:52', url: '/bgm/wedding.mp3', isRecommended: false },
  { id: 'bgm5', name: 'Perfect', artist: 'Ed Sheeran', duration: '4:23', url: '/bgm/perfect.mp3', isRecommended: true },
]

export const sampleOrders: Order[] = [
  { id: 'ORD001', invitationId: 'INV001', customerName: '김철수', groomName: '김철수', brideName: '이영희', weddingDate: '2025-03-15', theme: 'Classic White', amount: 50000, status: 'deployed', createdAt: '2025-01-10', notes: '' },
  { id: 'ORD002', invitationId: 'INV002', customerName: '박민수', groomName: '박민수', brideName: '최수진', weddingDate: '2025-04-20', theme: 'Romantic Rose', amount: 50000, status: 'paid', createdAt: '2025-01-12', notes: '배경음악 변경 요청' },
  { id: 'ORD003', invitationId: 'INV003', customerName: '정대호', groomName: '정대호', brideName: '한지민', weddingDate: '2025-02-28', theme: 'Modern Minimal', amount: 50000, status: 'deployed', createdAt: '2025-01-08', notes: '' },
]

export const sampleFaqs: FAQ[] = [
  { id: 'faq1', question: '청첩장 제작은 얼마나 걸리나요?', answer: '기본 템플릿을 사용할 경우 결제 완료 후 10분 내로 즉시 제작되어 배포가 가능합니다.', category: '제작', createdAt: '2025-01-01' },
  { id: 'faq2', question: '완성된 청첩장을 수정할 수 있나요?', answer: '네, 결제 후에도 언제든지 내용을 수정하실 수 있으며, 변경 사항은 실시간으로 반영됩니다.', category: '수정', createdAt: '2025-01-02' },
  { id: 'faq3', question: '환불 규정이 어떻게 되나요?', answer: '결제 후 7일 이내, 청첩장을 한 번도 공유하지 않은 경우에 한하여 전액 환불이 가능합니다.', category: '결제', createdAt: '2025-01-03' },
]

export const sampleInvitations: WeddingInvitation[] = [
  {
    id: 'INV001',
    groomName: '김철수',
    groomNameEn: 'Kim Cheolsu',
    groomParentRelation: '아버지 김영수, 어머니 박미영의 장남',
    brideName: '이영희',
    brideNameEn: 'Lee Younghee',
    brideParentRelation: '아버지 이정호, 어머니 최순희의 차녀',
    weddingDate: '2025-03-15',
    weddingTime: '14:00',
    venueName: '그랜드 하얏트 서울',
    venueHall: '그랜드볼룸',
    venueAddress: '서울특별시 용산구 소월로 322',
    themeId: 'classic-white',
    colorSet: 'ivory',
    fontSet: 'serif',
    mainImage: null,
    invitationMessage: '서로 다른 길을 걸어온 저희 두 사람이\n이제 하나의 길을 함께 걸어가려 합니다.\n귀한 걸음으로 축복해 주시면 감사하겠습니다.',
    galleryImages: [],
    galleryViewType: 'slide',
    trafficInfo: '지하철 6호선 이태원역 1번 출구에서 도보 5분',
    parkingInfo: '호텔 지하주차장 이용 가능 (3시간 무료)',
    rsvpEnabled: true,
    guestbookType: 'text',
    bgmId: 'bgm1',
    kakaoThumbnail: null,
    kakaoTitle: '철수 ♥ 영희 결혼합니다',
    kakaoDescription: '2025년 3월 15일 오후 2시',
    bankAccounts: [
      { id: '1', bank: '신한은행', accountNumber: '110-123-456789', accountHolder: '김철수', relation: 'groom' },
      { id: '2', bank: '국민은행', accountNumber: '123-456-789012', accountHolder: '이영희', relation: 'bride' },
    ],
    contacts: [
      { id: '1', name: '김철수', phone: '010-1234-5678', relation: '신랑' },
      { id: '2', name: '이영희', phone: '010-8765-4321', relation: '신부' },
    ],
    status: 'published',
    createdAt: '2025-01-10',
    publishedUrl: 'https://vow.seoul/inv/abc123',
  },
]
