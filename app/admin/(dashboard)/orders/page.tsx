'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAppStore, sampleOrders, type Order } from '@/lib/store'
import { Search, CalendarIcon, Eye, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const { orders, setOrders, updateOrder } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Removed sample orders initialization as data is now fetched from Supabase

  const filteredOrders = orders.filter(order => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!order.groomName.toLowerCase().includes(query) && 
          !order.brideName.toLowerCase().includes(query)) {
        return false
      }
    }
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }
    // Date range filter
    if (dateRange.from) {
      const orderDate = new Date(order.weddingDate)
      if (orderDate < dateRange.from) return false
    }
    if (dateRange.to) {
      const orderDate = new Date(order.weddingDate)
      if (orderDate > dateRange.to) return false
    }
    return true
  })

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrder(orderId, { status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">주문 관리</h1>
          <p className="text-muted-foreground">청첩장 주문 내역을 조회하고 관리합니다.</p>
        </div>
        <Button asChild>
          <Link href="/admin/orders/create">
            <Plus className="mr-2 h-4 w-4" />
            청첩장 추가하기
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="신랑/신부명으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="paid">결제완료</SelectItem>
                <SelectItem value="deployed">배포중</SelectItem>
                <SelectItem value="expired">만료됨</SelectItem>
                <SelectItem value="refunded">환불</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  'min-w-[200px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MM/dd', { locale: ko })} -{' '}
                        {format(dateRange.to, 'MM/dd', { locale: ko })}
                      </>
                    ) : (
                      format(dateRange.from, 'PPP', { locale: ko })
                    )
                  ) : (
                    '예식일 범위'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange as any}
                  onSelect={(range: any) => setDateRange(range || {})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(searchQuery || statusFilter !== 'all' || dateRange.from) && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setDateRange({})
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주문 목록 ({filteredOrders.length}건)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4">주문번호</th>
                  <th className="pb-3 pr-4">주문일시</th>
                  <th className="pb-3 pr-4">신랑신부</th>
                  <th className="pb-3 pr-4">예식일</th>
                  <th className="pb-3 pr-4">테마</th>
                  <th className="pb-3 pr-4">금액</th>
                  <th className="pb-3 pr-4">상태</th>
                  <th className="pb-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-sm font-medium">{order.id}</td>
                    <td className="py-3 pr-4 text-sm">{order.createdAt}</td>
                    <td className="py-3 pr-4 text-sm">
                      {order.groomName} & {order.brideName}
                    </td>
                    <td className="py-3 pr-4 text-sm">{order.weddingDate}</td>
                    <td className="py-3 pr-4 text-sm">{order.theme}</td>
                    <td className="py-3 pr-4 text-sm">{order.amount.toLocaleString()}원</td>
                    <td className="py-3 pr-4">
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[100px] text-xs">
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
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      조건에 맞는 주문이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
