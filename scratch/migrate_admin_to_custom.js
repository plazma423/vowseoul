const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// env 파일 읽어서 파싱
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  console.log('Starting migration: admin__ to custom__ for all invitations and orders...');

  // 1. admin__ 으로 시작하는 청첩장 데이터 로드
  const { data: invitations, error: inviteError } = await supabase
    .from('invitations')
    .select('*')
    .like('id', 'admin__%');

  if (inviteError) {
    console.error('Error fetching invitations:', inviteError);
    return;
  }

  console.log(`Found ${invitations.length} invitations starting with "admin__"`);

  // 2. admin__ 으로 시작하는 주문 데이터 로드
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .like('invitationId', 'admin__%');

  if (orderError) {
    console.error('Error fetching orders:', orderError);
    return;
  }

  console.log(`Found ${orders.length} orders referenced with "admin__" invitationId`);

  // 3. 순회하며 복사 및 마이그레이션 처리
  for (const invite of invitations) {
    const oldId = invite.id;
    const newId = oldId.replace('admin__', 'custom__');
    console.log(`Migrating invitation: ${oldId} -> ${newId}`);

    // 복사본 구성
    const newInvite = {
      ...invite,
      id: newId
    };

    // a. invitations 테이블에 새 id로 삽입
    const { error: insertError } = await supabase
      .from('invitations')
      .insert(newInvite);

    if (insertError) {
      console.error(`Failed to insert new invitation ${newId}:`, insertError);
      continue; // 오류 시 스킵하여 롤백 방지
    }

    // b. orders 테이블에서 구 id를 참조하는 레코드들의 invitationId를 새 id로 변경
    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ invitationId: newId })
      .eq('invitationId', oldId);

    if (updateOrderError) {
      console.error(`Failed to update orders referencing ${oldId}:`, updateOrderError);
      // 복원(새 청첩장 지우기) 시도 가능
      await supabase.from('invitations').delete().eq('id', newId);
      continue;
    }

    // c. invitations 테이블에서 구 id 삭제
    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', oldId);

    if (deleteError) {
      console.error(`Failed to delete old invitation ${oldId}:`, deleteError);
    } else {
      console.log(`Successfully migrated ${oldId} to ${newId}`);
    }
  }

  // 4. invitations에 매칭되지 않으나 orders에서 여전히 admin__을 참조하는 미아 데이터 정리
  const { data: remainingOrders, error: remainOrderError } = await supabase
    .from('orders')
    .select('*')
    .like('invitationId', 'admin__%');

  if (!remainOrderError && remainingOrders.length > 0) {
    console.log(`Updating ${remainingOrders.length} orphaned orders referencing "admin__"`);
    for (const order of remainingOrders) {
      const oldRef = order.invitationId;
      const newRef = oldRef.replace('admin__', 'custom__');
      await supabase
        .from('orders')
        .update({ invitationId: newRef })
        .eq('id', order.id);
      console.log(`Updated orphaned order ${order.id}: ${oldRef} -> ${newRef}`);
    }
  }

  console.log('Migration completed.');
}

runMigration();
