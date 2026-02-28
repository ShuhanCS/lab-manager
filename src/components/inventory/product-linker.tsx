'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { CSProduct } from '@/lib/conductscience/search'

interface ProductLinkerProps {
  /** Currently linked product ID (WooCommerce ID as string), or null */
  value: string | null
  /** Called when user links or unlinks a product */
  onChange: (productId: string | null, meta?: { sku: string }) => void
}

/**
 * Optional ConductScience product search + link component.
 * Renders nothing if CS_CONSUMER_KEY is not configured (the API route
 * returns [] and the component stays hidden until the user types).
 */
export function ProductLinker({ value, onChange }: ProductLinkerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CSProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [linked, setLinked] = useState<CSProduct | null>(null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/cs-products?q=${encodeURIComponent(q.trim())}`
      )
      if (res.ok) {
        const data: CSProduct[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      }
    } catch {
      // silently fail — the feature is optional
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(product: CSProduct) {
    setLinked(product)
    onChange(String(product.id), { sku: product.sku })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function handleUnlink() {
    setLinked(null)
    onChange(null)
  }

  // If already linked (edit mode) show the linked state
  if (value && linked) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {linked.images[0] && (
              <Image
                src={linked.images[0].src}
                alt={linked.images[0].alt || linked.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-md object-cover"
                unoptimized
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {linked.name}
              </p>
              {linked.sku && (
                <p className="text-xs text-gray-400">SKU: {linked.sku}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleUnlink}
            className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Unlink
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700">
        Link to ConductScience catalog{' '}
        <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <div className="relative mt-1">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search products..."
          className="block w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => handleSelect(product)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0].src}
                    alt={product.images[0].alt || product.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 rounded object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                    --
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {product.sku && `SKU: ${product.sku}`}
                    {product.sku && product.price && ' | '}
                    {product.price && `$${product.price}`}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
