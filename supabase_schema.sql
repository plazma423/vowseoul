-- Last updated: 2026-05-02 12:54:00
-- Supabase SQL Schema for VOW SEOUL
-- 이 쿼리를 Supabase SQL Editor에 복사하여 실행하세요.

-- 1. FAQs 테이블
CREATE TABLE IF NOT EXISTS public.faqs (
  "id" text PRIMARY KEY,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" text,
  "createdAt" text
);

-- 2. Themes 테이블
CREATE TABLE IF NOT EXISTS public.themes (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "thumbnail" text,
  "tags" jsonb,
  "colorSets" jsonb,
  "fontSets" jsonb,
  "layout" text,
  "styles" jsonb,
  "recommendedBgms" jsonb
);

-- 기존 테이블 업데이트 (만약 이미 존재할 경우)
ALTER TABLE public.themes ADD COLUMN IF NOT EXISTS "recommendedBgms" jsonb;

-- 3. BGMs 테이블
CREATE TABLE IF NOT EXISTS public.bgms (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "artist" text,
  "genre" text,
  "hashtags" text,
  "duration" text,
  "url" text,
  "isRecommended" boolean DEFAULT false
);

-- 기존 테이블 업데이트 (만약 이미 존재할 경우)
ALTER TABLE public.bgms ADD COLUMN IF NOT EXISTS "genre" text;
ALTER TABLE public.bgms ADD COLUMN IF NOT EXISTS "hashtags" text;

-- 4. Orders 테이블
CREATE TABLE IF NOT EXISTS public.orders (
  "id" text PRIMARY KEY,
  "invitationId" text,
  "customerName" text,
  "groomName" text,
  "brideName" text,
  "weddingDate" text,
  "theme" text,
  "amount" numeric,
  "status" text,
  "createdAt" text,
  "notes" text
);

-- 5. Invitations 테이블
CREATE TABLE IF NOT EXISTS public.invitations (
  "id" text PRIMARY KEY,
  "groomName" text,
  "groomNameEn" text,
  "groomParentRelation" text,
  "brideName" text,
  "brideNameEn" text,
  "brideParentRelation" text,
  "weddingDate" text,
  "weddingTime" text,
  "venueName" text,
  "venueHall" text,
  "venueAddress" text,
  "themeId" text,
  "colorSet" text,
  "fontSet" text,
  "mainImage" text,
  "invitationMessage" text,
  "galleryImages" jsonb,
  "galleryViewType" text,
  "trafficInfo" text,
  "parkingInfo" text,
  "rsvpEnabled" boolean,
  "rsvpMealEnabled" boolean DEFAULT true,
  "rsvpCommentEnabled" boolean DEFAULT true,
  "guestbookType" text,
  "bgmId" text,
  "kakaoThumbnail" text,
  "kakaoTitle" text,
  "kakaoDescription" text,
  "bankAccounts" jsonb,
  "contacts" jsonb,
  "status" text,
  "createdAt" text,
  "publishedUrl" text,
  "customStyles" jsonb
);

-- 6. Inquiries (Contact) 테이블
CREATE TABLE IF NOT EXISTS public.inquiries (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "status" text DEFAULT 'pending',
  "createdAt" timestamp with time zone DEFAULT now()
);

-- 7. Settings (Global Config) 테이블
CREATE TABLE IF NOT EXISTS public.settings (
  "key" text PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now()
);

-- Row Level Security (RLS) 비활성화 또는 설정 (현재는 편의상 모두 접근 허용)
ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bgms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 설정(Settings) 초기 데이터 삽입
INSERT INTO public.settings ("key", "value") VALUES
('hero_content', '{"title": "소중한 서약을 담아드립니다", "description": "손 쉽게 완성하는 당신만의 특별한 웨딩 초대장. 우아하고 세련된 모바일 청첩장을 직접 만들어보세요.", "fontFamily": "font-serif", "titleFontSize": "text-5xl", "descFontSize": "text-base", "layout": "text-center"}')
ON CONFLICT DO NOTHING;

-- 초기 샘플 데이터 삽입 (선택 사항)
INSERT INTO public.faqs ("id", "question", "answer", "category", "createdAt") VALUES
('faq1', '청첩장 제작은 얼마나 걸리나요?', '기본 템플릿을 사용할 경우 결제 완료 후 10분 내로 즉시 제작되어 배포가 가능합니다.', '제작', '2025-01-01'),
('faq2', '완성된 청첩장을 수정할 수 있나요?', '네, 결제 후에도 언제든지 내용을 수정하실 수 있으며, 변경 사항은 실시간으로 반영됩니다.', '수정', '2025-01-02'),
('faq3', '환불 규정이 어떻게 되나요?', '결제 후 7일 이내, 청첩장을 한 번도 공유하지 않은 경우에 한하여 전액 환불이 가능합니다.', '결제', '2025-01-03')
ON CONFLICT DO NOTHING;

INSERT INTO public.themes ("id", "name", "thumbnail", "tags", "colorSets", "fontSets") VALUES
('classic-white', 'Classic White', '/themes/classic-white.jpg', '["클래식", "화이트", "미니멀"]', '[{"id": "ivory", "name": "Ivory", "colors": ["#FFFFF0", "#F5F5DC", "#2C2C2C"]}, {"id": "blush", "name": "Blush", "colors": ["#FFF5F5", "#FFE4E1", "#2C2C2C"]}]', '[{"id": "serif", "name": "명조체", "fonts": ["Noto Serif KR", "Georgia"]}, {"id": "sans", "name": "고딕체", "fonts": ["Pretendard", "Arial"]}]'),
('romantic-rose', 'Romantic Rose', '/themes/romantic-rose.jpg', '["로맨틱", "핑크", "플라워"]', '[{"id": "rose", "name": "Rose", "colors": ["#FFF0F5", "#FFB6C1", "#4A4A4A"]}, {"id": "coral", "name": "Coral", "colors": ["#FFF5EE", "#FFA07A", "#4A4A4A"]}]', '[{"id": "elegant", "name": "엘레강스", "fonts": ["Nanum Myeongjo", "Playfair Display"]}, {"id": "modern", "name": "모던", "fonts": ["Pretendard", "Montserrat"]}]')
ON CONFLICT DO NOTHING;

INSERT INTO public.bgms ("id", "name", "artist", "duration", "url", "isRecommended") VALUES
('bgm1', 'Canon in D', 'Pachelbel', '3:24', '/bgm/canon.mp3', true),
('bgm2', 'A Thousand Years', 'Christina Perri', '4:45', '/bgm/thousand.mp3', true),
('bgm3', 'River Flows in You', 'Yiruma', '3:30', '/bgm/river.mp3', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.orders ("id", "invitationId", "customerName", "groomName", "brideName", "weddingDate", "theme", "amount", "status", "createdAt", "notes") VALUES
('ORD001', 'INV001', '김철수', '김철수', '이영희', '2025-03-15', 'Classic White', 50000, 'deployed', '2025-01-10', ''),
('ORD002', 'INV002', '박민수', '박민수', '최수진', '2025-04-20', 'Romantic Rose', 50000, 'paid', '2025-01-12', '배경음악 변경 요청')
ON CONFLICT DO NOTHING;

-- 8. Notices 테이블 추가
CREATE TABLE IF NOT EXISTS public.notices (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "category" text NOT NULL,
  "createdAt" text NOT NULL
);

ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;

-- 초기 샘플 공지사항 데이터 삽입
INSERT INTO public.notices ("id", "title", "content", "category", "createdAt") VALUES
('notice1', 'VOW SEOUL 모바일 청첩장 서비스 정식 오픈 안내', '안녕하세요. VOW SEOUL입니다.\n가장 소중한 날을 아름답게 장식할 수 있도록 우아하고 프리미엄한 모바일 청첩장 서비스를 시작합니다.\n\n다양한 테마와 실시간 미리보기, 배경음악(BGM) 설정 및 송금 계좌 연동 등 완벽한 기능들을 지금 바로 만나보세요.\n\n앞으로도 더 나은 서비스로 보답하겠습니다.\n감사합니다.', '안내', '2026-06-01'),
('notice2', '축의금 송금 계좌 및 연락처 편집 기능 업데이트 완료', '안녕하세요. VOW SEOUL입니다.\n고객님들의 피드백을 반영하여 청첩장 만들기 페이지에서 등록하신 축의금 송금 계좌번호 및 연락처의 "수정" 기능이 추가되었습니다.\n이제 오타 수정 및 세부 사항 변경을 위해 삭제 후 재등록할 필요 없이 즉시 수정하여 편리하게 청첩장을 제작할 수 있습니다.\n\n더 나은 사용성을 위해 계속 노력하겠습니다.', '업데이트', '2026-06-03'),
('notice3', '6월 서비스 안정화 및 정기 점검 안내 (6월 10일)', '안녕하세요. VOW SEOUL 개발팀입니다.\n안정적인 서비스 제공을 위해 정기 서버 점검 및 최적화 작업이 진행될 예정입니다.\n\n- 일시: 2026년 6월 10일(수) 오전 02:00 ~ 05:00 (약 3시간)\n- 대상: VOW SEOUL 전체 서비스\n- 내용: 데이터베이스 안정화 작업 및 보안 패치 적용\n\n점검 시간 동안에는 청첩장 작성 및 수정이 일시적으로 제한될 수 있으니 양해 부탁드립니다.', '점검', '2026-06-02')
ON CONFLICT DO NOTHING;

-- 9. 기존 테이블 업데이트 (신규 추가된 RSVP 옵션 컬럼)
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS "rsvpMealEnabled" boolean DEFAULT true;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS "rsvpCommentEnabled" boolean DEFAULT true;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS "customStyles" jsonb;

-- 10. rsvps 테이블 컬럼 확장
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS "side" text; -- 'groom' / 'bride'
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS "shuttleUsed" boolean DEFAULT false;
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS "mealInfo" jsonb;

-- 11. guestbook 테이블 생성 (방명록 글 보관 및 비공개 전환용)
CREATE TABLE IF NOT EXISTS public.guestbook (
  "id" text PRIMARY KEY,
  "invitationId" text NOT NULL,
  "name" text NOT NULL,
  "message" text NOT NULL,
  "is_visible" boolean DEFAULT true,
  "createdAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE public.guestbook DISABLE ROW LEVEL SECURITY;

-- 12. visitor_logs 테이블 생성 (최근 7일 방문자 분석 그래프용)
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invitationId" text NOT NULL,
  "visitedDate" date DEFAULT CURRENT_DATE,
  "visitedAt" timestamp with time zone DEFAULT now()
);

ALTER TABLE public.visitor_logs DISABLE ROW LEVEL SECURITY;



