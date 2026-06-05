const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using URL:', url);
console.log('Using Key:', key.substring(0, 15) + '...');

const supabase = createClient(url, key);

async function testInsert() {
  const invitationId = 'test-admin-' + Math.random().toString(36).substring(2, 10);
  
  const testInvitation = {
    id: invitationId,
    groomName: '신랑',
    groomNameEn: 'Groom',
    groomParentRelation: '의 장남',
    brideName: '신부',
    brideNameEn: 'Bride',
    brideParentRelation: '의 장녀',
    weddingDate: '2026-09-05',
    weddingTime: '12:00',
    venueName: '아름다운 웨딩홀',
    venueHall: '그랜드홀',
    venueAddress: '서울특별시 중구 태평로1가 31',
    themeId: 'classic-white',
    colorSet: 'default',
    fontSet: 'default',
    mainImage: null,
    invitationMessage: '테스트 초대글',
    galleryImages: [],
    galleryViewType: 'slide',
    trafficInfo: '지하철 시청역 5번 출구 바로 앞',
    parkingInfo: '하객 전용 주차장 2시간 무료 이용 가능',
    rsvpEnabled: true,
    rsvpMealEnabled: true,
    rsvpCommentEnabled: true,
    guestbookType: 'text',
    bgmId: 'bgm1',
    kakaoThumbnail: null,
    kakaoTitle: '신랑 ❤️ 신부 결혼합니다!',
    kakaoDescription: '설명',
    bankAccounts: [],
    contacts: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    publishedUrl: null,
    customStyles: {}
  };

  console.log('Inserting test invitation...');
  const { error: inviteError } = await supabase.from('invitations').insert(testInvitation);
  
  if (inviteError) {
    console.error('FAIL: Error inserting invitation:', JSON.stringify(inviteError, null, 2));
    console.error('inviteError properties:', Object.getOwnPropertyNames(inviteError));
    return;
  }
  
  console.log('SUCCESS: Invitation inserted successfully!');

  // Clean up
  console.log('Cleaning up...');
  await supabase.from('invitations').delete().eq('id', invitationId);
}

testInsert().catch(err => {
  console.error('Unhandled error:', err);
});
