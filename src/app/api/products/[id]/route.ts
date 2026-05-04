import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stockChange, name, description, price, isActive } = body

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (stockChange !== undefined) {
      const newStock = existing.stock + stockChange
      if (newStock < 0) {
        return NextResponse.json({ error: '库存不足，无法减少' }, { status: 400 })
      }
      updateData.stock = newStock
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (isActive !== undefined) updateData.isActive = isActive

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    // Check if product has any orders
    const orderCount = await db.order.count({ where: { productId: id } })
    if (orderCount > 0) {
      // Soft delete - mark as inactive instead of deleting
      const product = await db.product.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        message: '商品已有订单，已标记为下架',
        product,
      })
    }

    await db.product.delete({ where: { id } })
    return NextResponse.json({ message: '商品已删除' })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
