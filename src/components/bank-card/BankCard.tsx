'use client'

import React, { useMemo } from 'react'
import { Gem } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

export type BankCardTier = 'copper' | 'silver' | 'gold' | 'diamond' | 'blackgold'

export interface BankCardProps {
  membershipLevel: BankCardTier
  username: string
  /** Last 4 digits of card number (default random) */
  lastFourDigits?: string
  /** Expiry month (1-12) */
  expiryMonth?: number
  /** Expiry year (e.g. 2029) */
  expiryYear?: number
  /** Additional CSS class for the outer container */
  className?: string
}

// ─── Card Config ────────────────────────────────────────────────────────────

interface CardConfig {
  tierKey: string
  tierLabel: string
  tierLabelEn: string
  gradient: string
  chipGradient: string
  chipBorderColor: string
  chipLineBg: string
  cardClass: string
  defaultShadow: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  overlayEffect: 'none' | 'holographic' | 'gold-shimmer'
  sparkleDots: boolean
  subtlePattern: string
  accentColor: string
}

const CARD_CONFIGS: Record<BankCardTier, CardConfig> = {
  copper: {
    tierKey: 'copper',
    tierLabel: '铜牌',
    tierLabelEn: 'COPPER',
    gradient: 'linear-gradient(135deg, #B87333 0%, #D4A574 30%, #8B5E3C 60%, #B87333 80%, #D4A574 100%)',
    chipGradient: 'linear-gradient(135deg, #D4A574 0%, #B87333 40%, #D4A574 60%, #8B5E3C 100%)',
    chipBorderColor: 'rgba(212, 165, 116, 0.5)',
    chipLineBg: 'rgba(184, 115, 51, 0.3)',
    cardClass: 'bankcard-copper',
    defaultShadow: '0 10px 30px -8px rgba(184, 115, 51, 0.25), 0 4px 12px -4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
    badgeBg: 'rgba(139, 94, 60, 0.6)',
    badgeBorder: 'rgba(212, 165, 116, 0.5)',
    badgeText: '#D4A574',
    overlayEffect: 'none',
    sparkleDots: false,
    subtlePattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 40%)',
    accentColor: '#D4A574',
  },
  silver: {
    tierKey: 'silver',
    tierLabel: '银牌',
    tierLabelEn: 'SILVER',
    gradient: 'linear-gradient(135deg, #A8A9AD 0%, #E8E8E8 25%, #C0C0C0 50%, #A8A9AD 75%, #E8E8E8 100%)',
    chipGradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 40%, #A8A9AD 60%, #E8E8E8 100%)',
    chipBorderColor: 'rgba(232, 232, 232, 0.5)',
    chipLineBg: 'rgba(168, 169, 173, 0.3)',
    cardClass: 'bankcard-silver',
    defaultShadow: '0 10px 30px -8px rgba(192, 192, 192, 0.25), 0 4px 12px -4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)',
    badgeBg: 'rgba(168, 169, 173, 0.5)',
    badgeBorder: 'rgba(232, 232, 232, 0.5)',
    badgeText: '#E8E8E8',
    overlayEffect: 'none',
    sparkleDots: false,
    subtlePattern: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 40%)',
    accentColor: '#E8E8E8',
  },
  gold: {
    tierKey: 'gold',
    tierLabel: '黄金',
    tierLabelEn: 'GOLD',
    gradient: 'linear-gradient(135deg, #B8860B 0%, #FFD700 25%, #DAA520 50%, #FFD700 75%, #B8860B 100%)',
    chipGradient: 'linear-gradient(135deg, #FFD700 0%, #DAA520 40%, #FFD700 60%, #B8860B 100%)',
    chipBorderColor: 'rgba(255, 215, 0, 0.5)',
    chipLineBg: 'rgba(218, 165, 32, 0.3)',
    cardClass: 'bankcard-gold',
    defaultShadow: '0 10px 30px -8px rgba(255, 215, 0, 0.25), 0 4px 12px -4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
    badgeBg: 'rgba(218, 165, 32, 0.6)',
    badgeBorder: 'rgba(255, 215, 0, 0.5)',
    badgeText: '#FFD700',
    overlayEffect: 'none',
    sparkleDots: false,
    subtlePattern: 'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 25% 75%, rgba(255,255,255,0.06) 0%, transparent 40%)',
    accentColor: '#FFD700',
  },
  diamond: {
    tierKey: 'diamond',
    tierLabel: '钻石',
    tierLabelEn: 'DIAMOND',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 80%, #16213e 100%)',
    chipGradient: 'linear-gradient(135deg, #A8A9AD 0%, #C0C0C0 30%, #00d4ff 70%, #A8A9AD 100%)',
    chipBorderColor: 'rgba(0, 212, 255, 0.4)',
    chipLineBg: 'rgba(0, 212, 255, 0.2)',
    cardClass: 'bankcard-diamond',
    defaultShadow: '0 10px 30px -8px rgba(0, 212, 255, 0.15), 0 4px 12px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0, 212, 255, 0.1)',
    badgeBg: 'rgba(0, 212, 255, 0.15)',
    badgeBorder: 'rgba(0, 212, 255, 0.4)',
    badgeText: '#00d4ff',
    overlayEffect: 'holographic',
    sparkleDots: true,
    subtlePattern: 'radial-gradient(circle at 80% 20%, rgba(0, 212, 255, 0.06) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(138, 43, 226, 0.04) 0%, transparent 40%)',
    accentColor: '#00d4ff',
  },
  blackgold: {
    tierKey: 'blackgold',
    tierLabel: '黑金',
    tierLabelEn: 'BLACK GOLD',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #0a0a0a 60%, #1a1a1a 80%, #0a0a0a 100%)',
    chipGradient: 'linear-gradient(135deg, #FFD700 0%, #DAA520 40%, #FFD700 60%, #B8860B 100%)',
    chipBorderColor: 'rgba(255, 215, 0, 0.4)',
    chipLineBg: 'rgba(255, 215, 0, 0.2)',
    cardClass: 'bankcard-blackgold',
    defaultShadow: '0 10px 30px -8px rgba(255, 215, 0, 0.12), 0 4px 12px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 215, 0, 0.08)',
    badgeBg: 'rgba(255, 215, 0, 0.1)',
    badgeBorder: 'rgba(255, 215, 0, 0.4)',
    badgeText: '#FFD700',
    overlayEffect: 'gold-shimmer',
    sparkleDots: false,
    subtlePattern: 'radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(255, 215, 0, 0.02) 0%, transparent 40%)',
    accentColor: '#FFD700',
  },
}

// ─── EMV Chip SVG ───────────────────────────────────────────────────────────

function ChipIcon({ gradient, borderColor, lineBg }: {
  gradient: string
  borderColor: string
  lineBg: string
}) {
  return (
    <svg width="42" height="32" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
          {/* Fallback – actual gradient set via inline style */}
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#8B5E3C" />
        </linearGradient>
      </defs>
      {/* Outer chip body */}
      <rect x="1" y="1" width="40" height="30" rx="6" ry="6" fill={gradient} stroke={borderColor} strokeWidth="1" />
      {/* Inner border */}
      <rect x="4" y="4" width="34" height="24" rx="4" ry="4" stroke={borderColor} strokeWidth="0.8" fill="none" />
      {/* Horizontal center line */}
      <line x1="0" y1="16" x2="42" y2="16" stroke={lineBg} strokeWidth="1.2" />
      {/* Vertical center line */}
      <line x1="21" y1="0" x2="21" y2="32" stroke={lineBg} strokeWidth="1.2" />
      {/* Top-left diagonal filler */}
      <line x1="4" y1="8" x2="21" y2="16" stroke={lineBg} strokeWidth="0.6" />
      {/* Top-right diagonal filler */}
      <line x1="38" y1="8" x2="21" y2="16" stroke={lineBg} strokeWidth="0.6" />
      {/* Bottom-left diagonal filler */}
      <line x1="4" y1="24" x2="21" y2="16" stroke={lineBg} strokeWidth="0.6" />
      {/* Bottom-right diagonal filler */}
      <line x1="38" y1="24" x2="21" y2="16" stroke={lineBg} strokeWidth="0.6" />
      {/* Subtle shine */}
      <rect x="2" y="2" width="38" height="14" rx="5" ry="5" fill="rgba(255,255,255,0.08)" />
    </svg>
  )
}

// ─── Contactless Icon ───────────────────────────────────────────────────────

function ContactlessIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12C2 6.5 6.5 2 12 2" className="bankcard-contactless-wave" style={{ animationDelay: '0s' }} />
      <path d="M6 12C6 8.7 8.7 6 12 6" className="bankcard-contactless-wave" style={{ animationDelay: '0.3s' }} />
      <path d="M10 12C10 10.9 10.9 10 12 10" className="bankcard-contactless-wave" style={{ animationDelay: '0.6s' }} />
    </svg>
  )
}

// ─── Sparkle Dot (for Diamond card) ────────────────────────────────────────

function SparkleDot({ x, y, size, delay, duration }: {
  x: string; y: string; size: number; delay: string; duration: string
}) {
  return (
    <div
      className="bankcard-sparkle absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(0,212,255,0) 70%)',
        '--sparkle-delay': delay,
        '--sparkle-duration': duration,
      } as React.CSSProperties}
    />
  )
}

// ─── Main BankCard Component ────────────────────────────────────────────────

export function BankCard({
  membershipLevel,
  username,
  lastFourDigits,
  expiryMonth,
  expiryYear,
  className = '',
}: BankCardProps) {
  const config = CARD_CONFIGS[membershipLevel] || CARD_CONFIGS.copper

  // Generate stable random last 4 digits if not provided
  const cardLastFour = useMemo(() => {
    if (lastFourDigits) return lastFourDigits
    // Deterministic from username for consistency
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) - hash) + username.charCodeAt(i)
      hash |= 0
    }
    return String(Math.abs(hash) % 10000).padStart(4, '0')
  }, [username, lastFourDigits])

  // Default expiry: 3 years from now, December
  const expiry = useMemo(() => {
    const now = new Date()
    const m = expiryMonth ?? 12
    const y = expiryYear ?? now.getFullYear() + 3
    return `${String(m).padStart(2, '0')}/${String(y).slice(2)}`
  }, [expiryMonth, expiryYear])

  return (
    <div className={`bankcard-container w-full max-w-[420px] ${className}`}>
      <div
        className={`
          bankcard-inner ${config.cardClass}
          relative overflow-hidden rounded-2xl
          w-full
          text-white
          select-none
          cursor-default
        `}
        style={{
          aspectRatio: '1.586 / 1',
          background: config.gradient,
          boxShadow: config.defaultShadow,
        }}
      >
        {/* ── Subtle Pattern Layer ── */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: config.subtlePattern }}
        />

        {/* ── Overlay Effects ── */}
        {config.overlayEffect === 'holographic' && (
          <div className="bankcard-holographic-overlay" />
        )}
        {config.overlayEffect === 'gold-shimmer' && (
          <div className="bankcard-gold-shimmer-overlay" />
        )}

        {/* ── Diamond Sparkle Dots ── */}
        {config.sparkleDots && (
          <div className="absolute inset-0 pointer-events-none z-[3]">
            <SparkleDot x="15%" y="20%" size={4} delay="0s" duration="3s" />
            <SparkleDot x="75%" y="15%" size={3} delay="1s" duration="2.5s" />
            <SparkleDot x="85%" y="45%" size={5} delay="0.5s" duration="4s" />
            <SparkleDot x="40%" y="70%" size={3} delay="2s" duration="3.5s" />
            <SparkleDot x="60%" y="35%" size={4} delay="1.5s" duration="3s" />
            <SparkleDot x="25%" y="55%" size={3} delay="2.5s" duration="2.8s" />
            <SparkleDot x="90%" y="75%" size={4} delay="0.8s" duration="3.2s" />
            <SparkleDot x="10%" y="80%" size={3} delay="1.8s" duration="3.5s" />
          </div>
        )}

        {/* ── Top Edge Highlight ── */}
        <div
          className="absolute top-0 left-0 right-0 h-px z-[3] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
        />

        {/* ── Card Content ── */}
        <div className="relative z-[4] flex flex-col justify-between h-full p-5 sm:p-6">

          {/* Top Row: Bank Logo + Membership Badge */}
          <div className="flex items-start justify-between">
            {/* Bank Logo */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{
                  background: membershipLevel === 'diamond'
                    ? 'rgba(0, 212, 255, 0.15)'
                    : membershipLevel === 'blackgold'
                    ? 'rgba(255, 215, 0, 0.12)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: `1px solid ${membershipLevel === 'diamond' ? 'rgba(0, 212, 255, 0.25)' : membershipLevel === 'blackgold' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
                }}
              >
                <Gem className="w-4 h-4" style={{ color: config.accentColor }} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider opacity-90" style={{ color: config.accentColor }}>
                  翡翠银行
                </span>
                <span className="text-[9px] tracking-widest opacity-50 font-medium">
                  EMERALD BANK
                </span>
              </div>
            </div>

            {/* Membership Badge */}
            <div
              className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider"
              style={{
                background: config.badgeBg,
                border: `1px solid ${config.badgeBorder}`,
                color: config.badgeText,
              }}
            >
              {config.tierLabelEn}
            </div>
          </div>

          {/* Middle Row: Chip + Contactless */}
          <div className="flex items-center gap-3 mt-1">
            <ChipIcon
              gradient={config.chipGradient}
              borderColor={config.chipBorderColor}
              lineBg={config.chipLineBg}
            />
            <ContactlessIcon color={config.accentColor} />
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2 mt-1">
            {/* Card Number */}
            <div
              className="bankcard-number text-base sm:text-lg font-mono font-medium tracking-widest"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              <span className="opacity-50">••••</span>
              <span className="mx-2 sm:mx-3 opacity-30">·</span>
              <span className="opacity-50">••••</span>
              <span className="mx-2 sm:mx-3 opacity-30">·</span>
              <span className="opacity-50">••••</span>
              <span className="mx-2 sm:mx-3 opacity-30">·</span>
              <span className="opacity-95 font-semibold">{cardLastFour}</span>
            </div>

            {/* Bottom Row: Name + Expiry + DEBIT */}
            <div className="flex items-end justify-between">
              {/* Cardholder Name */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[8px] uppercase tracking-widest opacity-40 font-medium">
                  Card Holder
                </span>
                <span
                  className="text-xs sm:text-sm font-semibold uppercase tracking-wider truncate max-w-[180px]"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  {username || 'CARDHOLDER'}
                </span>
              </div>

              {/* Expiry */}
              <div className="flex flex-col gap-0.5 items-center">
                <span className="text-[8px] uppercase tracking-widest opacity-40 font-medium">
                  Expires
                </span>
                <span
                  className="text-xs sm:text-sm font-semibold tracking-wider"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
                  {expiry}
                </span>
              </div>

              {/* DEBIT Label */}
              <div
                className="text-xs sm:text-sm font-black tracking-[0.2em] opacity-70"
                style={{ color: config.accentColor }}
              >
                DEBIT
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Edge Highlight ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px z-[3] pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        {/* ── Corner Emboss Effect ── */}
        <div
          className="absolute top-0 right-0 w-24 h-24 pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Previews: All 5 Cards ──────────────────────────────────────────────────

export function BankCardShowcase({ username }: { username: string }) {
  const tiers: BankCardTier[] = ['copper', 'silver', 'gold', 'diamond', 'blackgold']

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {tiers.map((tier) => (
        <div key={tier} className="flex flex-col items-center gap-2 w-full max-w-[420px]">
          <BankCard
            membershipLevel={tier}
            username={username}
          />
        </div>
      ))}
    </div>
  )
}

export default BankCard
