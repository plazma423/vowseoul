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
  "guestbookType" text,
  "bgmId" text,
  "kakaoThumbnail" text,
  "kakaoTitle" text,
  "kakaoDescription" text,
  "bankAccounts" jsonb,
  "contacts" jsonb,
  "status" text,
  "createdAt" text,
  "publishedUrl" text
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
