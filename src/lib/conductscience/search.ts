export interface CSProduct {
  id: number
  name: string
  slug: string
  sku: string
  price: string
  permalink: string
  images: { src: string; alt: string }[]
}

/**
 * Search the ConductScience product catalog via WooCommerce REST API.
 * Runs server-side only (consumer key/secret are not exposed to the browser).
 */
export async function searchCSProducts(
  query: string,
  limit = 5
): Promise<CSProduct[]> {
  const url = new URL('https://conductscience.com/wp-json/wc/v3/products')
  url.searchParams.set('search', query)
  url.searchParams.set('per_page', String(limit))
  url.searchParams.set('status', 'publish')

  const key = process.env.CS_CONSUMER_KEY
  const secret = process.env.CS_CONSUMER_SECRET

  if (!key || !secret) return []

  url.searchParams.set('consumer_key', key)
  url.searchParams.set('consumer_secret', secret)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return []

    const products = await res.json()
    return products.map((p: Record<string, unknown>) => ({
      id: p.id as number,
      name: p.name as string,
      slug: p.slug as string,
      sku: (p.sku as string) || '',
      price: (p.price as string) || '',
      permalink: p.permalink as string,
      images: (
        (p.images as { src: string; alt: string }[]) || []
      ).slice(0, 1),
    }))
  } catch {
    return []
  }
}
