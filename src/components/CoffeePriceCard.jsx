import { useEffect, useState } from 'react'
import { BiCoffee } from 'react-icons/bi'
import './CoffeePriceCard.css'

const CACHE_KEY = 'coffee_price_cache_v2'
const CACHE_DURATION = 6 * 60 * 60 * 1000
const RATE_CACHE_KEY = 'usd_cop_rate_v2'

function seedFromDate() {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

function simulatePrice(seed) {
  const base = 2.45
  const variation = ((seed * 13 + 7) % 100) / 1000 - 0.05
  return base + variation
}

function formatDate() {
  return new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function formatCOP(n) {
  if (n == null || isNaN(n)) return '—'
  return Math.round(n).toLocaleString('es-CO')
}

export default function CoffeePriceCard() {
  const [priceCOP, setPriceCOP] = useState(null)
  const [updated, setUpdated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const p = JSON.parse(cached)
        if (p.priceCOP && Date.now() - p.timestamp < CACHE_DURATION) {
          setPriceCOP(p.priceCOP)
          setUpdated(p.updated)
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    const usd = simulatePrice(seedFromDate())

    const rateCached = localStorage.getItem(RATE_CACHE_KEY)
    if (rateCached) {
      try {
        const p = JSON.parse(rateCached)
        if (p.rate && Date.now() - p.timestamp < CACHE_DURATION) {
          const cop = usd * p.rate
          const updatedStr = formatDate()
          setPriceCOP(cop)
          setUpdated(updatedStr)
          localStorage.setItem(CACHE_KEY, JSON.stringify({ priceCOP: cop, updated: updatedStr, timestamp: Date.now() }))
          setLoading(false)
          return
        }
      } catch { /* ignore */ }
    }

    fetch('https://api.frankfurter.app/latest?from=USD&to=COP')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.rates?.COP) return
        const rate = data.rates.COP
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }))
        const cop = usd * rate
        const updatedStr = formatDate()
        setPriceCOP(cop)
        setUpdated(updatedStr)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ priceCOP: cop, updated: updatedStr, timestamp: Date.now() }))
      })
      .catch(() => {
        if (cancelled) return
        const fallbackRate = 4200
        const cop = usd * fallbackRate
        const updatedStr = formatDate()
        setPriceCOP(cop)
        setUpdated(updatedStr)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ priceCOP: cop, updated: updatedStr, timestamp: Date.now() }))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="coffee-card">
      <div className="coffee-card-header">
        <BiCoffee size={20} />
        <span className="coffee-card-title">Precio del Café</span>
      </div>
      <div className="coffee-card-body">
        {loading ? (
          <span className="coffee-card-loading">Cargando...</span>
        ) : (
          <>
            <span className="coffee-card-price">${formatCOP(priceCOP)}</span>
            <span className="coffee-card-unit">COP / lb</span>
          </>
        )}
      </div>
      <div className="coffee-card-footer">
        <span className="coffee-card-updated">{updated}</span>
        <span className="coffee-card-est">⏳ estimado</span>
      </div>
    </div>
  )
}
