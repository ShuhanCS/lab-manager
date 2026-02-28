import { searchCSProducts } from '@/lib/conductscience/search'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json([])
  }

  const products = await searchCSProducts(query.trim())
  return NextResponse.json(products)
}
