import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase.from('invitations').select('*').limit(1)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const columns = data && data[0] ? Object.keys(data[0]) : []
    
    // Also inspect orders
    const { data: orderData } = await supabase.from('orders').select('*').limit(1)
    const orderColumns = orderData && orderData[0] ? Object.keys(orderData[0]) : []
    
    return NextResponse.json({ 
      invitationColumns: columns,
      orderColumns: orderColumns
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
