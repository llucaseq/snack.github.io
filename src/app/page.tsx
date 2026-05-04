'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Crown, CalendarCheck, ShoppingBag, Search, Wallet, Code2,
  ArrowLeft, Star, Shield, Gem, Coins, Check, Lock,
  Plus, Minus, ChevronRight, Sparkles, User, Gift,
  Clock, MapPin, Mail, Phone, FileText, X, Eye, EyeOff,
  Package, CreditCard, Truck, AlertCircle, Copy, Trash2,
  Download, Users, ClipboardList, LogOut, Palette, Wand2,
  MousePointer, Settings, Info, Moon, Sun, ShoppingCart,
  Tag, Filter, MessageCircle, Send, Cloud, CircleCheck, UserPlus
} from 'lucide-react'
import { BankCard, type BankCardTier } from '@/components/bank-card/BankCard'

import { useAppStore, type EffectKey, type EffectColor, type CartItem } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  brand: string
  isActive?: boolean
}

interface Order {
  id: string
  orderNumber: string
  productId: string
  productName: string
  quantity: number
  totalPrice: number
  paymentMethod: string
  deliveryMethod: string
  deliveryDetail?: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes?: string
  status: string
  promoCode?: string
  createdAt: string
}

interface MyOrderItem {
  id: string
  orderNumber: string
  userId: string
  productId: string
  quantity: number
  totalPrice: number
  status: string
  paymentMethod: string
  deliveryMethod: string
  classGroup?: string | null
  studentNumber?: number | null
  pickupDate?: string | null
  pickupTime?: string | null
  promoCode?: string | null
  discount: number
  realName: string
  email: string
  phone: string
  notes?: string | null
  createdAt: string
  product?: { name: string; price: number }
  user?: { username: string; membershipLevel: string }
}

interface CheckInRecord {
  id: string
  day: number
  pointsEarned: number
  isPurchased: boolean
  createdAt: string
}

interface PromoCode {
  id: string
  code: string
  name: string
  discountPercent: number
  maxUsage: number
  usedCount: number
}

interface VirtualWalletCode {
  id: string
  code: string
  amount: number
  isUsed: boolean
  usedBy?: string
}

interface CouponItem {
  id: string
  code: string
  name: string
  description?: string | null
  discountPercent: number
  minPurchase: number
  isActive: boolean
  usedAt?: string | null
  expiresAt?: string | null
  createdAt: string
}

interface DeveloperOrder {
  id: string
  orderNumber: string
  userId: string
  productId: string
  quantity: number
  totalPrice: number
  status: string
  paymentMethod: string
  deliveryMethod: string
  classGroup?: string | null
  studentNumber?: number | null
  pickupDate?: string | null
  pickupTime?: string | null
  promoCode?: string | null
  discount: number
  realName: string
  email: string
  phone: string
  notes?: string | null
  createdAt: string
  product?: { name: string }
  user?: { username: string; membershipLevel: string }
}

// ─── Membership Config ──────────────────────────────────────────────────────

const MEMBERSHIP_TIERS = [
  {
    key: 'copper',
    name: '铜会员',
    nameEn: 'Copper',
    price: 0,
    color: '#B87333',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    icon: Shield,
    benefits: ['基础访问权限', '每日签到', '商品购买'],
  },
  {
    key: 'silver',
    name: '银会员',
    nameEn: 'Silver',
    price: 50,
    color: '#C0C0C0',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-700',
    icon: Coins,
    benefits: ['所有铜会员权益', '签到积分加倍', '预约取货'],
  },
  {
    key: 'gold',
    name: '金会员',
    nameEn: 'Gold',
    price: 150,
    color: '#FFD700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
    icon: Crown,
    benefits: ['所有银会员权益', '星期五88折购物', '专属优惠码', '优先配送'],
  },
  {
    key: 'diamond',
    name: '钻石会员',
    nameEn: 'Diamond',
    price: 300,
    color: '#000000',
    bgColor: 'bg-neutral-950',
    borderColor: 'border-neutral-700',
    textColor: 'text-neutral-100',
    icon: Gem,
    benefits: ['所有金会员权益', '每周两次88折购物', '一对一急送', '专属客服', '独家商品'],
  },
  {
    key: 'blackgold',
    name: '黑金会员',
    nameEn: 'Black Gold',
    price: 500,
    color: '#1a1a2e',
    bgColor: 'bg-neutral-950',
    borderColor: 'border-amber-600',
    textColor: 'text-amber-300',
    icon: Sparkles,
    benefits: ['所有钻石会员权益', '每周四次88折购物', '一对一急送', '专属客服', '独家商品', '高峰期免等待进网页', '每星期4天购物1元1积分', '黑金独家优惠券', '黑金感谢礼（消费满100送5.2折券）'],
  },
]

const TIER_ORDER = ['copper', 'silver', 'gold', 'diamond', 'blackgold']

// ─── Product Categories & Brands ───────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  '零食', '饮料', '文具', '玩具', '电子产品', '生活用品', '图书', '服饰', '运动', '其他',
]

const PRODUCT_BRANDS = [
  '可口可乐', '百事', '乐事', '康师傅', '三只松鼠', '良品铺子',
  '晨光', '得力', '小米', '华为', '苹果', '三星', '索尼',
  '优衣库', '耐克', '阿迪达斯', '李宁', '安踏',
  '无品牌', '自有品牌', '其他',
]

// ─── Status Helpers ─────────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  PAID: { label: '已付款', color: 'bg-emerald-100 text-emerald-700' },
  DELIVERING: { label: '配送中', color: 'bg-sky-100 text-sky-700' },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-700' },
}

// ─── Effect Colors ─────────────────────────────────────────────────────────

const EFFECT_COLORS: EffectColor[] = [
  { name: '翡翠绿', value: '#10b981', glow: '#34d399' },
  { name: '天空蓝', value: '#0ea5e9', glow: '#38bdf8' },
  { name: '玫瑰红', value: '#f43f5e', glow: '#fb7185' },
  { name: '琥珀橙', value: '#f59e0b', glow: '#fbbf24' },
  { name: '紫罗兰', value: '#8b5cf6', glow: '#a78bfa' },
  { name: '青色', value: '#06b6d4', glow: '#22d3ee' },
  { name: '粉色', value: '#ec4899', glow: '#f472b6' },
  { name: '石灰绿', value: '#84cc16', glow: '#a3e635' },
  { name: '红色', value: '#ef4444', glow: '#f87171' },
  { name: '靛蓝', value: '#6366f1', glow: '#818cf8' },
  { name: '白色', value: '#ffffff', glow: '#e2e8f0' },
  { name: '金色', value: '#eab308', glow: '#facc15' },
]

// ─── Auth Dialog (Login/Register) ───────────────────────────────────────────

function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  // Email verification for registration
  const [email, setEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailCodeCountdown, setEmailCodeCountdown] = useState(0)
  const [emailCodeLoading, setEmailCodeLoading] = useState(false)
  const [devCode, setDevCode] = useState('')
  // Email verification for old users
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyCodeSent, setVerifyCodeSent] = useState(false)
  const [verifyCodeCountdown, setVerifyCodeCountdown] = useState(0)
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false)
  const [verifyDevCode, setVerifyDevCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [pendingUserId, setPendingUserId] = useState('')
  const [pendingUsername, setPendingUsername] = useState('')
  const { setUserId, setUsername: setStoreUsername, setCurrentView, refreshUser, setIsDeveloper, setIsPrimaryDeveloper, setIsDeveloperManager } = useAppStore()

  // Countdown timer for registration email code
  useEffect(() => {
    if (emailCodeCountdown <= 0) return
    const timer = setTimeout(() => setEmailCodeCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [emailCodeCountdown])

  // Countdown timer for verify email code
  useEffect(() => {
    if (verifyCodeCountdown <= 0) return
    const timer = setTimeout(() => setVerifyCodeCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [verifyCodeCountdown])

  const handleSendEmailCode = async () => {
    if (!email.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    setEmailCodeLoading(true)
    try {
      const res = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setEmailCodeSent(true)
        setEmailCodeCountdown(60)
        if (data.devCode) setDevCode(data.devCode)
        toast.success('验证码已发送，请查收邮箱')
      } else {
        const err = await res.json()
        toast.error(err.error || '发送验证码失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setEmailCodeLoading(false)
    }
  }

  const handleSendVerifyCode = async () => {
    if (!verifyEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(verifyEmail.trim())) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    setVerifyCodeLoading(true)
    try {
      const res = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setVerifyCodeSent(true)
        setVerifyCodeCountdown(60)
        if (data.devCode) setVerifyDevCode(data.devCode)
        toast.success('验证码已发送，请查收邮箱')
      } else {
        const err = await res.json()
        toast.error(err.error || '发送验证码失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setVerifyCodeLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verifyEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    if (!verifyCode.trim()) {
      toast.error('请输入验证码')
      return
    }
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUserId, email: verifyEmail.trim(), code: verifyCode.trim() }),
      })
      if (res.ok) {
        setUserId(pendingUserId)
        setStoreUsername(pendingUsername)
        localStorage.setItem('userId', pendingUserId)
        await refreshUser()
        toast.success('邮箱验证成功！')
        setShowEmailVerification(false)
        setVerifyEmail('')
        setVerifyCode('')
        setVerifyCodeSent(false)
        setVerifyDevCode('')
        onClose()
        setCurrentView('home')
      } else {
        const err = await res.json()
        toast.error(err.error || '验证失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setVerifyLoading(false)
    }
  }

  const resetForm = () => {
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setInviteCode('')
    setShowPwd(false)
    setEmail('')
    setEmailCode('')
    setEmailCodeSent(false)
    setEmailCodeCountdown(0)
    setEmailCodeLoading(false)
    setDevCode('')
  }

  const handleLogin = async () => {
    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!password) {
      toast.error('请输入密码')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: username.trim(), password }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.needsEmailVerification && !data.isDeveloper) {
          setPendingUserId(data.id)
          setPendingUsername(data.username)
          setIsDeveloper(data.isDeveloper ?? false)
          setIsPrimaryDeveloper(data.isPrimaryDeveloper ?? false)
          setIsDeveloperManager(data.isDeveloperManager ?? false)
          setShowEmailVerification(true)
          toast.info('请先验证邮箱')
        } else {
          setUserId(data.id)
          setStoreUsername(data.username)
          localStorage.setItem('userId', data.id)
          setIsDeveloper(data.isDeveloper ?? false)
          setIsPrimaryDeveloper(data.isPrimaryDeveloper ?? false)
          setIsDeveloperManager(data.isDeveloperManager ?? false)
          await refreshUser()
          toast.success('登录成功！')
          resetForm()
          onClose()
          setCurrentView('home')
        }
      } else {
        const err = await res.json()
        toast.error(err.error || '登录失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!password) {
      toast.error('请输入密码')
      return
    }
    if (password.length < 4) {
      toast.error('密码至少需要4个字符')
      return
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (!email.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    if (!emailCode.trim()) {
      toast.error('请输入邮箱验证码')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username: username.trim(), password, inviteCode: inviteCode.trim() || undefined, email: email.trim(), emailCode: emailCode.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setUserId(data.id)
        setStoreUsername(data.username)
        localStorage.setItem('userId', data.id)
        await refreshUser()
        toast.success('注册成功！欢迎加入！')
        resetForm()
        onClose()
        setCurrentView('home')
      } else {
        const err = await res.json()
        toast.error(err.error || '注册失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-6 pt-6 pb-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white drop-shadow-sm">会员商城</DialogTitle>
          </div>
          <DialogDescription className="text-emerald-100 text-sm relative z-10">
            {tab === 'login' ? '登录你的账户继续使用' : '创建新账户开始体验'}
          </DialogDescription>
        </div>

        {/* Tabs */}
        <div className="px-6 -mt-5 relative z-20">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-1 flex gap-1">
            <button
              onClick={() => { setTab('login'); resetForm() }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setTab('register'); resetForm() }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              注册
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-5 pb-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-username" className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" /> 用户名
            </Label>
            <Input
              id="auth-username"
              placeholder="输入你的用户名..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())}
              maxLength={20}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="text-sm font-medium flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" /> 密码
            </Label>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPwd ? 'text' : 'password'}
                placeholder="输入密码..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (tab === 'login' ? handleLogin() : handleRegister())}
                className="h-11 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-9 w-9"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </Button>
            </div>
          </div>
          {tab === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="auth-confirm" className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-400" /> 确认密码
              </Label>
              <Input
                id="auth-confirm"
                type={showPwd ? 'text' : 'password'}
                placeholder="再次输入密码..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                className="h-11"
              />
            </motion.div>
          )}
          {/* Email - only show on register */}
          {tab === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="auth-email" className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> 邮箱
              </Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="输入你的邮箱地址..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </motion.div>
          )}
          {/* Email Code - only show on register */}
          {tab === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="auth-email-code" className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-400" /> 邮箱验证码
                {devCode && <span className="text-xs text-amber-600 font-mono ml-1">(开发验证码: {devCode})</span>}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="auth-email-code"
                  placeholder="输入验证码..."
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  className="h-11 flex-1"
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-3 shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  disabled={emailCodeLoading || emailCodeCountdown > 0}
                  onClick={handleSendEmailCode}
                >
                  {emailCodeLoading ? '发送中...' : emailCodeCountdown > 0 ? `${emailCodeCountdown}s` : '发送验证码'}
                </Button>
              </div>
            </motion.div>
          )}
          {/* Invite Code - only show on register */}
          {tab === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="auth-invite" className="text-sm font-medium flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-slate-400" /> 邀请码 <span className="text-xs text-muted-foreground font-normal">(选填)</span>
              </Label>
              <Input
                id="auth-invite"
                placeholder="输入好友的邀请码..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                className="h-11 font-mono uppercase"
                maxLength={8}
              />
            </motion.div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button
            onClick={tab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-base font-medium shadow-md shadow-emerald-500/25 btn-hover-lift"
          >
            {loading
              ? (tab === 'login' ? '登录中...' : '注册中...')
              : (tab === 'login' ? '登录' : '注册')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Email Verification Dialog for old users */}
    <Dialog open={showEmailVerification} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-6 pt-6 pb-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white drop-shadow-sm">邮箱验证</DialogTitle>
          </div>
          <DialogDescription className="text-amber-100 text-sm relative z-10">
            请验证你的邮箱地址以继续使用
          </DialogDescription>
        </div>

        <div className="px-6 pt-5 pb-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verify-email" className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> 邮箱
            </Label>
            <Input
              id="verify-email"
              type="email"
              placeholder="输入你的邮箱地址..."
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verify-code" className="text-sm font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" /> 验证码
              {verifyDevCode && <span className="text-xs text-amber-600 font-mono ml-1">(开发验证码: {verifyDevCode})</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id="verify-code"
                placeholder="输入验证码..."
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="h-11 flex-1"
                maxLength={6}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 px-3 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
                disabled={verifyCodeLoading || verifyCodeCountdown > 0}
                onClick={handleSendVerifyCode}
              >
                {verifyCodeLoading ? '发送中...' : verifyCodeCountdown > 0 ? `${verifyCodeCountdown}s` : '发送验证码'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button
            onClick={handleVerifyEmail}
            disabled={verifyLoading}
            className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-base font-medium shadow-md shadow-amber-500/25"
          >
            {verifyLoading ? '验证中...' : '验证邮箱'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

// ─── Header ─────────────────────────────────────────────────────────────────

function AppHeader() {
  const { userId, username, membershipLevel, walletBalance, points, currentView, setCurrentView, setShowAuthDialog, getCartCount, isBanned } = useAppStore()
  const currentTier = MEMBERSHIP_TIERS.find(t => t.key === membershipLevel) || MEMBERSHIP_TIERS[0]
  const cartCount = getCartCount()

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-emerald-100/60 shadow-[0_1px_20px_rgba(16,185,129,0.08)]">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentView !== 'home' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentView('home')}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Gem className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text-emerald">会员商城</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!userId && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setShowAuthDialog(true)}
              >
                <User className="h-3 w-3" /> 登录
              </Button>
            )}
            {/* Cart Button */}
            {userId && !isBanned && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 relative"
                onClick={() => setCurrentView('cart')}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Button>
            )}
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5"
              style={{
                borderColor: membershipLevel === 'blackgold' ? '#FFD700' : currentTier.color,
                color: membershipLevel === 'blackgold' ? '#FFD700' : membershipLevel === 'diamond' ? '#FFD700' : currentTier.color,
              }}
            >
              {(() => { const Icon = currentTier.icon; return <Icon className="h-3 w-3" /> })()}
              {currentTier.name}
            </Badge>
            {/* Wallet - compact on mobile, full on desktop */}
            <div className="flex items-center gap-1 text-sm bg-amber-50 px-2 py-0.5 rounded-full">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-semibold text-amber-700 hidden sm:inline">{walletBalance.toFixed(2)}</span>
              <span className="font-semibold text-amber-700 sm:hidden text-xs">{walletBalance.toFixed(0)}</span>
            </div>
            {/* Points - compact on mobile, full on desktop */}
            <div className="flex items-center gap-1 text-sm bg-emerald-50 px-2 py-0.5 rounded-full">
              <Star className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-semibold text-emerald-700 hidden sm:inline">{points}</span>
              <span className="font-semibold text-emerald-700 sm:hidden text-xs">{points}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ─── Chat Panel ─────────────────────────────────────────────────────────────

function ChatPanel() {
  const { userId, chatFriendId, chatFriendName, setCurrentView, setChatFriend } = useAppStore()
  const [messages, setMessages] = useState<{ id: string; senderId: string; content: string; createdAt: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!userId || !chatFriendId) return
    try {
      const res = await fetch(`/api/messages?userId=${userId}&friendId=${chatFriendId}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch {
      // silent
    }
  }, [userId, chatFriendId])

  useEffect(() => {
    if (!userId || !chatFriendId) return
    setLoading(true)
    fetchMessages().finally(() => setLoading(false))
  }, [userId, chatFriendId, fetchMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!userId || !chatFriendId) return
    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)
    return () => clearInterval(interval)
  }, [userId, chatFriendId, fetchMessages])

  const sendMessage = async () => {
    if (!input.trim() || sending || !userId || !chatFriendId) return
    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId: chatFriendId, content }),
      })
      if (res.ok) {
        await fetchMessages()
      } else {
        const err = await res.json()
        toast.error(err.error || '发送失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    if (isToday) return time
    return `${d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${time}`
  }

  // Show empty state if no friend selected
  if (!chatFriendId) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setCurrentView('home')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-500" />
            消息
          </h2>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-teal-400" />
            </div>
            <p className="font-medium text-slate-600 mb-1">请先选择好友开始聊天</p>
            <p className="text-xs text-muted-foreground mb-4">在好友列表中选择一个好友，点击聊天按钮</p>
            <Button
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
              onClick={() => setCurrentView('friends')}
            >
              <Users className="h-4 w-4 mr-1" /> 前往好友列表
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => {
            setChatFriend('', '')
            setCurrentView('friends')
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-teal-500" />
          {chatFriendName || '聊天'}
        </h2>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 px-5 py-4 text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold">
              {(chatFriendName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold">{chatFriendName}</p>
              <p className="text-xs text-teal-100">在线 · 与好友聊天中</p>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Messages Area */}
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <div
              className="h-[400px] overflow-y-auto p-4 space-y-3"
              ref={scrollRef}
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-teal-400" />
                  </div>
                  <p className="font-medium text-sm mb-1">开始聊天吧！</p>
                  <p className="text-xs max-w-xs">发送第一条消息给 {chatFriendName}</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isSent = msg.senderId === userId
                return (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isSent ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                          isSent
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-muted-foreground mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-3 flex gap-2 bg-slate-50">
            <Input
              placeholder="输入消息..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="flex-1 h-10"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="h-10 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Friends Panel ───────────────────────────────────────────────────────────

function FriendsPanel() {
  const { userId, setCurrentView, setChatFriend, isBanned } = useAppStore()
  const [friends, setFriends] = useState<{ id: string; username: string; membershipLevel: string; friendshipId: string; createdAt: string }[]>([])
  const [pendingReceived, setPendingReceived] = useState<{ id: string; username: string; membershipLevel: string; friendshipId: string; createdAt: string }[]>([])
  const [pendingSent, setPendingSent] = useState<{ id: string; username: string; membershipLevel: string; friendshipId: string; createdAt: string }[]>([])
  const [addUsername, setAddUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchFriends = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/friends?userId=${userId}&t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setFriends(data.friends || [])
        setPendingReceived(data.pendingReceived || [])
        setPendingSent(data.pendingSent || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const handleAddFriend = async () => {
    if (!addUsername.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (isBanned) {
      toast.error('账号已被封禁，无法使用任何功能')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId, targetUsername: addUsername.trim() }),
      })
      if (res.ok) {
        toast.success('好友请求已发送')
        setAddUsername('')
        await fetchFriends()
      } else {
        const err = await res.json()
        toast.error(err.error || '添加好友失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setAdding(false)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    if (isBanned) {
      toast.error('账号已被封禁，无法使用任何功能')
      return
    }
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', userId, friendshipId }),
      })
      if (res.ok) {
        toast.success('已接受好友请求')
        await fetchFriends()
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    }
  }

  const handleReject = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', userId, friendshipId }),
      })
      if (res.ok) {
        toast.success('已拒绝好友请求')
        await fetchFriends()
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    }
  }

  const handleRemove = async (friendshipId: string) => {
    if (isBanned) {
      toast.error('账号已被封禁，无法使用任何功能')
      return
    }
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId, friendshipId }),
      })
      if (res.ok) {
        toast.success('已删除好友')
        await fetchFriends()
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    }
  }

  const handleStartChat = (friendId: string, friendName: string) => {
    if (isBanned) {
      toast.error('账号已被封禁，无法使用任何功能')
      return
    }
    setChatFriend(friendId, friendName)
    setCurrentView('chat')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users className="h-5 w-5 text-indigo-500" />
        好友
      </h2>

      {/* Add Friend */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-4 text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold">添加好友</p>
              <p className="text-xs text-indigo-100">输入用户名发送好友请求</p>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入用户名..."
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              className="flex-1 h-10"
              maxLength={20}
              disabled={adding || isBanned}
            />
            <Button
              onClick={handleAddFriend}
              disabled={adding || !addUsername.trim() || isBanned}
              className="h-10 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-md"
            >
              {adding ? '...' : '添加'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Received Requests */}
      {pendingReceived.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              待处理请求
              <Badge className="bg-amber-100 text-amber-700 text-xs">{pendingReceived.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl hover:bg-amber-100/70 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-700">
                        {req.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{req.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => handleAccept(req.friendshipId)}
                        disabled={isBanned}
                      >
                        <Check className="h-3 w-3 mr-1" /> 接受
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(req.friendshipId)}
                      >
                        <X className="h-3 w-3 mr-1" /> 拒绝
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Pending Sent Requests */}
      {pendingSent.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-sky-500" />
              已发送请求
              <Badge className="bg-sky-100 text-sky-700 text-xs">{pendingSent.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {pendingSent.map((req) => (
                  <div key={req.id} className="flex items-center gap-2 p-3 bg-sky-50 rounded-xl hover:bg-sky-100/70 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-sky-200 flex items-center justify-center text-sm font-bold text-sky-700">
                      {req.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium flex-1">{req.username}</span>
                    <Badge variant="outline" className="text-xs text-muted-foreground">等待中</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            好友列表
            {friends.length > 0 && (
              <Badge className="bg-indigo-100 text-indigo-700 text-xs">{friends.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"
              />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-indigo-300" />
              </div>
              <p className="text-sm">还没有好友</p>
              <p className="text-xs mt-1">快去添加好友吧！</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {friends.map((friend) => {
                  const friendTier = MEMBERSHIP_TIERS.find(t => t.key === friend.membershipLevel) || MEMBERSHIP_TIERS[0]
                  return (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{friend.username}</span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 leading-tight"
                            style={{ borderColor: friendTier.color, color: friendTier.color }}
                          >
                            {friendTier.name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-sm"
                        onClick={() => handleStartChat(friend.id, friend.username)}
                        disabled={isBanned}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" /> 聊天
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-500 hover:bg-red-50"
                            disabled={isBanned}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> 删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除好友</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除好友 {friend.username} 吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(friend.friendshipId)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Home Grid ──────────────────────────────────────────────────────────────

function HomeGrid() {
  const { userId, setCurrentView, username, membershipLevel, isDeveloper, isPrimaryDeveloper, isDeveloperManager, setIsDeveloper, refreshUser, isBanned } = useAppStore()
  const currentTier = MEMBERSHIP_TIERS.find(t => t.key === membershipLevel) || MEMBERSHIP_TIERS[0]
  const TierIcon = currentTier.icon
  const [devPassword, setDevPassword] = useState('')
  const [devVerifying, setDevVerifying] = useState(false)

  const gridItems = [
    { key: 'membership', label: '会员中心', icon: Crown, color: 'from-amber-400 to-orange-500', desc: '管理你的会员等级' },
    { key: 'checkin', label: '每日签到', icon: CalendarCheck, color: 'from-emerald-400 to-teal-500', desc: '签到赚积分' },
    { key: 'shop', label: '商品购买', icon: ShoppingBag, color: 'from-rose-400 to-pink-500', desc: '浏览并购买商品' },
    { key: 'cart', label: '购物车', icon: ShoppingCart, color: 'from-orange-400 to-red-500', desc: '查看购物车商品' },
    { key: 'myorders', label: '我的订单', icon: ClipboardList, color: 'from-teal-400 to-emerald-500', desc: '查看购买记录' },
    { key: 'tracking', label: '单号查询', icon: Search, color: 'from-sky-400 to-cyan-500', desc: '查询订单状态' },
    { key: 'wallet', label: '虚拟钱包', icon: Wallet, color: 'from-violet-400 to-purple-500', desc: '充值与兑换' },
    { key: 'coupons', label: '优惠券', icon: Gift, color: 'from-amber-400 to-yellow-500', desc: '积分兑换与专属优惠券' },
    { key: 'invite', label: '邀请好友', icon: Users, color: 'from-pink-400 to-rose-500', desc: '邀请好友赢奖励' },
    { key: 'friends', label: '好友', icon: Users, color: 'from-indigo-400 to-violet-500', desc: '添加好友与管理' },
    { key: 'chat', label: '消息', icon: MessageCircle, color: 'from-teal-400 to-cyan-500', desc: '与好友聊天' },
    { key: 'aiservice', label: 'AI客服', icon: MessageCircle, color: 'from-cyan-400 to-blue-500', desc: '智能客服在线答疑' },
    { key: 'settings', label: '设置', icon: Settings, color: 'from-fuchsia-400 to-pink-500', desc: '特效、主题与账号设置' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* User Profile Card */}
      <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white border-0 shadow-xl shadow-emerald-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <CardContent className="p-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30 shadow-lg shadow-black/10">
              {(username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate drop-shadow-sm">你好，{username || '用户'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border border-white/25 text-xs gap-1 shadow-sm">
                  <TierIcon className="h-3 w-3" />
                  {currentTier.name}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {gridItems.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <Card
              className="cursor-pointer border-0 shadow-md hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden rounded-2xl group"
              onClick={() => {
                if (isBanned) {
                  toast.error('账号已被封禁，无法使用任何功能')
                  return
                }
                setCurrentView(item.key)
              }}
            >
              <CardContent className="p-3 space-y-2 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                  <item.icon className="h-5 w-5 text-white drop-shadow-sm" />
                </div>
                <div className="relative z-10">
                  <p className="font-semibold text-sm group-hover:text-emerald-700 transition-colors duration-200">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Developer Entry ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <Card className="relative overflow-hidden border-slate-200 bg-gradient-to-br from-slate-50 to-neutral-100 group/dev">
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover/dev:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 2px rgba(100,116,139,0.3), 0 0 15px rgba(100,116,139,0.15)' }} />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-slate-600" />
              进入开发者
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(isDeveloper || isPrimaryDeveloper || isDeveloperManager) ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">开发者面板</p>
                    <p className="text-xs text-muted-foreground">
                      {isPrimaryDeveloper ? '主开发者 · 完全访问' : isDeveloperManager ? '开发管理者 · 用户管理' : '开发者 · 可授权'}
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-slate-700 hover:bg-slate-800 text-xs"
                  onClick={() => setCurrentView('developer')}
                >
                  <Code2 className="h-3.5 w-3.5 mr-1" /> 进入面板
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 flex items-center justify-center group-hover/dev:scale-110 transition-transform duration-300">
                    <Lock className="h-5 w-5 text-slate-500 group-hover/dev:animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">输入开发者密码</p>
                    <p className="text-xs text-muted-foreground">验证后可进入开发者面板</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="输入开发者密码..."
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && devPassword.trim() && userId) {
                        ;(async () => {
                          setDevVerifying(true)
                          try {
                            const res = await fetch('/api/developer', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'verify-dev-password', userId, password: devPassword.trim() }),
                            })
                            const data = await res.json()
                            if (data.success) {
                              setIsDeveloper(true)
                              await refreshUser()
                              toast.success(data.message || '密码验证成功！', { duration: 3000 })
                              setDevPassword('')
                              setCurrentView('developer')
                            } else {
                              toast.error(data.error || '密码错误')
                            }
                          } catch {
                            toast.error('网络错误')
                          } finally {
                            setDevVerifying(false)
                          }
                        })()
                      }
                    }}
                    className="h-9 text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    className="h-9 bg-slate-700 hover:bg-slate-800 text-xs"
                    disabled={!devPassword.trim() || devVerifying || !userId}
                    onClick={async () => {
                      if (!devPassword.trim() || !userId) return
                      setDevVerifying(true)
                      try {
                        const res = await fetch('/api/developer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'verify-dev-password', userId, password: devPassword.trim() }),
                        })
                        const data = await res.json()
                        if (data.success) {
                          setIsDeveloper(true)
                          await refreshUser()
                          toast.success(data.message || '密码验证成功！', { duration: 3000 })
                          setDevPassword('')
                          setCurrentView('developer')
                        } else {
                          toast.error(data.error || '密码错误')
                        }
                      } catch {
                        toast.error('网络错误')
                      } finally {
                        setDevVerifying(false)
                      }
                    }}
                  >
                    {devVerifying ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      '验证'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── My Orders ──────────────────────────────────────────────────────────────

function MyOrders() {
  const { userId } = useAppStore()
  const [orders, setOrders] = useState<MyOrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(Array.isArray(data) ? data : [])
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [userId])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-teal-500" />
          我的订单
        </h2>
        {[1, 2, 3].map(i => (
          <Card key={i} className="shimmer-loading">
            <CardContent className="p-5">
              <div className="shimmer-line mb-3" style={{ width: '35%' }} />
              <div className="shimmer-line-medium mb-2" />
              <div className="shimmer-line-short" />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-teal-500" />
          我的订单
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Package className="h-3 w-3" /> {orders.length} 个订单
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无订单记录</p>
            <p className="text-xs mt-1">购买商品后，订单将显示在这里</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {orders.map((order, i) => {
              const statusInfo = ORDER_STATUS_MAP[order.status]
              const delivLabel =
                order.deliveryMethod === 'FIXED' || order.deliveryMethod === 'fixed' ? '楼梯间取货' :
                order.deliveryMethod === 'SCHEDULED' || order.deliveryMethod === 'scheduled' ? '预约取货' :
                '一对一急送'
              const payLabel = order.paymentMethod === 'ONLINE' || order.paymentMethod === 'online' ? '线上支付' : '线下支付'
              const productName = order.product?.name || '未知商品'

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow rounded-xl">
                    <CardContent className="p-5">
                      {/* Order header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-slate-600">{order.orderNumber}</span>
                          {statusInfo && <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                      </div>

                      {/* Product info */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">商品: </span>
                          <span className="font-medium">{productName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">数量: </span>
                          <span className="font-medium">{order.quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">总价: </span>
                          <span className="font-bold text-emerald-600">¥{order.totalPrice.toFixed(2)}</span>
                          {order.discount > 0 && (
                            <span className="text-xs text-amber-600 ml-1">(-¥{order.discount.toFixed(2)})</span>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">支付: </span>
                          <span className="font-medium">{payLabel}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">配送: </span>
                          <span className="font-medium">{delivLabel}</span>
                        </div>
                        {order.promoCode && (
                          <div>
                            <span className="text-muted-foreground">优惠码: </span>
                            <span className="font-mono text-xs font-medium">{order.promoCode}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.realName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {order.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.phone}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  )
}

// ─── Membership Center ──────────────────────────────────────────────────────

function MembershipCenter() {
  const { membershipLevel, walletBalance, points, userId, setMembershipLevel, refreshUser } = useAppStore()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const currentTierIndex = TIER_ORDER.indexOf(membershipLevel)

  const handleUpgrade = async (tierKey: string) => {
    const tier = MEMBERSHIP_TIERS.find(t => t.key === tierKey)
    if (!tier || !userId) return
    if (walletBalance < tier.price) {
      toast.error('钱包余额不足，请先充值')
      return
    }
    setUpgrading(tierKey)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipLevel: tierKey, deductAmount: tier.price }),
      })
      if (res.ok) {
        setMembershipLevel(tierKey)
        // Refresh user data to get accurate wallet balance
        await refreshUser()
        // Double-check wallet balance with a short delay
        setTimeout(() => refreshUser(), 500)
        toast.success(`升级为${tier.name}成功！`)
      } else {
        const err = await res.json()
        toast.error(err.error || '升级失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setUpgrading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          会员中心
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" /> {points} 积分
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Wallet className="h-3 w-3" /> ¥{walletBalance.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {MEMBERSHIP_TIERS.map((tier, i) => {
          const isCurrent = tier.key === membershipLevel
          const isAbove = TIER_ORDER.indexOf(tier.key) <= currentTierIndex
          const Icon = tier.icon
          const isDiamond = tier.key === 'diamond'
          const isBlackgold = tier.key === 'blackgold'
          const isDark = isDiamond || isBlackgold

          return (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden transition-all duration-300 rounded-2xl ${
                  isCurrent
                    ? `ring-2 ${isBlackgold ? 'ring-yellow-400/70' : isDiamond ? 'ring-amber-400/60' : 'ring-emerald-500/60'} shadow-lg ${isBlackgold ? 'shadow-yellow-500/15' : isDiamond ? 'shadow-amber-500/10' : 'shadow-emerald-500/10'}`
                    : 'hover:shadow-md'
                } ${isBlackgold ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-[#1a1a2e] text-amber-100 border-amber-700/60' : isDiamond ? 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 text-neutral-100 border-neutral-700' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3">
                    <Badge className={`gap-1 ${isBlackgold ? 'bg-yellow-400 text-black' : isDiamond ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'}`}>
                      <Check className="h-3 w-3" /> 当前
                    </Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isBlackgold ? 'bg-yellow-500/20' : isDiamond ? 'bg-amber-500/20' : 'bg-white'
                      }`}
                      style={!isDark ? { boxShadow: `0 0 0 2px ${tier.color}30` } : {}}
                    >
                      {isBlackgold ? (
                        <Sparkles className="h-6 w-6 text-yellow-400" />
                      ) : isDiamond ? (
                        <Sparkles className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Icon className="h-6 w-6" style={{ color: tier.color }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold text-lg ${isBlackgold ? 'text-yellow-300' : isDiamond ? 'text-amber-300' : ''}`}>
                          {tier.name}
                        </h3>
                        <span className={`text-sm ${isBlackgold ? 'text-amber-400/70' : isDiamond ? 'text-neutral-400' : 'text-muted-foreground'}`}>
                          {tier.nameEn}
                        </span>
                      </div>
                      <p className={`text-sm mb-3 ${isDark ? 'text-neutral-400' : 'text-muted-foreground'}`}>
                        {tier.price === 0 ? '免费' : `¥${tier.price}`}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.benefits.map((b) => (
                          <Badge
                            key={b}
                            variant="secondary"
                            className={`text-xs ${
                              isBlackgold
                                ? 'bg-amber-900/50 text-amber-200 border-amber-700/50'
                                : isDiamond
                                ? 'bg-neutral-800 text-neutral-300 border-neutral-600'
                                : ''
                            }`}
                          >
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {!isAbove && (
                    <div className="mt-4 pt-4 border-t border-dashed">
                      <Button
                        className={`w-full ${
                          isBlackgold
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold shadow-sm shadow-yellow-500/25'
                            : isDiamond
                            ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 text-white'
                        }`}
                        onClick={() => handleUpgrade(tier.key)}
                        disabled={upgrading === tier.key}
                      >
                        {upgrading === tier.key ? '升级中...' : `升级 - ¥${tier.price}`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Daily Check-in ─────────────────────────────────────────────────────────

function DailyCheckIn() {
  const { userId, checkInStreak, isNewUser, newUserDaysLeft, points, setCheckInStreak, setPoints, setIsNewUser, setNewUserDaysLeft, refreshUser, isBanned, isFrozen } = useAppStore()
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/checkin?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setCheckInHistory(Array.isArray(data) ? data : data.records || [])
      }
    } catch {
      // silent
    }
  }, [userId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const dayRewards = [
    { day: 1, points: 1, label: '1积分' },
    { day: 2, points: 3, label: '3积分' },
    { day: 3, points: 5, label: '5积分' },
    { day: 4, points: 5, label: '购买后获得5积分' },
    { day: 5, points: 5, label: '购买后获得5积分' },
    { day: 6, points: 5, label: '购买后获得5积分' },
    { day: 7, points: 5, label: '购买后获得5积分' },
  ]

  const checkedDays = checkInHistory.map(r => r.day)
  const currentDay = checkInStreak + 1

  const handleCheckIn = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCheckInStreak(data.streak ?? checkInStreak + 1)
        setPoints(data.totalPoints ?? points + (data.pointsEarned || 0))
        if (data.isNewUser !== undefined) setIsNewUser(data.isNewUser)
        if (data.newUserDaysLeft !== undefined) setNewUserDaysLeft(data.newUserDaysLeft)
        // Refresh full user data (wallet may change for purchase check-in)
        await refreshUser()
        toast.success(`签到成功！获得 ${data.pointsEarned || 0} 积分`)
        loadHistory()
      } else {
        const err = await res.json()
        toast.error(err.error || '签到失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchaseCheckIn = async () => {
    if (!userId) return
    if (isBanned) {
      toast.error('账号已被封禁，无法购买')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法购买')
      return
    }
    setPurchaseLoading(true)
    try {
      const res = await fetch('/api/checkin/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCheckInStreak(data.streak ?? checkInStreak + 1)
        setPoints(data.totalPoints ?? points + 5)
        // Refresh user data (wallet balance deducted for purchase check-in)
        await refreshUser()
        toast.success('购买签到成功！获得 5 积分')
        loadHistory()
      } else {
        const err = await res.json()
        toast.error(err.error || '购买签到失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const hasCheckedToday = checkedDays.includes(currentDay) || currentDay > 7

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-emerald-500" />
          每日签到
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Flame className="h-3 w-3 text-orange-500" /> 连续 {checkInStreak} 天
        </Badge>
      </div>

      {isNewUser && newUserDaysLeft > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-white text-xs">新手专享</Badge>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                1元 = 1积分，还剩 {newUserDaysLeft} 天
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-day calendar */}
      <div className="grid grid-cols-7 gap-2">
        {dayRewards.map((d) => {
          const isChecked = checkedDays.includes(d.day)
          const isCurrentDay = d.day === currentDay
          const needsPurchase = d.day >= 4

          return (
            <motion.div
              key={d.day}
              whileHover={{ scale: 1.08 }}
              className={`relative rounded-2xl p-2 text-center transition-all duration-200 border-2 ${
                isChecked
                  ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-400 shadow-sm shadow-emerald-200/50'
                  : isCurrentDay
                  ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-amber-300 shadow-sm shadow-amber-200/50'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="text-[10px] text-muted-foreground mb-1 font-medium">Day {d.day}</div>
              <div className={`text-sm font-bold ${isChecked ? 'text-emerald-600' : ''}`}>
                {isChecked ? <Check className="h-5 w-5 mx-auto text-emerald-500" /> : needsPurchase ? (
                  <span className="text-xs text-amber-600">购买</span>
                ) : (
                  <span>{d.points}</span>
                )}
              </div>
              {isCurrentDay && !isChecked && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 badge-pulse" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">签到进度</span>
          <span className="font-medium">{Math.min(checkInStreak, 7)}/7 天</span>
        </div>
        <Progress value={(Math.min(checkInStreak, 7) / 7) * 100} className="h-2" />
      </div>

      {/* Check-in button */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20"
          onClick={handleCheckIn}
          disabled={loading || hasCheckedToday}
        >
          {loading ? '签到中...' : hasCheckedToday ? '今日已签到 ✓' : '签到'}
        </Button>
        {currentDay >= 4 && !hasCheckedToday && (
          <Button
            variant="outline"
            className="h-12 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handlePurchaseCheckIn}
            disabled={purchaseLoading}
          >
            {purchaseLoading ? '购买中...' : '购买签到 (2元)'}
          </Button>
        )}
      </div>

      {/* History */}
      {checkInHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">签到记录</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {checkInHistory.slice().reverse().map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Day {record.day}
                      </Badge>
                      <span className="text-muted-foreground">
                        {record.isPurchased ? '购买签到' : '免费签到'}
                      </span>
                    </div>
                    <span className="text-emerald-600 font-medium">+{record.pointsEarned} 积分</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// ─── Product Shop ───────────────────────────────────────────────────────────

function ProductShop() {
  const { userId, membershipLevel, walletBalance, refreshUser, addToCart, isBanned, isFrozen } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [deliveryMethod, setDeliveryMethod] = useState('fixed')
  const [classGroup, setClassGroup] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [pickupDay, setPickupDay] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null)
  const [userCoupons, setUserCoupons] = useState<CouponItem[]>([])
  const [selectedCouponId, setSelectedCouponId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedBrand, setSelectedBrand] = useState('全部')
  const [addedToCart, setAddedToCart] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ t: String(Date.now()) })
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategory && selectedCategory !== '全部') params.set('category', selectedCategory)
      if (selectedBrand && selectedBrand !== '全部') params.set('brand', selectedBrand)
      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : data.products || [])
      } else {
        toast.error('获取商品失败')
      }
    } catch {
      toast.error('网络错误，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedBrand])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Refetch when window regains focus
  useEffect(() => {
    const handleFocus = () => fetchProducts()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchProducts])

  // Fetch user coupons when purchase dialog opens
  useEffect(() => {
    if (purchaseDialogOpen && userId) {
      fetch(`/api/coupons?userId=${userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const coupons = Array.isArray(data) ? data : data.coupons || []
          setUserCoupons(coupons.filter((c: CouponItem) => c.isActive && !c.usedAt))
        })
        .catch(() => {})
    }
  }, [purchaseDialogOpen, userId])

  const openPurchaseDialog = (product: Product) => {
    if (isBanned) {
      toast.error('账号已被封禁，无法购买')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法购买')
      return
    }
    setSelectedProduct(product)
    setQuantity(1)
    setPaymentMethod('online')
    setDeliveryMethod('fixed')
    setClassGroup('')
    setStudentNumber('')
    setPickupDay('')
    setPickupTime('')
    setPromoCode('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setNotes('')
    setOrderConfirmation(null)
    setSelectedCouponId('')
    setPurchaseDialogOpen(true)
  }

  const handleAddToCart = (product: Product) => {
    if (isBanned) {
      toast.error('账号已被封禁，无法购买')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法购买')
      return
    }
    addToCart({
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productStock: product.stock,
      productCategory: product.category || '其他',
      productBrand: product.brand || '其他',
    })
    setAddedToCart(product.id)
    toast.success(`已加入购物车: ${product.name}`)
    setTimeout(() => setAddedToCart(null), 1500)
  }

  const handleSubmitOrder = async () => {
    if (!userId || !selectedProduct) return
    if (isBanned) {
      toast.error('账号已被封禁，无法购买')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法购买')
      return
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      toast.error('请填写联系信息')
      return
    }
    if (deliveryMethod === 'one-to-one') {
      if (!classGroup || !studentNumber) {
        toast.error('请选择班级和学号')
        return
      }
    }
    if (deliveryMethod === 'scheduled') {
      if (!pickupDay || !pickupTime) {
        toast.error('请选择取货时间和时段')
        return
      }
    }

    const deliveryDetail: Record<string, string> = {}
    if (deliveryMethod === 'one-to-one') {
      deliveryDetail.classGroup = classGroup
      deliveryDetail.studentNumber = studentNumber
    } else if (deliveryMethod === 'scheduled') {
      deliveryDetail.pickupDay = pickupDay
      deliveryDetail.pickupTime = pickupTime
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: selectedProduct.id,
          quantity,
          paymentMethod,
          deliveryMethod,
          deliveryDetail,
          promoCode: promoCode || undefined,
          couponId: selectedCouponId || undefined,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          notes: notes.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOrderConfirmation(data.orderNumber)
        // Immediately update wallet & points from API response to avoid stale display
        if (data.newWalletBalance !== undefined) {
          useAppStore.getState().setWalletBalance(data.newWalletBalance)
        }
        if (data.newPoints !== undefined) {
          useAppStore.getState().setPoints(data.newPoints)
        }
        // Refresh user data to sync all state
        await refreshUser()
        // Double-check wallet balance with a short delay
        setTimeout(() => refreshUser(), 500)
        fetchProducts()
        if (data.discount > 0) {
          toast.success(`订单创建成功！优惠 ¥${data.discount.toFixed(2)}${data.discountSource ? `（${data.discountSource}）` : ''}，获得 ${data.pointsEarned} 积分`)
        } else {
          toast.success(data.message || '订单创建成功！')
        }
      } else {
        const err = await res.json()
        toast.error(err.error || '创建订单失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = selectedProduct ? selectedProduct.price * quantity : 0

  const classGroups = ['4A', '4B', '4C', '4D', '5A', '5B', '5C', '5D', '6A', '6B', '6C', '6D']
  const timeSlots = ['9:10 - 10:50', '11:30 - 11:40']

  // Get available categories & brands from current products
  const availableCategories = ['全部', ...Array.from(new Set(products.map(p => p.category || '其他')))]
  const availableBrands = ['全部', ...Array.from(new Set(products.map(p => p.brand || '其他')))]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-rose-500" />
          商品购买
        </h2>
        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="text-xs gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          刷新
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Category & Brand Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">分类:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground shrink-0">品牌:</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {availableBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedBrand === brand
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Membership Discount Info */}
      {(membershipLevel === 'gold' || membershipLevel === 'diamond' || membershipLevel === 'blackgold') && (
        <Card className={`border-dashed ${membershipLevel === 'blackgold' ? 'bg-yellow-50 border-yellow-400' : membershipLevel === 'diamond' ? 'bg-amber-50 border-amber-300' : 'bg-amber-50/50 border-amber-200'}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${membershipLevel === 'blackgold' ? 'bg-yellow-500' : membershipLevel === 'diamond' ? 'bg-amber-500' : 'bg-amber-400'}`}>
              <Gift className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {membershipLevel === 'blackgold' ? '🖤 黑金会员88折' : membershipLevel === 'diamond' ? '💎 钻石会员88折' : '👑 金会员星期五88折'}
              </p>
              <p className="text-xs text-amber-600">
                {membershipLevel === 'blackgold'
                  ? '每周可享4次88折优惠，自动应用'
                  : membershipLevel === 'diamond'
                  ? '每周可享2次88折优惠，自动应用'
                  : '每星期五购物自动享88折优惠'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shimmer-loading">
              <CardContent className="p-5">
                <div className="shimmer-line mb-3" style={{ width: '35%' }} />
                <div className="shimmer-line-medium mb-2" />
                <div className="shimmer-line-short" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-10 text-center text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">{searchQuery || selectedCategory !== '全部' || selectedBrand !== '全部' ? '没有找到匹配的商品' : '暂无商品'}</p>
            <p className="text-xs mt-1">{searchQuery || selectedCategory !== '全部' || selectedBrand !== '全部' ? '请尝试其他搜索条件' : '敬请期待新商品上架'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300 border-slate-100 group rounded-xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold group-hover:text-emerald-700 transition-colors duration-200">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {product.category && product.category !== '其他' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-200 text-sky-600">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />{product.category}
                          </Badge>
                        )}
                        {product.brand && product.brand !== '其他' && product.brand !== '无品牌' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-600">
                            {product.brand}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-lg font-bold text-emerald-600">¥{product.price}</p>
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={`text-xs font-medium ${product.stock <= 0 ? 'text-red-500' : product.stock <= 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {product.stock <= 0 ? '缺货' : `剩 ${product.stock} 件`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 btn-hover-lift"
                        onClick={() => openPurchaseDialog(product)}
                        disabled={product.stock <= 0}
                        size="sm"
                      >
                        {product.stock <= 0 ? '缺货' : '购买'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs gap-1 ${addedToCart === product.id ? 'border-emerald-400 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-600'}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="h-3 w-3" />
                        {addedToCart === product.id ? '已加入' : '加入购物车'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {orderConfirmation ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold">订单创建成功！</h3>
              {(membershipLevel === 'gold' || membershipLevel === 'diamond' || membershipLevel === 'blackgold') && (
                <p className="text-sm text-amber-600 font-medium">
                  🎉 已自动享受88折会员优惠
                </p>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">订单号</p>
                <p className="text-lg font-mono font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-lg">{orderConfirmation}</p>
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 mt-2"
                onClick={() => {
                  setPurchaseDialogOpen(false)
                  setOrderConfirmation(null)
                }}
              >
                完成
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>购买商品</DialogTitle>
                <DialogDescription>请填写以下信息完成购买</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Product Info */}
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{selectedProduct?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedProduct?.description}</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">¥{selectedProduct?.price}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Label className="text-sm">数量</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(selectedProduct?.stock ?? 999, quantity + 1))}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">(库存: {selectedProduct?.stock ?? 0} 件)</span>
                      <span className="ml-auto text-sm font-medium">合计: <span className="text-emerald-600 text-base">¥{totalPrice.toFixed(2)}</span></span>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> 支付方式
                  </Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="pay-online" />
                      <Label htmlFor="pay-online" className="cursor-pointer">线上支付（从钱包扣除）</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="offline" id="pay-offline" />
                      <Label htmlFor="pay-offline" className="cursor-pointer">线下支付（货到付款）</Label>
                    </div>
                  </RadioGroup>
                  {paymentMethod === 'online' && (
                    <p className="text-xs text-muted-foreground">当前钱包余额: ¥{walletBalance.toFixed(2)}</p>
                  )}
                </div>

                <Separator />

                {/* Delivery Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Truck className="h-4 w-4" /> 配送方式
                  </Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="del-fixed" />
                      <Label htmlFor="del-fixed" className="cursor-pointer">固定配送 - 楼梯间取货</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="del-scheduled" />
                      <Label htmlFor="del-scheduled" className="cursor-pointer">预约取货</Label>
                    </div>
                    <div className="flex items-center space-x-2 relative">
                      <RadioGroupItem value="one-to-one" id="del-oto" disabled={membershipLevel !== 'diamond' && membershipLevel !== 'blackgold'} />
                      <Label htmlFor="del-oto" className={`cursor-pointer flex items-center gap-1 ${membershipLevel !== 'diamond' && membershipLevel !== 'blackgold' ? 'text-muted-foreground' : ''}`}>
                        一对一急送
                        {membershipLevel !== 'diamond' && membershipLevel !== 'blackgold' && (
                          <Lock className="h-3 w-3 text-amber-500" />
                        )}
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryMethod === 'one-to-one' && (membershipLevel === 'diamond' || membershipLevel === 'blackgold') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pl-4 border-l-2 border-amber-300"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm">班级</Label>
                        <Select value={classGroup} onValueChange={setClassGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择班级" />
                          </SelectTrigger>
                          <SelectContent>
                            {classGroups.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">学号</Label>
                        <Select value={studentNumber} onValueChange={setStudentNumber}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择学号" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {deliveryMethod === 'scheduled' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pl-4 border-l-2 border-emerald-300"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm">取货日期</Label>
                        <Input
                          type="date"
                          value={pickupDay}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val) {
                              const d = new Date(val + 'T00:00:00')
                              const day = d.getDay()
                              if (day === 0 || day === 6) {
                                toast.error('不支持选择周末，请选择星期一至星期五')
                                setPickupDay('')
                              } else {
                                setPickupDay(val)
                              }
                            } else {
                              setPickupDay('')
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground">仅支持选择工作日（周一至周五）</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">时间段</Label>
                        <Select value={pickupTime} onValueChange={setPickupTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择时间段" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </div>

                <Separator />

                {/* Promo Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Gift className="h-4 w-4" /> 优惠码
                  </Label>
                  <Input
                    placeholder="输入优惠码（可选）"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>

                {/* Coupon Selector */}
                {userCoupons.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Gift className="h-4 w-4" /> 优惠券
                    </Label>
                    <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择优惠券（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不使用优惠券</SelectItem>
                        {userCoupons.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} - {c.discountPercent}%OFF{c.minPurchase > 0 ? ` (满¥${c.minPurchase})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCouponId && selectedCouponId !== 'none' && (() => {
                      const coupon = userCoupons.find(c => c.id === selectedCouponId)
                      return coupon ? (
                        <p className="text-xs text-emerald-600 font-medium">
                          🎫 {coupon.name}: {coupon.description || `${coupon.discountPercent}% 折扣`}
                          {coupon.minPurchase > 0 && ` (满 ¥${coupon.minPurchase} 可用)`}
                        </p>
                      ) : null
                    })()}
                  </div>
                )}

                <Separator />

                {/* Contact Info */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4" /> 联系信息 <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">真实姓名</Label>
                      <Input
                        placeholder="输入真实姓名"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">联络邮箱</Label>
                      <Input
                        type="email"
                        placeholder="输入邮箱"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">电话</Label>
                      <Input
                        placeholder="输入电话号码"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> 备注
                  </Label>
                  <Textarea
                    placeholder="备注信息（可选）"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 h-11"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : `确认购买 - ¥${totalPrice.toFixed(2)}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Shopping Cart ────────────────────────────────────────────────────────────

function ShoppingCartView() {
  const { userId, membershipLevel, walletBalance, cart, removeFromCart, updateCartQuantity, clearCart, getCartTotal, getCartCount, refreshUser, setCurrentView, isBanned, isFrozen } = useAppStore()
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [deliveryMethod, setDeliveryMethod] = useState('fixed')
  const [classGroup, setClassGroup] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [pickupDay, setPickupDay] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null)
  const [userCoupons, setUserCoupons] = useState<CouponItem[]>([])
  const [selectedCouponId, setSelectedCouponId] = useState<string>('')

  const cartTotal = getCartTotal()
  const cartCount = getCartCount()

  useEffect(() => {
    if (purchaseDialogOpen && userId) {
      fetch(`/api/coupons?userId=${userId}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const coupons = Array.isArray(data) ? data : data.coupons || []
          setUserCoupons(coupons.filter((c: CouponItem) => c.isActive && !c.usedAt))
        })
        .catch(() => {})
    }
  }, [purchaseDialogOpen, userId])

  const openCheckoutDialog = (item: CartItem) => {
    setCheckoutItem(item)
    setQuantity(item.quantity)
    setPaymentMethod('online')
    setDeliveryMethod('fixed')
    setClassGroup('')
    setStudentNumber('')
    setPickupDay('')
    setPickupTime('')
    setPromoCode('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setNotes('')
    setOrderConfirmation(null)
    setSelectedCouponId('')
    setPurchaseDialogOpen(true)
  }

  const handleSubmitOrder = async () => {
    if (!userId || !checkoutItem) return
    if (isBanned) {
      toast.error('账号已被封禁，无法购买')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法购买')
      return
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      toast.error('请填写联系信息')
      return
    }
    if (deliveryMethod === 'one-to-one') {
      if (!classGroup || !studentNumber) {
        toast.error('请选择班级和学号')
        return
      }
    }
    if (deliveryMethod === 'scheduled') {
      if (!pickupDay || !pickupTime) {
        toast.error('请选择取货时间和时段')
        return
      }
    }

    const deliveryDetail: Record<string, string> = {}
    if (deliveryMethod === 'one-to-one') {
      deliveryDetail.classGroup = classGroup
      deliveryDetail.studentNumber = studentNumber
    } else if (deliveryMethod === 'scheduled') {
      deliveryDetail.pickupDay = pickupDay
      deliveryDetail.pickupTime = pickupTime
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: checkoutItem.productId,
          quantity,
          paymentMethod,
          deliveryMethod,
          deliveryDetail,
          promoCode: promoCode || undefined,
          couponId: selectedCouponId || undefined,
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          notes: notes.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOrderConfirmation(data.orderNumber)
        removeFromCart(checkoutItem.productId)
        // Immediately update wallet & points from API response to avoid stale display
        if (data.newWalletBalance !== undefined) {
          useAppStore.getState().setWalletBalance(data.newWalletBalance)
        }
        if (data.newPoints !== undefined) {
          useAppStore.getState().setPoints(data.newPoints)
        }
        await refreshUser()
        setTimeout(() => refreshUser(), 500)
        if (data.discount > 0) {
          toast.success(`订单创建成功！优惠 ¥${data.discount.toFixed(2)}，获得 ${data.pointsEarned} 积分`)
        } else {
          toast.success(data.message || '订单创建成功！')
        }
      } else {
        const err = await res.json()
        toast.error(err.error || '创建订单失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = checkoutItem ? checkoutItem.productPrice * quantity : 0

  const classGroups = ['4A', '4B', '4C', '4D', '5A', '5B', '5C', '5D', '6A', '6B', '6C', '6D']
  const timeSlots = ['9:10 - 10:50', '11:30 - 11:40']

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-orange-500" />
          购物车
        </h2>
        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <ShoppingCart className="h-3 w-3" /> {cartCount} 件商品
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={clearCart}
            >
              <Trash2 className="h-3 w-3 mr-1" /> 清空
            </Button>
          </div>
        )}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">购物车总计</p>
                <p className="text-3xl font-bold mt-1 drop-shadow-sm">¥{cartTotal.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm">{cartCount} 件商品</p>
                <p className="text-orange-100 text-xs mt-1">钱包余额: ¥{walletBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {cart.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-10 text-center text-muted-foreground">
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-orange-300" />
            </div>
            <p className="font-medium text-slate-500">购物车是空的</p>
            <p className="text-xs mt-1">去商品页面添加你喜欢的商品吧</p>
            <Button
              variant="outline"
              className="mt-4 border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={() => setCurrentView('shop')}
            >
              <ShoppingBag className="h-4 w-4 mr-1" /> 去购物
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cart.map((item, i) => (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-300 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm">{item.productName}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.productCategory && item.productCategory !== '其他' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-200 text-sky-600">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />{item.productCategory}
                          </Badge>
                        )}
                        {item.productBrand && item.productBrand !== '其他' && item.productBrand !== '无品牌' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-600">
                            {item.productBrand}
                          </Badge>
                        )}
                      </div>
                      <p className="text-base font-bold text-emerald-600 mt-1">¥{item.productPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.productId, Math.min(item.quantity + 1, item.productStock))} disabled={item.quantity >= item.productStock}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          onClick={() => openCheckoutDialog(item)}
                        >
                          结算
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-xs text-muted-foreground">
                    <span>小计: <span className="font-bold text-emerald-600 text-sm">¥{(item.productPrice * item.quantity).toFixed(2)}</span></span>
                    {item.productStock <= 5 && <span className="text-amber-500">库存仅剩 {item.productStock} 件</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {orderConfirmation ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold">订单创建成功！</h3>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">订单号</p>
                <p className="text-lg font-mono font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-lg">{orderConfirmation}</p>
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 mt-2"
                onClick={() => {
                  setPurchaseDialogOpen(false)
                  setOrderConfirmation(null)
                }}
              >
                完成
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>结算商品</DialogTitle>
                <DialogDescription>请填写以下信息完成购买</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Product Info */}
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{checkoutItem?.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {checkoutItem?.productCategory && checkoutItem.productCategory !== '其他' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-200 text-sky-600">
                              {checkoutItem.productCategory}
                            </Badge>
                          )}
                          {checkoutItem?.productBrand && checkoutItem.productBrand !== '其他' && checkoutItem.productBrand !== '无品牌' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-600">
                              {checkoutItem.productBrand}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">¥{checkoutItem?.productPrice}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Label className="text-sm">数量</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(Math.min(checkoutItem?.productStock ?? 999, quantity + 1))}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">(库存: {checkoutItem?.productStock ?? 0} 件)</span>
                      <span className="ml-auto text-sm font-medium">合计: <span className="text-emerald-600 text-base">¥{totalPrice.toFixed(2)}</span></span>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> 支付方式
                  </Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="cart-pay-online" />
                      <Label htmlFor="cart-pay-online" className="cursor-pointer">线上支付（从钱包扣除）</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="offline" id="cart-pay-offline" />
                      <Label htmlFor="cart-pay-offline" className="cursor-pointer">线下支付（货到付款）</Label>
                    </div>
                  </RadioGroup>
                  {paymentMethod === 'online' && (
                    <p className="text-xs text-muted-foreground">当前钱包余额: ¥{walletBalance.toFixed(2)}</p>
                  )}
                </div>

                <Separator />

                {/* Delivery Method */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Truck className="h-4 w-4" /> 配送方式
                  </Label>
                  <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="cart-del-fixed" />
                      <Label htmlFor="cart-del-fixed" className="cursor-pointer">固定配送 - 楼梯间取货</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="scheduled" id="cart-del-scheduled" />
                      <Label htmlFor="cart-del-scheduled" className="cursor-pointer">预约取货</Label>
                    </div>
                    <div className="flex items-center space-x-2 relative">
                      <RadioGroupItem value="one-to-one" id="cart-del-oto" disabled={membershipLevel !== 'diamond' && membershipLevel !== 'blackgold'} />
                      <Label htmlFor="cart-del-oto" className={`cursor-pointer flex items-center gap-1 ${membershipLevel !== 'diamond' && membershipLevel !== 'blackgold' ? 'text-muted-foreground' : ''}`}>
                        一对一急送
                        {membershipLevel !== 'diamond' && membershipLevel !== 'blackgold' && (
                          <Lock className="h-3 w-3 text-amber-500" />
                        )}
                      </Label>
                    </div>
                  </RadioGroup>

                  {deliveryMethod === 'one-to-one' && (membershipLevel === 'diamond' || membershipLevel === 'blackgold') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pl-4 border-l-2 border-amber-300"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm">班级</Label>
                        <Select value={classGroup} onValueChange={setClassGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择班级" />
                          </SelectTrigger>
                          <SelectContent>
                            {classGroups.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">学号</Label>
                        <Select value={studentNumber} onValueChange={setStudentNumber}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择学号" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 35 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {deliveryMethod === 'scheduled' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pl-4 border-l-2 border-emerald-300"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm">取货日期</Label>
                        <Input
                          type="date"
                          value={pickupDay}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val) {
                              const d = new Date(val + 'T00:00:00')
                              const day = d.getDay()
                              if (day === 0 || day === 6) {
                                toast.error('不支持选择周末，请选择星期一至星期五')
                                setPickupDay('')
                              } else {
                                setPickupDay(val)
                              }
                            } else {
                              setPickupDay('')
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-10"
                        />
                        <p className="text-xs text-muted-foreground">仅支持选择工作日（周一至周五）</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">时间段</Label>
                        <Select value={pickupTime} onValueChange={setPickupTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择时间段" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </div>

                <Separator />

                {/* Promo Code */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Gift className="h-4 w-4" /> 优惠码
                  </Label>
                  <Input
                    placeholder="输入优惠码（可选）"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>

                {/* Coupon Selector */}
                {userCoupons.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Gift className="h-4 w-4" /> 优惠券
                    </Label>
                    <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择优惠券（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">不使用优惠券</SelectItem>
                        {userCoupons.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} - {c.discountPercent}%OFF{c.minPurchase > 0 ? ` (满¥${c.minPurchase})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Contact Info */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4" /> 联系信息 <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">真实姓名</Label>
                      <Input placeholder="输入真实姓名" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">联络邮箱</Label>
                      <Input type="email" placeholder="输入邮箱" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">电话</Label>
                      <Input placeholder="输入电话号码" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> 备注
                  </Label>
                  <Textarea placeholder="备注信息（可选）" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 h-11"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : `确认购买 - ¥${totalPrice.toFixed(2)}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Order Tracking ─────────────────────────────────────────────────────────

function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      toast.error('请输入订单号')
      return
    }
    setSearching(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/orders?orderNumber=${orderNumber.trim()}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      } else {
        setOrder(null)
        toast.error('订单未找到')
      }
    } catch {
      toast.error('网络错误')
      setOrder(null)
    } finally {
      setSearching(false)
    }
  }

  const statusInfo = order ? ORDER_STATUS_MAP[order.status] : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Search className="h-5 w-5 text-sky-500" />
        单号查询
      </h2>

      <div className="flex gap-2">
        <Input
          placeholder="输入订单号..."
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={searching} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20">
          {searching ? '查询中...' : '查询'}
        </Button>
      </div>

      {searched && !order && !searching && (
        <Card className="bg-slate-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">未找到该订单</p>
          </CardContent>
        </Card>
      )}

      {order && statusInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">订单详情</CardTitle>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
              <CardDescription className="font-mono">{order.orderNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">商品</p>
                  <p className="font-medium">{order.productName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">数量</p>
                  <p className="font-medium">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">总价</p>
                  <p className="font-medium text-emerald-600">¥{order.totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">支付方式</p>
                  <p className="font-medium">{order.paymentMethod === 'online' ? '线上支付' : '线下支付'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">配送方式</p>
                  <p className="font-medium">
                    {order.deliveryMethod === 'fixed' ? '楼梯间取货' :
                     order.deliveryMethod === 'scheduled' ? '预约取货' : '一对一急送'}
                  </p>
                </div>
                {order.deliveryDetail && (
                  <div>
                    <p className="text-muted-foreground">配送详情</p>
                    <p className="font-medium">{order.deliveryDetail}</p>
                  </div>
                )}
                {order.promoCode && (
                  <div>
                    <p className="text-muted-foreground">优惠码</p>
                    <p className="font-medium">{order.promoCode}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-muted-foreground">联系信息</p>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.contactName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{order.contactPhone}</span>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span>{order.notes}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                创建时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Virtual Wallet ─────────────────────────────────────────────────────────

function VirtualWallet() {
  const { userId, username, walletBalance, membershipLevel, points, refreshUser, isBanned, isFrozen } = useAppStore()
  const [walletCode, setWalletCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showBalance, setShowBalance] = useState(false)

  const handleRedeem = async () => {
    if (!walletCode.trim()) {
      toast.error('请输入兑换码')
      return
    }
    if (!userId) {
      toast.error('请先登录')
      return
    }
    if (isBanned) {
      toast.error('账号已被封禁，无法兑换')
      return
    }
    if (isFrozen) {
      toast.error('账号已被冻结，无法兑换')
      return
    }
    setRedeeming(true)
    setMessage(null)
    try {
      const res = await fetch('/api/virtual-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: walletCode.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        await refreshUser()
        setMessage({ type: 'success', text: `兑换成功！充值 ¥${data.amount || 0}` })
        toast.success(`充值成功！¥${data.amount || 0}`)
        setWalletCode('')
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || '兑换失败' })
        toast.error(err.error || '兑换失败')
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
      toast.error('网络错误')
    } finally {
      setRedeeming(false)
    }
  }

  const cardTier = (membershipLevel || 'copper') as BankCardTier

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-violet-500" />
          虚拟钱包
        </h2>
      </div>

      {/* Bank Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateY: -10 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <BankCard membershipLevel={cardTier} username={username || '用户'} />
      </motion.div>

      {/* Balance & Points Info */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs text-muted-foreground">余额</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {showBalance ? `¥${walletBalance.toFixed(2)}` : '¥••••'}
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs text-muted-foreground">积分</span>
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-2">
              {showBalance ? points : '••••'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Redeem */}
      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="font-medium">兑换码充值</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入兑换码..."
                value={walletCode}
                onChange={(e) => setWalletCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                className="flex-1 font-mono"
              />
              <Button onClick={handleRedeem} disabled={redeeming} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20 btn-hover-lift">
                {redeeming ? '兑换中...' : '兑换'}
              </Button>
            </div>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Coupons Panel ─────────────────────────────────────────────────────────

function CouponsPanel() {
  const { userId, membershipLevel, points, refreshUser } = useAppStore()
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exchanging, setExchanging] = useState<string | null>(null)

  const fetchCoupons = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/coupons?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setCoupons(Array.isArray(data) ? data : data.coupons || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const isBlackgold = membershipLevel === 'blackgold'
  const isGoldOrAbove = ['gold', 'diamond', 'blackgold'].includes(membershipLevel)

  const exchangeTiers = isBlackgold
    ? [
        { key: 'tier1', points: 399, value: 60, label: '¥60 钱包余额' },
        { key: 'tier2', points: 799, value: 144, label: '¥144 钱包余额' },
        { key: 'tier3', points: 1199, value: 237, label: '¥237 钱包余额' },
      ]
    : [
        { key: 'tier1', points: 399, value: 50, label: '¥50 钱包余额' },
        { key: 'tier2', points: 799, value: 120, label: '¥120 钱包余额' },
        { key: 'tier3', points: 1199, value: 198, label: '¥198 钱包余额' },
      ]

  const handleExchange = async (tierKey: string) => {
    if (!userId) return
    setExchanging(tierKey)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'exchange', exchangeTier: tierKey }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || '兑换成功！')
        await refreshUser()
        fetchCoupons()
      } else {
        const err = await res.json()
        toast.error(err.error || '兑换失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setExchanging(null)
    }
  }

  const activeCoupons = coupons.filter(c => c.isActive && !c.usedAt)
  const usedCoupons = coupons.filter(c => !c.isActive || c.usedAt)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          优惠券
        </h2>
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3" /> {points} 积分
        </Badge>
      </div>

      {/* My Coupons */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-500" /> 我的优惠券
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="shimmer-loading h-20 rounded-lg" />
              ))}
            </div>
          ) : activeCoupons.length === 0 && usedCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无优惠券</p>
              <p className="text-xs mt-1">通过积分兑换获取优惠券与钱包余额</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {activeCoupons.map((coupon, i) => (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card className="border-emerald-200 bg-emerald-50/50 rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{coupon.name}</p>
                              <Badge className="bg-emerald-500 text-white text-xs">可用</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{coupon.description || `${coupon.discountPercent}% OFF`}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              {coupon.minPurchase > 0 && <span>满 ¥{coupon.minPurchase} 可用</span>}
                              {coupon.expiresAt && <span>到期: {new Date(coupon.expiresAt).toLocaleDateString('zh-CN')}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-emerald-600">{coupon.discountPercent}%</p>
                            <p className="text-[10px] text-muted-foreground">OFF</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                {usedCoupons.map((coupon) => (
                  <Card key={coupon.id} className="border-slate-200 bg-slate-50/50 opacity-60 rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-muted-foreground">{coupon.name}</p>
                            <Badge variant="secondary" className="text-xs">{coupon.usedAt ? '已使用' : '已过期'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{coupon.description || `${coupon.discountPercent}% OFF`}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Point Exchange */}
      {isGoldOrAbove && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> 积分兑换钱包余额
            </CardTitle>
            <CardDescription className="text-xs">
              使用积分兑换虚拟货币，直接充入钱包，当前 {points} 积分可用
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid gap-3">
              {exchangeTiers.map((tier, i) => {
                const canAfford = points >= tier.points
                return (
                  <motion.div
                    key={tier.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                  >
                    <Card className={`rounded-xl ${canAfford ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 opacity-60'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${canAfford ? 'bg-amber-500' : 'bg-slate-300'}`}>
                              <Coins className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{tier.label}</p>
                              <p className="text-xs text-muted-foreground">{tier.points} 积分</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            disabled={!canAfford || exchanging === tier.key}
                            onClick={() => handleExchange(tier.key)}
                            className={canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-sm'
                              : ''
                            }
                          >
                            {exchanging === tier.key ? '兑换中...' : '兑换'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!isGoldOrAbove && (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="p-8 text-center">
            <Crown className="h-10 w-10 mx-auto text-amber-300 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">升级至金会员即可解锁积分兑换</p>
          </CardContent>
        </Card>
      )}

      {/* Black Gold Exclusive */}
      {isBlackgold && (
        <Card className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-[#1a1a2e] text-amber-100 border-amber-700/60 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-yellow-300">黑金专属权益</p>
                <p className="text-xs text-amber-400/70">Black Gold Exclusive</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-amber-900/30 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-200 mb-1">🖤 黑金感谢礼</p>
                <p className="text-xs text-amber-300/80">消费满100元即送5.2折优惠券，自动发放至您的账户</p>
              </div>
              <div className="bg-amber-900/30 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-200 mb-1">🎫 黑金独家优惠券</p>
                <p className="text-xs text-amber-300/80">专属高额优惠券，仅限黑金会员兑换与使用</p>
              </div>
              <div className="bg-amber-900/30 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-200 mb-1">⚡ 高峰期免等待</p>
                <p className="text-xs text-amber-300/80">高峰期进网页无需等待，尊享优先访问权</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// ─── Developer Portal ───────────────────────────────────────────────────────

function DeveloperPortal() {
  const { userId: currentDevUserId, isDeveloper, isPrimaryDeveloper, isDeveloperManager, setIsDeveloper, setIsDeveloperManager, refreshUser } = useAppStore()
  const [authenticated, setAuthenticated] = useState(isDeveloper || isPrimaryDeveloper || isDeveloperManager)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('subscriptions')

  // Developer data
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [walletCodes, setWalletCodes] = useState<VirtualWalletCode[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Forms
  const [newPromoCode, setNewPromoCode] = useState('')
  const [newPromoName, setNewPromoName] = useState('')
  const [newPromoDiscount, setNewPromoDiscount] = useState(10)
  const [newPromoMaxUsage, setNewPromoMaxUsage] = useState(100)
  const [newWalletAmount, setNewWalletAmount] = useState(10)
  const [newProductName, setNewProductName] = useState('')
  const [newProductDesc, setNewProductDesc] = useState('')
  const [newProductPrice, setNewProductPrice] = useState(0)
  const [newProductStock, setNewProductStock] = useState(10)
  const [newProductCategory, setNewProductCategory] = useState('零食')
  const [newProductBrand, setNewProductBrand] = useState('其他')
  const [stockAdjust, setStockAdjust] = useState<Record<string, number>>({})
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [allOrders, setAllOrders] = useState<DeveloperOrder[]>([])
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrdersEver, setTotalOrdersEver] = useState(0)
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editPoints, setEditPoints] = useState(0)
  const [editWallet, setEditWallet] = useState(0)
  const [editMembershipLevel, setEditMembershipLevel] = useState('')
  const [editUsername, setEditUsername] = useState('')

  // Cloud backup/restore
  const [cloudBackupLoading, setCloudBackupLoading] = useState(false)
  const [cloudRestoreLoading, setCloudRestoreLoading] = useState(false)
  const [cloudBackupInfo, setCloudBackupInfo] = useState<any>(null)
  const [checkingCloud, setCheckingCloud] = useState(false)

  // App Config (SMTP & S3)
  const [appConfig, setAppConfig] = useState<Record<string, any>>({})
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [s3Endpoint, setS3Endpoint] = useState('')
  const [s3Region, setS3Region] = useState('eu-west-3')
  const [s3AccessKey, setS3AccessKey] = useState('')
  const [s3SecretKey, setS3SecretKey] = useState('')
  const [s3Bucket, setS3Bucket] = useState('member-store-backup')

  // High-risk users
  const [highRiskUsers, setHighRiskUsers] = useState<any[]>([])
  const [highRiskLoading, setHighRiskLoading] = useState(false)

  // Developer Manager slots info
  const [managerSlotsUsed, setManagerSlotsUsed] = useState(0)
  const [managerSlotsTotal] = useState(3)

  const loadData = useCallback(async () => {
    try {
      const cacheBuster = `t=${Date.now()}`
      const [subsRes, promoRes, walletRes, prodRes, ordersRes, usersRes] = await Promise.all([
        fetch(`/api/developer?${cacheBuster}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/promo-codes?${cacheBuster}`).then(r => r.json()).catch(() => []),
        fetch(`/api/virtual-wallet?${cacheBuster}`).then(r => r.json()).catch(() => []),
        fetch(`/api/products?all=true&${cacheBuster}`).then(r => r.json()).catch(() => []),
        fetch(`/api/orders?${cacheBuster}`).then(r => r.json()).catch(() => []),
        fetch(`/api/users?${cacheBuster}`).then(r => r.json()).catch(() => []),
      ])
      setSubscriptions(Array.isArray(subsRes.subscriptions) ? subsRes.subscriptions : subsRes.records || [])
      setPromoCodes(Array.isArray(promoRes) ? promoRes : promoRes.codes || [])
      setWalletCodes(Array.isArray(walletRes) ? walletRes : walletRes.codes || [])
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes.products || [])
      const ordersData = Array.isArray(ordersRes) ? ordersRes : []
      setAllOrders(ordersData)
      setAllUsers(Array.isArray(usersRes) ? usersRes : [])
      // Accumulate: only increase total stats, never decrease
      const currentRevenue = ordersData.reduce((sum: number, o: DeveloperOrder) => sum + o.totalPrice, 0)
      setTotalRevenue(prev => Math.max(prev, currentRevenue))
      setTotalOrdersEver(prev => Math.max(prev, ordersData.length))
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (authenticated) loadData()
  }, [authenticated, loadData])

  // Load high-risk users
  const loadHighRiskUsers = useCallback(async () => {
    setHighRiskLoading(true)
    try {
      const res = await fetch(`/api/high-risk?t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        setHighRiskUsers(Array.isArray(data) ? data : data.users || [])
      }
    } catch {
      // silent
    } finally {
      setHighRiskLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) loadHighRiskUsers()
  }, [authenticated, loadHighRiskUsers])

  // Load manager slots status when developer portal opens
  useEffect(() => {
    if (!authenticated) return
    const loadManagerStatus = async () => {
      try {
        const res = await fetch('/api/developer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-manager-status' }),
        })
        if (res.ok) {
          const data = await res.json()
          setManagerSlotsUsed(data.slotsUsed)
        }
      } catch {
        // silent
      }
    }
    loadManagerStatus()
  }, [authenticated])

  // Auto-promotion logic: when a non-developer enters dev portal
  useEffect(() => {
    if (!currentDevUserId || authenticated) return
    if (isDeveloper || isPrimaryDeveloper || isDeveloperManager) return

    const tryAutoPromote = async () => {
      try {
        const res = await fetch('/api/developer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'enter-dev-settings', userId: currentDevUserId }),
        })
        const data = await res.json()
        if (res.ok && data.autoPromoted) {
          setIsDeveloper(true)
          setIsDeveloperManager(true)
          setAuthenticated(true)
          toast.success(data.message)
          await refreshUser()
        } else if (data.needsApproval) {
          toast.error(data.error || '需要开发管理者授权', { duration: 4000 })
        }
      } catch {
        // silent - will show password dialog
      }
    }
    tryAutoPromote()
  }, [currentDevUserId, authenticated, isDeveloper, isPrimaryDeveloper, isDeveloperManager, setIsDeveloper, setIsDeveloperManager, refreshUser])

  // Load app config when developer portal opens
  useEffect(() => {
    if (!authenticated) return
    const loadConfig = async () => {
      setConfigLoading(true)
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const data = await res.json()
          const configMap: Record<string, any> = {}
          for (const c of data.configs || []) {
            configMap[c.key] = c
          }
          setAppConfig(configMap)
          // Populate form fields from config
          if (configMap.smtp_host?.value) setSmtpHost(configMap.smtp_host.value)
          if (configMap.smtp_port?.value) setSmtpPort(configMap.smtp_port.value)
          if (configMap.smtp_user?.value) setSmtpUser(configMap.smtp_user.value)
          if (configMap.smtp_from?.value) setSmtpFrom(configMap.smtp_from.value)
          if (configMap.s3_endpoint?.value) setS3Endpoint(configMap.s3_endpoint.value)
          if (configMap.s3_region?.value) setS3Region(configMap.s3_region.value)
          if (configMap.s3_bucket?.value) setS3Bucket(configMap.s3_bucket.value)
        }
      } catch {
        // silent
      } finally {
        setConfigLoading(false)
      }
    }
    loadConfig()
  }, [authenticated])

  const handleSaveConfig = async () => {
    setConfigSaving(true)
    try {
      const configs = [
        { key: 'smtp_host', value: smtpHost },
        { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_user', value: smtpUser },
        { key: 'smtp_pass', value: smtpPass, encrypted: true },
        { key: 'smtp_from', value: smtpFrom },
        { key: 's3_endpoint', value: s3Endpoint },
        { key: 's3_region', value: s3Region },
        { key: 's3_access_key', value: s3AccessKey, encrypted: true },
        { key: 's3_secret_key', value: s3SecretKey, encrypted: true },
        { key: 's3_bucket', value: s3Bucket },
      ].filter(c => c.value && !c.value.includes('****'))

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      })

      if (res.ok) {
        toast.success('配置保存成功！')
        // Reload config
        const configRes = await fetch('/api/config')
        if (configRes.ok) {
          const data = await configRes.json()
          const configMap: Record<string, any> = {}
          for (const c of data.configs || []) {
            configMap[c.key] = c
          }
          setAppConfig(configMap)
        }
      } else {
        toast.error('配置保存失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setConfigSaving(false)
    }
  }

  const handleLogin = async () => {
    if (!password) {
      toast.error('请输入密码')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthenticated(true)
        toast.success('验证成功')
      } else {
        const err = await res.json()
        toast.error(err.error || '密码错误')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setVerifying(false)
    }
  }

  const handleCreatePromoCode = async () => {
    if (!newPromoCode || !newPromoName) {
      toast.error('请填写优惠码信息')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromoCode,
          name: newPromoName,
          discountPercent: newPromoDiscount,
          maxUsage: newPromoMaxUsage,
        }),
      })
      if (res.ok) {
        toast.success('优惠码创建成功')
        setNewPromoCode('')
        setNewPromoName('')
        setNewPromoDiscount(10)
        setNewPromoMaxUsage(100)
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '创建失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateWalletCode = async () => {
    if (newWalletAmount <= 0) {
      toast.error('请输入有效金额')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/virtual-wallet/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newWalletAmount }),
      })
      if (res.ok) {
        toast.success('兑换码创建成功')
        setNewWalletAmount(10)
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '创建失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!newProductName || !newProductDesc || newProductPrice <= 0) {
      toast.error('请填写商品名称、描述和价格')
      return
    }
    if (!newProductCategory) {
      toast.error('请选择商品类型/分类')
      return
    }
    if (!newProductBrand) {
      toast.error('请选择商品品牌')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          description: newProductDesc,
          price: newProductPrice,
          stock: newProductStock,
          category: newProductCategory,
          brand: newProductBrand,
        }),
      })
      if (res.ok) {
        toast.success('商品创建成功')
        setNewProductName('')
        setNewProductDesc('')
        setNewProductPrice(0)
        setNewProductStock(10)
        setNewProductCategory('零食')
        setNewProductBrand('其他')
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '创建失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const handleAdjustStock = async (productId: string, change: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockChange: change }),
      })
      if (res.ok) {
        toast.success(change > 0 ? `库存增加 ${change}` : `库存减少 ${Math.abs(change)}`)
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '操作失败')
      }
    } catch {
      toast.error('网络错误')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProduct(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || '商品已删除')
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '删除失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setDeletingProduct(null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    setDeletingOrder(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('订单已从系统中移除')
        loadData()
      } else {
        const err = await res.json()
        toast.error(err.error || '删除订单失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setDeletingOrder(null)
    }
  }

  // Password state for developer portal entry
  const [portalPassword, setPortalPassword] = useState('')
  const [portalPasswordVerifying, setPortalPasswordVerifying] = useState(false)

  if (!authenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Code2 className="h-5 w-5 text-slate-700" />
          我是开发者
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {(isDeveloper || isPrimaryDeveloper || isDeveloperManager) ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                    <Code2 className="h-6 w-6 text-violet-600" />
                  </div>
                  <p className="font-medium text-sm">您已自动验证为开发者</p>
                  <p className="text-xs text-muted-foreground">
                    {isPrimaryDeveloper ? '主开发者权限 · 完全访问' : isDeveloperManager ? '开发管理者权限 · 用户管理' : '开发者权限 · 只读访问'}
                  </p>
                </div>
                <Button
                  className="w-full bg-slate-800 hover:bg-slate-900"
                  onClick={() => setAuthenticated(true)}
                >
                  进入开发者面板
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center space-y-2 mb-2">
                  <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <Lock className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-muted-foreground text-sm">开发管理者名额已满</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <p className="text-xs text-slate-600">
                    请输入开发者密码以成为开发者，进入后可以为其他用户授权。
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="输入开发者密码..."
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && portalPassword.trim()) {
                          ;(async () => {
                            setPortalPasswordVerifying(true)
                            try {
                              const res = await fetch('/api/developer', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'verify-dev-password', userId: currentDevUserId, password: portalPassword.trim() }),
                              })
                              const data = await res.json()
                              if (data.success) {
                                setIsDeveloper(true)
                                await refreshUser()
                                setAuthenticated(true)
                                toast.success(data.message || '密码验证成功！', { duration: 3000 })
                                setPortalPassword('')
                              } else {
                                toast.error(data.error || '密码错误')
                              }
                            } catch {
                              toast.error('网络错误')
                            } finally {
                              setPortalPasswordVerifying(false)
                            }
                          })()
                        }
                      }}
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      size="sm"
                      className="h-9 bg-slate-700 hover:bg-slate-800 text-xs"
                      disabled={!portalPassword.trim() || portalPasswordVerifying}
                      onClick={async () => {
                        if (!portalPassword.trim() || !currentDevUserId) return
                        setPortalPasswordVerifying(true)
                        try {
                          const res = await fetch('/api/developer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'verify-dev-password', userId: currentDevUserId, password: portalPassword.trim() }),
                          })
                          const data = await res.json()
                          if (data.success) {
                            setIsDeveloper(true)
                            await refreshUser()
                            setAuthenticated(true)
                            toast.success(data.message || '密码验证成功！', { duration: 3000 })
                            setPortalPassword('')
                          } else {
                            toast.error(data.error || '密码错误')
                          }
                        } catch {
                          toast.error('网络错误')
                        } finally {
                          setPortalPasswordVerifying(false)
                        }
                      }}
                    >
                      {portalPasswordVerifying ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        '验证'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
          <Code2 className="h-5 w-5 text-slate-700" />
          开发者面板
          {isPrimaryDeveloper && (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 ml-1">主开发者</Badge>
          )}
          {isDeveloperManager && !isPrimaryDeveloper && (
            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 ml-1">开发管理者</Badge>
          )}
          {isDeveloper && !isDeveloperManager && !isPrimaryDeveloper && (
            <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 ml-1">开发者</Badge>
          )}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setAuthenticated(false)}>
          退出
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        // Restrict tabs for non-manager developers
        const isManager = isPrimaryDeveloper || isDeveloperManager
        const restrictedTabs = ['highrisk', 'backup', 'promo', 'wallet']
        if (!isManager && restrictedTabs.includes(v)) {
          toast.error('需要开发管理者权限')
          return
        }
        setActiveTab(v)
      }}>
        <TabsList className="w-full grid grid-cols-8">
          <TabsTrigger value="subscriptions" className="text-xs">订阅</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">订单</TabsTrigger>
          <TabsTrigger value="promo" className={`text-xs ${!(isPrimaryDeveloper || isDeveloperManager) ? 'opacity-40 cursor-not-allowed' : ''}`}>优惠码</TabsTrigger>
          <TabsTrigger value="wallet" className={`text-xs ${!(isPrimaryDeveloper || isDeveloperManager) ? 'opacity-40 cursor-not-allowed' : ''}`}>钱包</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">商品</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">用户</TabsTrigger>
          <TabsTrigger value="highrisk" className={`text-xs ${!(isPrimaryDeveloper || isDeveloperManager) ? 'opacity-40 cursor-not-allowed' : ''}`}>高危</TabsTrigger>
          <TabsTrigger value="backup" className={`text-xs ${!(isPrimaryDeveloper || isDeveloperManager) ? 'opacity-40 cursor-not-allowed' : ''}`}>数据与版本</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订阅管理</CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">暂无订阅记录</p>
              ) : (
                <ScrollArea className="max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户</TableHead>
                        <TableHead>等级</TableHead>
                        <TableHead>日期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{sub.username || sub.userId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.membershipLevel || sub.level}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('zh-CN') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {/* Revenue Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{totalOrdersEver}</p>
                <p className="text-xs text-emerald-100 mt-1">累计订单</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">¥{totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-amber-100 mt-1">累计收入</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{allOrders.length}</p>
                <p className="text-xs text-sky-100 mt-1">当前订单</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Trash2 className="h-3 w-3" /> 重置累计收入
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认重置累计收入</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将把累计收入和累计订单数重置为0，当前订单数据不受影响。此操作不可撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => {
                      setTotalRevenue(0)
                      setTotalOrdersEver(0)
                      toast.success('累计收入已重置')
                    }}
                  >
                    确认重置
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  订单管理 ({allOrders.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue placeholder="筛选状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">全部</SelectItem>
                      <SelectItem value="PENDING">待处理</SelectItem>
                      <SelectItem value="PAID">已付款</SelectItem>
                      <SelectItem value="DELIVERING">配送中</SelectItem>
                      <SelectItem value="COMPLETED">已完成</SelectItem>
                      <SelectItem value="CANCELLED">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      const filtered = orderStatusFilter === 'ALL'
                        ? allOrders
                        : allOrders.filter(o => o.status === orderStatusFilter)
                      if (filtered.length === 0) {
                        toast.error('没有可导出的订单')
                        return
                      }
                      const escapeCsv = (val: string) => `"${(val ?? '').replace(/"/g, '""')}"`
                      const header = ['订单号','买家用户名','会员等级','商品名称','数量','总价','支付方式','配送方式','真实姓名','邮箱','电话','优惠码','折扣','备注','状态','创建时间'].join(',')
                      const rows = filtered.map(o => [
                        escapeCsv(o.orderNumber),
                        escapeCsv(o.user?.username ?? ''),
                        escapeCsv(o.user?.membershipLevel ?? ''),
                        escapeCsv(o.product?.name ?? ''),
                        String(o.quantity),
                        String(o.totalPrice),
                        escapeCsv(o.paymentMethod === 'ONLINE' || o.paymentMethod === 'online' ? '线上支付' : '线下支付'),
                        escapeCsv(
                          o.deliveryMethod === 'FIXED' || o.deliveryMethod === 'fixed' ? '楼梯间取货' :
                          o.deliveryMethod === 'SCHEDULED' || o.deliveryMethod === 'scheduled' ? '预约取货' :
                          o.deliveryMethod === 'ONE_TO_ONE' || o.deliveryMethod === 'one-to-one' || o.deliveryMethod === 'one_to_one' ? '一对一急送' : o.deliveryMethod
                        ),
                        escapeCsv(o.realName),
                        escapeCsv(o.email),
                        escapeCsv(o.phone),
                        escapeCsv(o.promoCode ?? ''),
                        String(o.discount),
                        escapeCsv(o.notes ?? ''),
                        escapeCsv(ORDER_STATUS_MAP[o.status]?.label ?? o.status),
                        escapeCsv(new Date(o.createdAt).toLocaleString('zh-CN')),
                      ].join(','))
                      const csv = '\uFEFF' + header + '\n' + rows.join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      const today = new Date().toISOString().slice(0, 10)
                      a.download = `订单数据_${today}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                      toast.success(`已导出 ${filtered.length} 条订单`)
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    下载CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">暂无订单记录</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {(orderStatusFilter === 'ALL' ? allOrders : allOrders.filter(o => o.status === orderStatusFilter)).map((order, i) => {
                      const statusInfo = ORDER_STATUS_MAP[order.status]
                      const delivLabel =
                        order.deliveryMethod === 'FIXED' || order.deliveryMethod === 'fixed' ? '楼梯间取货' :
                        order.deliveryMethod === 'SCHEDULED' || order.deliveryMethod === 'scheduled' ? '预约取货' :
                        '一对一急送'
                      const payLabel = order.paymentMethod === 'ONLINE' || order.paymentMethod === 'online' ? '线上支付' : '线下支付'
                      const tierName = (() => {
                        const level = (order.user?.membershipLevel ?? '').toLowerCase()
                        const tier = MEMBERSHIP_TIERS.find(t => t.key === level)
                        return tier ? tier.name : order.user?.membershipLevel ?? ''
                      })()
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                        >
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            {/* Order header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">{order.orderNumber}</span>
                                {statusInfo && <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                              </div>
                              <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                            </div>

                            {/* Buyer info */}
                            <div className="flex items-center gap-2 mb-2 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{order.user?.username ?? '未知'}</span>
                              <Badge variant="outline" className="text-xs">{tierName}</Badge>
                            </div>

                            {/* Product info */}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                              <div>
                                <span className="text-muted-foreground">商品: </span>
                                <span className="font-medium">{order.product?.name ?? '未知'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">数量: </span>
                                <span className="font-medium">{order.quantity}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">总价: </span>
                                <span className="font-medium text-emerald-600">¥{order.totalPrice.toFixed(2)}</span>
                                {order.discount > 0 && (
                                  <span className="text-xs text-amber-600 ml-1">(-¥{order.discount.toFixed(2)})</span>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">支付: </span>
                                <span className="font-medium">{payLabel}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">配送: </span>
                                <span className="font-medium">{delivLabel}</span>
                                {order.classGroup && order.studentNumber && (
                                  <span className="text-xs text-muted-foreground ml-1">({order.classGroup}班 {order.studentNumber}号)</span>
                                )}
                                {order.pickupDate && order.pickupTime && (
                                  <span className="text-xs text-muted-foreground ml-1">({order.pickupDate} {order.pickupTime})</span>
                                )}
                              </div>
                              {order.promoCode && (
                                <div>
                                  <span className="text-muted-foreground">优惠码: </span>
                                  <span className="font-medium font-mono">{order.promoCode}</span>
                                </div>
                              )}
                            </div>

                            {/* Contact info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 pt-2 border-t border-slate-200">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {order.realName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {order.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.phone}
                              </div>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="flex items-start gap-1 mt-2 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{order.notes}</span>
                              </div>
                            )}

                            {/* Status Actions */}
                            {(order.status === 'PAID' || order.status === 'DELIVERING') && (
                              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-200">
                                {order.status === 'PAID' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1 border-sky-300 text-sky-700 hover:bg-sky-50"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/orders/${order.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'DELIVERING' }),
                                        })
                                        if (res.ok) {
                                          toast.success('已标记为配送中')
                                          loadData()
                                        } else {
                                          toast.error('操作失败')
                                        }
                                      } catch {
                                        toast.error('网络错误')
                                      }
                                    }}
                                  >
                                    <Truck className="h-3 w-3" /> 标记配送
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/orders/${order.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'COMPLETED' }),
                                      })
                                      if (res.ok) {
                                        toast.success('已确认收货')
                                        loadData()
                                      } else {
                                        toast.error('操作失败')
                                      }
                                    } catch {
                                      toast.error('网络错误')
                                    }
                                  }}
                                >
                                  <Check className="h-3 w-3" /> 确认收货
                                </Button>
                              </div>
                            )}

                            {/* Delete Order Button */}
                            <div className="flex justify-end mt-2 pt-2 border-t border-slate-200">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={deletingOrder === order.id}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {deletingOrder === order.id ? '删除中...' : '移除订单'}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认移除订单</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      此操作将永久删除订单 {order.orderNumber}，删除后该订单将从系统中彻底移除且无法恢复。累计收入统计不会受到影响。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-500 hover:bg-red-600 text-white"
                                      onClick={() => handleDeleteOrder(order.id)}
                                    >
                                      确认移除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Codes Tab */}
        <TabsContent value="promo">
          {!(isPrimaryDeveloper || isDeveloperManager) ? (
            <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">需要开发管理者权限</p></CardContent></Card>
          ) : (
          <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">创建优惠码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">优惠码</Label>
                  <Input
                    placeholder="CODE123"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">名称</Label>
                  <Input
                    placeholder="优惠名称"
                    value={newPromoName}
                    onChange={(e) => setNewPromoName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">折扣 %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">最大使用次数</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newPromoMaxUsage}
                    onChange={(e) => setNewPromoMaxUsage(Number(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={handleCreatePromoCode} disabled={creating} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20">
                <Plus className="h-4 w-4 mr-1" /> 创建优惠码
              </Button>
            </CardContent>
          </Card>

          {promoCodes.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">优惠码列表</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {promoCodes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-mono font-medium text-sm">{code.code}</p>
                          <p className="text-xs text-muted-foreground">{code.name} - {code.discountPercent}% 折扣</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {code.usedCount}/{code.maxUsage}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(code.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </TabsContent>

        {/* Wallet Codes Tab */}
        <TabsContent value="wallet">
          {!(isPrimaryDeveloper || isDeveloperManager) ? (
            <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">需要开发管理者权限</p></CardContent></Card>
          ) : (
          <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">创建兑换码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">金额 (元)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newWalletAmount}
                    onChange={(e) => setNewWalletAmount(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateWalletCode} disabled={creating} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20">
                    <Plus className="h-4 w-4 mr-1" /> 创建
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {walletCodes.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">兑换码列表</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {walletCodes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-mono font-medium text-sm">{code.code}</p>
                          <p className="text-xs text-muted-foreground">¥{code.amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={code.isUsed ? 'secondary' : 'default'} className={`text-xs ${!code.isUsed ? 'bg-emerald-100 text-emerald-700' : ''}`}>
                            {code.isUsed ? '已使用' : '未使用'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(code.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">添加商品</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">商品名称</Label>
                  <Input
                    placeholder="商品名称"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">价格 (元)</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">描述</Label>
                <Input
                  placeholder="商品描述"
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Tag className="h-3 w-3" /> 商品类型 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> 品牌 <span className="text-red-500">*</span>
                  </Label>
                  <Select value={newProductBrand} onValueChange={setNewProductBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择品牌" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">初始库存数量</Label>
                <Input
                  type="number"
                  min={0}
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleCreateProduct} disabled={creating} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-500/20">
                <Plus className="h-4 w-4 mr-1" /> 添加商品
              </Button>
            </CardContent>
          </Card>

          {products.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">商品列表 ({products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {products.map((product) => {
                      const isInactive = !(product as any).isActive
                      return (
                        <div key={product.id} className={`p-3 rounded-lg border ${isInactive ? 'bg-red-50 border-red-200 opacity-70' : 'bg-slate-50'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{product.name}</p>
                                {isInactive && (
                                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-600">已下架</Badge>
                                )}
                                {(product as any).category && (product as any).category !== '其他' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-200 text-sky-600">
                                    <Tag className="h-2.5 w-2.5 mr-0.5" />{(product as any).category}
                                  </Badge>
                                )}
                                {(product as any).brand && (product as any).brand !== '其他' && (product as any).brand !== '无品牌' && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-200 text-violet-600">
                                    {(product as any).brand}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">¥{product.price}</Badge>
                          </div>

                          {/* Stock Control */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">库存:</span>
                              <span className={`text-sm font-bold ${(product.stock ?? 0) <= 0 ? 'text-red-600' : (product.stock ?? 0) <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {product.stock ?? 0} 件
                              </span>
                              {(product.stock ?? 0) <= 0 && (
                                <Badge className="text-xs bg-red-100 text-red-700 border-red-200">缺货</Badge>
                              )}
                              {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && (
                                <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">低库存</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                value={stockAdjust[product.id] ?? 0}
                                onChange={(e) => setStockAdjust(prev => ({ ...prev, [product.id]: Number(e.target.value) }))}
                                className="w-16 h-7 text-xs text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  const amount = stockAdjust[product.id]
                                  if (amount && amount > 0) {
                                    handleAdjustStock(product.id, amount)
                                    setStockAdjust(prev => ({ ...prev, [product.id]: 0 }))
                                  }
                                }}
                                disabled={!stockAdjust[product.id] || stockAdjust[product.id] <= 0}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => {
                                  const amount = stockAdjust[product.id]
                                  if (amount && amount > 0) {
                                    handleAdjustStock(product.id, -amount)
                                    setStockAdjust(prev => ({ ...prev, [product.id]: 0 }))
                                  }
                                }}
                                disabled={!stockAdjust[product.id] || stockAdjust[product.id] <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingProduct === product.id}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {deletingProduct === product.id ? '删除中...' : '删除商品'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {!isDeveloper ? (
            <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">需要开发者权限</p></CardContent></Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                用户管理 ({allUsers.length})
              </CardTitle>
              <CardDescription className="text-xs">查看和管理所有用户的数据与权限</CardDescription>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">暂无用户</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {allUsers.map((user: any) => {
                      const tierInfo = MEMBERSHIP_TIERS.find(t => t.key === (user.membershipLevel || '').toLowerCase())
                      const TierIcon = tierInfo?.icon || Shield
                      const isEditing = editingUser === user.id
                      return (
                        <div key={user.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">
                                {(user.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              {isEditing ? (
                                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-28 h-7 text-xs" />
                              ) : (
                                <span className="font-medium text-sm">{user.username}</span>
                              )}
                              {isEditing ? (
                                <Select value={editMembershipLevel} onValueChange={setEditMembershipLevel}>
                                  <SelectTrigger className="w-24 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MEMBERSHIP_TIERS.map(tier => (
                                      <SelectItem key={tier.key} value={tier.key}>{tier.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                              <Badge variant="outline" className="text-xs" style={{ borderColor: tierInfo?.color, color: tierInfo?.color }}>
                                <TierIcon className="h-3 w-3 mr-0.5" />{tierInfo?.name || user.membershipLevel}
                              </Badge>
                              )}
                              {user.isPrimaryDeveloper && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">主开发者</Badge>
                              )}
                              {user.isDeveloperManager && !user.isPrimaryDeveloper && (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">开发管理者</Badge>
                              )}
                              {user.isDeveloper && !user.isPrimaryDeveloper && !user.isDeveloperManager && (
                                <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200">开发者</Badge>
                              )}
                              {user.purchaseDisabled && (
                                <Badge className="text-xs bg-red-100 text-red-700 border-red-200">
                                  <Lock className="h-3 w-3 mr-0.5" />已禁购
                                </Badge>
                              )}
                              {user.isHighRisk && (
                                <Badge className="bg-red-100 text-red-700 text-[10px]">高危</Badge>
                              )}
                              {user.isBanned && (
                                <Badge className="bg-gray-800 text-white text-[10px]">已封号</Badge>
                              )}
                              {user.isFrozen && (
                                <Badge className="bg-sky-100 text-sky-700 text-[10px]">已冻结</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-amber-500" />
                              <span className="text-muted-foreground">积分:</span>
                              {isEditing ? (
                                <Input type="number" value={editPoints} onChange={e => setEditPoints(Number(e.target.value))} className="w-20 h-7 text-xs" />
                              ) : (
                                <span className="font-bold text-amber-600">{user.points}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-emerald-500" />
                              <span className="text-muted-foreground">余额:</span>
                              {isEditing ? (
                                <Input type="number" step="0.01" value={editWallet} onChange={e => setEditWallet(Number(e.target.value))} className="w-24 h-7 text-xs" />
                              ) : (
                                <span className="font-bold text-emerald-600">¥{(user.walletBalance || 0).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={async () => {
                                    try {
                                      const updateBody: Record<string, unknown> = { points: editPoints, walletBalance: editWallet, requestingUserId: currentDevUserId }
                                      if (editUsername !== user.username) updateBody.username = editUsername
                                      if (editMembershipLevel !== (user.membershipLevel || '').toLowerCase()) updateBody.membershipLevel = editMembershipLevel
                                      const res = await fetch(`/api/users/${user.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(updateBody),
                                      })
                                      if (res.ok) {
                                        toast.success(`已更新 ${user.username} 的数据`)
                                        setEditingUser(null)
                                        loadData()
                                      } else {
                                        toast.error('更新失败')
                                      }
                                    } catch {
                                      toast.error('网络错误')
                                    }
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />保存
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingUser(null)}>
                                  取消
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setEditingUser(user.id)
                                  setEditPoints(user.points || 0)
                                  setEditWallet(user.walletBalance || 0)
                                  setEditUsername(user.username || '')
                                  setEditMembershipLevel((user.membershipLevel || 'copper').toLowerCase())
                                }}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />编辑数据
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-7 text-xs ${user.purchaseDisabled ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-600'}`}
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ purchaseDisabled: !user.purchaseDisabled }),
                                  })
                                  if (res.ok) {
                                    toast.success(user.purchaseDisabled ? `已恢复 ${user.username} 的购买权限` : `已暂停 ${user.username} 的购买权限`)
                                    loadData()
                                  } else {
                                    toast.error('操作失败')
                                  }
                                } catch {
                                  toast.error('网络错误')
                                }
                              }}
                            >
                              {user.purchaseDisabled ? (
                                <><Check className="h-3 w-3 mr-1" />恢复购买</>
                              ) : (
                                <><Lock className="h-3 w-3 mr-1" />暂停购买</>
                              )}
                            </Button>
                            {/* Freeze/Unfreeze Button */}
                            {user.isFrozen ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-emerald-300 text-emerald-700"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isFrozen: false, requestingUserId: currentDevUserId }),
                                    })
                                    if (res.ok) {
                                      toast.success(`已解冻 ${user.username}`)
                                      loadData()
                                    } else {
                                      toast.error('操作失败')
                                    }
                                  } catch {
                                    toast.error('网络错误')
                                  }
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />解冻
                              </Button>
                            ) : !user.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-sky-300 text-sky-700"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isFrozen: true, frozenReason: '管理员冻结', requestingUserId: currentDevUserId }),
                                    })
                                    if (res.ok) {
                                      toast.success(`已冻结 ${user.username}`)
                                      loadData()
                                    } else {
                                      toast.error('操作失败')
                                    }
                                  } catch {
                                    toast.error('网络错误')
                                  }
                                }}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />冻结
                              </Button>
                            ) : null}
                            {/* Ban/Unban Button */}
                            {user.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-emerald-300 text-emerald-700"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isBanned: false, requestingUserId: currentDevUserId }),
                                    })
                                    if (res.ok) {
                                      toast.success(`已解封 ${user.username}`)
                                      loadData()
                                    } else {
                                      toast.error('操作失败')
                                    }
                                  } catch {
                                    toast.error('网络错误')
                                  }
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />解封
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-red-300 text-red-600"
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/users/${user.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isBanned: true, bannedReason: '管理员封号', requestingUserId: currentDevUserId }),
                                    })
                                    if (res.ok) {
                                      toast.success(`已封号 ${user.username}`)
                                      loadData()
                                    } else {
                                      toast.error('操作失败')
                                    }
                                  } catch {
                                    toast.error('网络错误')
                                  }
                                }}
                              >
                                <Shield className="h-3 w-3 mr-1" />封号
                              </Button>
                            )}
                            {/* Grant/Revoke Developer - Developer Managers and Primary Developers can grant AND revoke */}
                            {(isPrimaryDeveloper || isDeveloperManager) && !user.isPrimaryDeveloper && (
                              user.isDeveloperManager ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-amber-300 text-amber-700"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/users/${user.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isDeveloperManager: false, requestingUserId: currentDevUserId }),
                                      })
                                      if (res.ok) {
                                        toast.success(`已撤销 ${user.username} 的开发管理者权限`)
                                        loadData()
                                      } else {
                                        toast.error('操作失败')
                                      }
                                    } catch {
                                      toast.error('网络错误')
                                    }
                                  }}
                                >
                                  <X className="h-3 w-3 mr-1" />撤销管理者
                                </Button>
                              ) : user.isDeveloper ? (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-amber-300 text-amber-700"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ isDeveloper: false, requestingUserId: currentDevUserId }),
                                        })
                                        if (res.ok) {
                                          toast.success(`已撤销 ${user.username} 的开发者权限`)
                                          loadData()
                                        } else {
                                          toast.error('操作失败')
                                        }
                                      } catch {
                                        toast.error('网络错误')
                                      }
                                    }}
                                  >
                                    <X className="h-3 w-3 mr-1" />撤销开发者
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-emerald-300 text-emerald-700"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ isDeveloperManager: true, requestingUserId: currentDevUserId }),
                                        })
                                        if (res.ok) {
                                          toast.success(`已授权 ${user.username} 为开发管理者`)
                                          loadData()
                                        } else {
                                          toast.error('操作失败')
                                        }
                                      } catch {
                                        toast.error('网络错误')
                                      }
                                    }}
                                  >
                                    <Shield className="h-3 w-3 mr-1" />升为管理者
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-violet-300 text-violet-700"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ isDeveloper: true, requestingUserId: currentDevUserId }),
                                        })
                                        if (res.ok) {
                                          toast.success(`已授权 ${user.username} 为开发者`)
                                          loadData()
                                        } else {
                                          toast.error('操作失败')
                                        }
                                      } catch {
                                        toast.error('网络错误')
                                      }
                                    }}
                                  >
                                    <Code2 className="h-3 w-3 mr-1" />授权开发者
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-emerald-300 text-emerald-700"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/users/${user.id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ isDeveloperManager: true, requestingUserId: currentDevUserId }),
                                        })
                                        if (res.ok) {
                                          toast.success(`已授权 ${user.username} 为开发管理者`)
                                          loadData()
                                        } else {
                                          toast.error('操作失败')
                                        }
                                      } catch {
                                        toast.error('网络错误')
                                      }
                                    }}
                                  >
                                    <Shield className="h-3 w-3 mr-1" />授权管理者
                                  </Button>
                                </div>
                              )
                            )}
                            {/* Grant Developer — Regular Developers can ONLY grant (not revoke) */}
                            {isDeveloper && !isDeveloperManager && !isPrimaryDeveloper && !user.isDeveloper && !user.isDeveloperManager && !user.isPrimaryDeveloper && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-violet-300 text-violet-700"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/users/${user.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isDeveloper: true, requestingUserId: currentDevUserId }),
                                      })
                                      if (res.ok) {
                                        toast.success(`已授权 ${user.username} 为开发者`)
                                        loadData()
                                      } else {
                                        toast.error('操作失败')
                                      }
                                    } catch {
                                      toast.error('网络错误')
                                    }
                                  }}
                                >
                                  <Code2 className="h-3 w-3 mr-1" />授权开发者
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs border-emerald-300 text-emerald-700"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/users/${user.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isDeveloperManager: true, requestingUserId: currentDevUserId }),
                                      })
                                      if (res.ok) {
                                        toast.success(`已授权 ${user.username} 为开发管理者`)
                                        loadData()
                                      } else {
                                        toast.error('操作失败')
                                      }
                                    } catch {
                                      toast.error('网络错误')
                                    }
                                  }}
                                >
                                  <Shield className="h-3 w-3 mr-1" />授权管理者
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* High-Risk Users Tab */}
        <TabsContent value="highrisk" className="space-y-4">
          {!(isPrimaryDeveloper || isDeveloperManager) ? (
            <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">需要开发管理者权限</p></CardContent></Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                高危用户管理 ({highRiskUsers.length})
              </CardTitle>
              <CardDescription className="text-xs">监控和管理被标记为高危的用户</CardDescription>
            </CardHeader>
            <CardContent>
              {highRiskLoading ? (
                <p className="text-center text-muted-foreground py-6">加载中...</p>
              ) : highRiskUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">暂无高危用户</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {highRiskUsers.map((user: any) => (
                      <div key={user.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-red-200 flex items-center justify-center text-sm font-bold text-red-700">
                              {(user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">{user.username}</span>
                            <Badge className="bg-red-100 text-red-700 text-[10px]">高危</Badge>
                            {user.isBanned && <Badge className="bg-gray-800 text-white text-[10px]">已封号</Badge>}
                            {user.isFrozen && <Badge className="bg-sky-100 text-sky-700 text-[10px]">已冻结</Badge>}
                            {!user.isBanned && !user.isFrozen && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">活跃</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">余额: ¥{(user.walletBalance || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-red-600 mb-2">
                          <span className="font-medium">原因：</span>{user.highRiskReason || '未知'}
                        </div>
                        {user.highRiskAt && (
                          <div className="text-xs text-muted-foreground mb-2">
                            标记时间：{new Date(user.highRiskAt).toLocaleString('zh-CN')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t border-red-200">
                          {!user.isFrozen && !user.isBanned && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-sky-300 text-sky-700"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isFrozen: true, frozenReason: '管理员冻结', requestingUserId: currentDevUserId }),
                                  })
                                  if (res.ok) {
                                    toast.success(`已冻结 ${user.username}`)
                                    loadData()
                                    loadHighRiskUsers()
                                  } else {
                                    toast.error('操作失败')
                                  }
                                } catch {
                                  toast.error('网络错误')
                                }
                              }}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />冻结
                            </Button>
                          )}
                          {!user.isBanned && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-red-300 text-red-600"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/users/${user.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isBanned: true, bannedReason: '管理员封号', requestingUserId: currentDevUserId }),
                                  })
                                  if (res.ok) {
                                    toast.success(`已封号 ${user.username}`)
                                    loadData()
                                    loadHighRiskUsers()
                                  } else {
                                    toast.error('操作失败')
                                  }
                                } catch {
                                  toast.error('网络错误')
                                }
                              }}
                            >
                              <Shield className="h-3 w-3 mr-1" />封号
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-amber-300 text-amber-700"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${user.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ isHighRisk: false, requestingUserId: currentDevUserId }),
                                })
                                if (res.ok) {
                                  toast.success(`已取消 ${user.username} 的高危标记`)
                                  loadData()
                                  loadHighRiskUsers()
                                } else {
                                  toast.error('操作失败')
                                }
                              } catch {
                                toast.error('网络错误')
                              }
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />取消高危
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* Backup & Version Tab */}
        <TabsContent value="backup" className="space-y-4">
          {!(isPrimaryDeveloper || isDeveloperManager) ? (
            <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">需要开发管理者权限</p></CardContent></Card>
          ) : (
          <>
          {/* Global Data Backup */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-sky-500" />
                全局数据备份
              </CardTitle>
              <CardDescription className="text-xs">备份你的所有数据到本地文件，或从备份恢复</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shadow-sm"
                  onClick={async () => {
                    try {
                      toast.loading('正在备份数据...', { id: 'backup' })
                      const [usersRes, ordersRes, productsRes, checkinsRes, couponsRes] = await Promise.all([
                        fetch('/api/users?t=' + Date.now()).then(r => r.json()).catch(() => []),
                        fetch('/api/orders?t=' + Date.now()).then(r => r.json()).catch(() => []),
                        fetch('/api/products?all=true&t=' + Date.now()).then(r => r.json()).catch(() => []),
                        fetch('/api/checkin?all=true&t=' + Date.now()).then(r => r.json()).catch(() => []),
                        fetch('/api/coupons?t=' + Date.now()).then(r => r.json()).catch(() => []),
                      ])
                      const backupData = {
                        version: '1.0',
                        exportedAt: new Date().toISOString(),
                        data: { users: usersRes, orders: ordersRes, products: productsRes, checkins: checkinsRes, coupons: couponsRes },
                      }
                      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `会员商城备份_${new Date().toISOString().slice(0, 10)}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                      toast.success('数据备份成功！', { id: 'backup' })
                    } catch {
                      toast.error('备份失败，请重试', { id: 'backup' })
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />备份数据
                </Button>
                <Button
                  variant="outline"
                  className="h-10 border-sky-300 text-sky-700 hover:bg-sky-50"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.json'
                    input.onchange = async (e: any) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const text = await file.text()
                        const backup = JSON.parse(text)
                        if (!backup.data) {
                          toast.error('无效的备份文件')
                          return
                        }
                        toast.loading('正在恢复数据...', { id: 'restore' })
                        // Restore users
                        if (Array.isArray(backup.data.users)) {
                          for (const user of backup.data.users) {
                            await fetch(`/api/users/${user.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                points: user.points,
                                walletBalance: user.walletBalance,
                                membershipLevel: user.membershipLevel,
                                purchaseDisabled: user.purchaseDisabled,
                              }),
                            }).catch(() => {})
                          }
                        }
                        toast.success('数据恢复成功！请刷新页面查看', { id: 'restore' })
                      } catch {
                        toast.error('恢复失败，请检查备份文件', { id: 'restore' })
                      }
                    }
                    input.click()
                  }}
                >
                  <Package className="h-4 w-4 mr-1.5" />恢复数据
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                备份文件包含用户、订单、商品等所有数据 · 下载后请妥善保存
              </p>
            </CardContent>
          </Card>

          {/* Version Check */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gem className="h-4 w-4 text-emerald-500" />
                应用版本
              </CardTitle>
              <CardDescription className="text-xs">查看当前版本并检查更新</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Gem className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">当前版本</p>
                    <p className="text-xs text-muted-foreground">会员商城应用</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">v1.0.0</Badge>
              </div>

              <Button
                className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm"
                onClick={async () => {
                  toast.loading('正在搜索最新版本...', { id: 'version-check' })
                  try {
                    const res = await fetch('/api/version/check')
                    if (res.ok) {
                      const data = await res.json()
                      toast.dismiss('version-check')
                      if (data.latestVersion === '1.0.0') {
                        toast.success('当前已是最新版本 v1.0.0！')
                      } else {
                        toast.info(`发现新版本: v${data.latestVersion}`)
                      }
                    } else {
                      toast.error('检查更新失败', { id: 'version-check' })
                    }
                  } catch {
                    toast.error('网络错误，无法检查更新', { id: 'version-check' })
                  }
                }}
              >
                <Search className="h-4 w-4 mr-2" /> 搜索最新版本
              </Button>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-medium text-amber-700 mb-1">版本号说明</p>
                <div className="space-y-1 text-xs text-amber-600/80">
                  <p>• <span className="font-mono font-medium">2.0.0</span> — 大版本更新（重大架构变更）</p>
                  <p>• <span className="font-mono font-medium">1.1.0</span> — 中版本更新（新功能 / UI改动）</p>
                  <p>• <span className="font-mono font-medium">1.0.1</span> — 小版本更新（Bug修复）</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Developer Manager Slots Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                开发管理者名额
              </CardTitle>
              <CardDescription className="text-xs">
                前 {managerSlotsTotal} 位进入开发者设置的用户自动成为开发管理者
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">名额使用</span>
                    <Badge className={`text-[10px] ${managerSlotsUsed >= managerSlotsTotal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {managerSlotsUsed >= managerSlotsTotal ? '已满' : '可申请'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    已使用 {managerSlotsUsed}/{managerSlotsTotal} 个名额
                  </p>
                </div>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-[10px] text-amber-700">
                  💡 前 {managerSlotsTotal} 位进入开发者设置的用户自动成为开发管理者，可管理用户（修改会员、名字、开发者身份等）。
                  名额满后，新用户需要开发管理者在「用户」标签页中手动授权才能成为开发者。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SMTP & S3 Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                服务配置
              </CardTitle>
              <CardDescription className="text-xs">配置邮件发送（SMTP）和云端存储（S3）的连接信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SMTP Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">SMTP 邮件服务</span>
                  {!appConfig.smtp_user?.hasValue && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">未配置</span>
                  )}
                  {appConfig.smtp_user?.hasValue && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full font-medium">已配置</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">SMTP 服务器</Label>
                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">端口</Label>
                    <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">发件邮箱 (SMTP 用户名)</Label>
                  <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">SMTP 密码 / 应用专用密码</Label>
                  <Input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="输入密码或应用专用密码" className="h-8 text-sm" />
                  {appConfig.smtp_pass?.hasValue && !smtpPass && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">已保存密码，留空则保持不变</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">发件人地址 (From)</Label>
                  <Input value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} placeholder="留空则使用发件邮箱" className="h-8 text-sm" />
                </div>
              </div>

              {/* S3 Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                  <Cloud className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-sm font-medium">S3 云端存储</span>
                  {!appConfig.s3_endpoint?.hasValue && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">未配置</span>
                  )}
                  {appConfig.s3_endpoint?.hasValue && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full font-medium">已配置</span>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">S3 Endpoint</Label>
                  <Input value={s3Endpoint} onChange={(e) => setS3Endpoint(e.target.value)} placeholder="https://s3.eu-west-3.idrivee2.com" className="h-8 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">区域 (Region)</Label>
                    <Input value={s3Region} onChange={(e) => setS3Region(e.target.value)} placeholder="eu-west-3" className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bucket</Label>
                    <Input value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} placeholder="member-store-backup" className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Access Key</Label>
                  <Input type="password" value={s3AccessKey} onChange={(e) => setS3AccessKey(e.target.value)} placeholder="输入 Access Key" className="h-8 text-sm" />
                  {appConfig.s3_access_key?.hasValue && !s3AccessKey && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">已保存 Key，留空则保持不变</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Secret Key</Label>
                  <Input type="password" value={s3SecretKey} onChange={(e) => setS3SecretKey(e.target.value)} placeholder="输入 Secret Key" className="h-8 text-sm" />
                  {appConfig.s3_secret_key?.hasValue && !s3SecretKey && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">已保存 Key，留空则保持不变</p>
                  )}
                </div>
              </div>

              {/* Save button */}
              <Button
                className="w-full h-10 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                disabled={configSaving}
                onClick={handleSaveConfig}
              >
                {configSaving ? '保存中...' : '保存配置'}
              </Button>

              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-[10px] text-amber-700">
                  💡 提示：Gmail 需要使用"应用专用密码"而非登录密码。前往 Google 账号 → 安全 → 两步验证 → 应用专用密码 生成。
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cloud Backup & Restore */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cloud className="h-4 w-4 text-violet-500" />
                云端备份与恢复
              </CardTitle>
              <CardDescription className="text-xs">将数据备份到云端或从云端恢复，实现跨设备同步</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Cloud status check */}
              <Button
                variant="outline"
                className="w-full h-10 border-violet-300 text-violet-700 hover:bg-violet-50"
                disabled={checkingCloud}
                onClick={async () => {
                  setCheckingCloud(true)
                  try {
                    const res = await fetch('/api/cloud-backup')
                    if (res.ok) {
                      const data = await res.json()
                      setCloudBackupInfo(data)
                      toast.success('云端状态获取成功')
                    } else {
                      toast.error('获取云端状态失败')
                    }
                  } catch {
                    toast.error('网络错误')
                  } finally {
                    setCheckingCloud(false)
                  }
                }}
              >
                {checkingCloud ? '检查中...' : '检查云端状态'}
              </Button>

              {cloudBackupInfo && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
                  <p className="font-medium">云端备份信息</p>
                  {cloudBackupInfo.lastBackup ? (
                    <p className="text-xs text-muted-foreground">最近备份: {new Date(cloudBackupInfo.lastBackup).toLocaleString('zh-CN')}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无云端备份</p>
                  )}
                  {cloudBackupInfo.size && (
                    <p className="text-xs text-muted-foreground">备份大小: {cloudBackupInfo.size}</p>
                  )}
                </div>
              )}

              {/* Force backup */}
              <Button
                className="w-full h-10 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-sm"
                disabled={cloudBackupLoading}
                onClick={async () => {
                  setCloudBackupLoading(true)
                  try {
                    const res = await fetch('/api/cloud-backup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ force: true }),
                    })
                    if (res.ok) {
                      toast.success('云端备份成功！')
                    } else {
                      const err = await res.json()
                      toast.error(err.error || '云端备份失败')
                    }
                  } catch {
                    toast.error('网络错误')
                  } finally {
                    setCloudBackupLoading(false)
                  }
                }}
              >
                {cloudBackupLoading ? '备份中...' : '强制云端备份'}
              </Button>

              {/* Cloud restore */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-violet-300 text-violet-700 hover:bg-violet-50"
                    disabled={cloudRestoreLoading}
                  >
                    {cloudRestoreLoading ? '恢复中...' : '从云端恢复'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认从云端恢复？</AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将用云端备份的数据覆盖当前所有数据，此操作不可撤销。确定要继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        setCloudRestoreLoading(true)
                        try {
                          const res = await fetch('/api/cloud-restore', { method: 'POST' })
                          if (res.ok) {
                            toast.success('云端恢复成功！请刷新页面')
                            loadData()
                          } else {
                            const err = await res.json()
                            toast.error(err.error || '云端恢复失败')
                          }
                        } catch {
                          toast.error('网络错误')
                        } finally {
                          setCloudRestoreLoading(false)
                        }
                      }}
                    >
                      确认恢复
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-xs text-muted-foreground text-center">
                云端备份每30秒自动执行一次（开发者在线时） · 可手动强制备份
              </p>
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ─── Invite Panel ──────────────────────────────────────────────────────────

function InvitePanel() {
  const { userId, username, refreshUser } = useAppStore()
  const [inviteCode, setInviteCode] = useState('')
  const [invitedBy, setInvitedBy] = useState<string | null>(null)
  const [inviteHistory, setInviteHistory] = useState<any[]>([])
  const [totalInvited, setTotalInvited] = useState(0)
  const [totalPointsReward, setTotalPointsReward] = useState(0)
  const [totalWalletReward, setTotalWalletReward] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const fetchInviteData = async () => {
      try {
        const res = await fetch(`/api/invite?userId=${userId}&t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          setInviteCode(data.inviteCode || '')
          setInvitedBy(data.invitedBy || null)
          setInviteHistory(data.inviteHistory || [])
          setTotalInvited(data.totalInvited || 0)
          setTotalPointsReward(data.totalPointsReward || 0)
          setTotalWalletReward(data.totalWalletReward || 0)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    fetchInviteData()
  }, [userId])

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    toast.success('邀请码已复制到剪贴板！')
  }

  const shareInviteLink = () => {
    const text = `我在会员商城发现了一个超棒的购物平台！使用我的邀请码 ${inviteCode} 注册，你我都能获得奖励哦！`
    navigator.clipboard.writeText(text)
    toast.success('邀请文案已复制！快分享给好友吧')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users className="h-5 w-5 text-pink-500" />
        邀请好友
      </h2>

      {/* Invite Code Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 px-5 py-6 text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5" />
              <span className="font-bold text-lg">邀请好友，赢取奖励！</span>
            </div>
            <p className="text-sm text-pink-100">每成功邀请一位好友注册，你将获得 <span className="font-bold text-white">+50积分</span> 和 <span className="font-bold text-white">+¥2.00余额</span></p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">你的专属邀请码</p>
            <div className="flex items-center justify-center gap-3">
              <div className="px-6 py-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-dashed border-pink-300">
                <span className="text-2xl font-mono font-bold tracking-widest text-pink-600">{loading ? '···' : inviteCode}</span>
              </div>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-md"
                onClick={copyInviteCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-sm"
            onClick={shareInviteLink}
          >
            <Gift className="h-4 w-4 mr-2" /> 复制邀请文案
          </Button>
          {invitedBy && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
              <p className="text-xs text-emerald-600">你通过邀请码 <span className="font-mono font-bold">{invitedBy}</span> 加入</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{totalInvited}</p>
            <p className="text-xs text-muted-foreground mt-1">邀请人数</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">+{totalPointsReward}</p>
            <p className="text-xs text-muted-foreground mt-1">获得积分</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">+¥{totalWalletReward.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">获得余额</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            如何邀请好友
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { step: '1', title: '复制邀请码', desc: '点击复制按钮或直接分享你的专属邀请码' },
              { step: '2', title: '好友注册时填写', desc: '好友在注册时输入你的邀请码' },
              { step: '3', title: '双方获得奖励', desc: '你获得 +50积分 和 +¥2.00余额' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600 shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite History */}
      {inviteHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              邀请记录 ({inviteHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {inviteHistory.map((record: any) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold text-pink-600">
                        {(record.inviteeName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.inviteeName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="text-xs bg-amber-100 text-amber-700 border-0">+{record.reward}积分</Badge>
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 ml-1">+¥{record.walletReward.toFixed(1)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// ─── AI Service Chat ────────────────────────────────────────────────────────

function AIServiceChat() {
  const { userId, username } = useAppStore()
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useState<HTMLDivElement | null>(null)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      } else {
        const err = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: `抱歉，出了点问题：${err.error || '请稍后再试'}` }])
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '网络错误，请检查网络连接后重试。' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-cyan-500" />
        AI客服
      </h2>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-5 py-4 text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold">会员商城AI助手</p>
              <p className="text-xs text-cyan-100">在线 · 随时为你解答问题</p>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          {/* Chat Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-3" ref={(el) => { if (el) el.scrollTop = el.scrollHeight }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-cyan-50 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-cyan-400" />
                </div>
                <p className="font-medium text-sm mb-1">你好，{username || '用户'}！</p>
                <p className="text-xs max-w-xs">我是AI客服助手，可以回答关于会员等级、商品购买、签到积分、虚拟钱包等问题。有什么可以帮你的吗？</p>
                <div className="flex flex-wrap gap-2 mt-4 max-w-sm justify-center">
                  {['会员等级有哪些？', '如何签到赚积分？', '怎么充值钱包？', '配送方式有哪些？'].map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                      onClick={() => { setInput(q) }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-5 w-5 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-cyan-600" />
                      </div>
                      <span className="text-xs text-muted-foreground">AI助手</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-5 w-5 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-cyan-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">AI助手</span>
                  </div>
                  <div className="px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="输入你的问题..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={loading}
                className="flex-1 h-10 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-10 w-10 p-0 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">AI回复仅供参考，如有疑问请联系开发者</p>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-muted-foreground hover:text-red-500"
                  onClick={() => setMessages([])}
                >
                  清空对话
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Global Effect Overlay ──────────────────────────────────────────────────

function GlobalEffectOverlay() {
  const { globalEffect, globalEffectColor } = useAppStore()
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const color = globalEffectColor.value
  const glow = globalEffectColor.glow

  const handleRippleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (globalEffect !== 'ripple') return
    const id = Date.now() + Math.random()
    setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 1500)
  }

  if (!globalEffect) return null

  const renderEffect = () => {
    switch (globalEffect) {
      case 'particles':
        return (
          <>
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-5%',
                  width: `${4 + Math.random() * 10}px`,
                  height: `${4 + Math.random() * 10}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 ${6 + Math.random() * 12}px ${glow}, 0 0 ${12 + Math.random() * 20}px ${color}50`,
                  animation: `global-float-up ${4 + Math.random() * 6}s ${Math.random() * 6}s infinite ease-out`,
                  opacity: 0,
                }}
              />
            ))}
          </>
        )

      case 'pulse':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 40px ${glow}, 0 0 80px ${color}60` }} />
            <div className="absolute w-24 h-24 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 20px ${glow}`, animation: 'global-pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
            <div className="absolute w-24 h-24 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 20px ${glow}`, animation: 'global-pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite 1s' }} />
          </div>
        )

      case 'wave':
        return (
          <>
            <div className="absolute bottom-0 left-0 w-[200%] h-32" style={{ opacity: 0.3, animation: 'global-wave 3s linear infinite' }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={color} />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-28" style={{ opacity: 0.5, animation: 'global-wave 3s linear infinite 0.5s' }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={glow} />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-24" style={{ opacity: 0.7, animation: 'global-wave 3s linear infinite 1s' }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={color} />
              </svg>
            </div>
          </>
        )

      case 'ripple':
        return (
          <>
            {ripples.map(r => (
              <div
                key={r.id}
                className="absolute w-10 h-10 rounded-full"
                style={{
                  left: r.x - 20,
                  top: r.y - 20,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 15px ${glow}`,
                  animation: 'global-ripple 1.2s cubic-bezier(0, 0.2, 0.8, 1) forwards',
                }}
              />
            ))}
          </>
        )

      case 'aurora':
        return (
          <>
            <div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                left: '50%', top: '50%',
                background: `radial-gradient(circle, ${color}60, ${glow}30, transparent)`,
                filter: 'blur(80px)',
                animation: 'global-aurora 8s ease-in-out infinite',
              }}
            />
            <div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                left: '40%', top: '40%',
                background: `radial-gradient(circle, ${glow}40, ${color}20, transparent)`,
                filter: 'blur(60px)',
                animation: 'global-aurora 8s ease-in-out infinite reverse 2s',
              }}
            />
            <div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                left: '60%', top: '60%',
                background: `radial-gradient(circle, ${color}30, ${glow}15, transparent)`,
                filter: 'blur(70px)',
                animation: 'global-aurora 10s ease-in-out infinite 4s',
              }}
            />
          </>
        )

      case 'neon':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1
              className="text-5xl font-bold"
              style={{ '--fx-color': color, color, animation: 'global-neon-flicker 2s infinite alternate' } as React.CSSProperties}
            >
              会员商城
            </h1>
          </div>
        )

      case 'meteor':
        return (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${Math.random() * 50}%`,
                  left: `${20 + Math.random() * 70}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${60 + Math.random() * 80}px`,
                  background: `linear-gradient(to bottom, ${color}, transparent)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 8px ${glow}`,
                  animation: `global-meteor ${1.5 + Math.random() * 2.5}s ${Math.random() * 5}s linear infinite`,
                  opacity: 0,
                }}
              />
            ))}
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={`s${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  opacity: 0.2 + Math.random() * 0.4,
                }}
              />
            ))}
          </>
        )

      case 'breathing':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${24 + i * 16}px`,
                  height: `${24 + i * 16}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 30px ${glow}, 0 0 60px ${color}40`,
                  animation: `global-breathe ${2.5 + i * 0.5}s ${i * 0.4}s ease-in-out infinite`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )

      case 'shimmer':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${glow}25 45%, ${color}40 50%, ${glow}25 55%, transparent 100%)`,
                animation: 'global-shimmer 3s infinite',
              }}
            />
          </div>
        )

      case 'orbit':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute w-10 h-10 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 30px ${glow}, 0 0 60px ${color}50`,
              }}
            />
            {[80, 130, 180].map((r, ri) => (
              <div
                key={ri}
                className="absolute rounded-full border"
                style={{
                  width: r * 2, height: r * 2,
                  borderColor: `${color}15`,
                }}
              />
            ))}
            {[
              { r: 80, dur: '4s', size: 10, delay: '0s' },
              { r: 130, dur: '6s', size: 8, delay: '1.5s' },
              { r: 180, dur: '8s', size: 12, delay: '3s' },
            ].map((orb, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  '--orbit-r': `${orb.r}px`,
                  width: orb.size,
                  height: orb.size,
                  borderRadius: '50%',
                  backgroundColor: glow,
                  boxShadow: `0 0 12px ${glow}, 0 0 24px ${color}50`,
                  animation: `global-orbit ${orb.dur} linear infinite`,
                  animationDelay: orb.delay,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-auto"
      onClick={handleRippleClick}
      style={{ background: globalEffect === 'meteor' ? 'rgba(0,0,0,0.3)' : 'transparent' }}
    >
      {renderEffect()}
    </motion.div>
  )
}

// ─── Effects Showcase ───────────────────────────────────────────────────────

function EffectsShowcase() {
  const { globalEffect, globalEffectColor, setGlobalEffect, setGlobalEffectColor } = useAppStore()
  const [activeEffect, setActiveEffect] = useState<EffectKey>(globalEffect || 'particles')
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const selectedColor = globalEffectColor
  const setSelectedColor = setGlobalEffectColor
  const color = selectedColor.value
  const glow = selectedColor.glow

  const isAppliedGlobally = globalEffect === activeEffect

  const effects: { key: EffectKey; name: string; icon: typeof Sparkles; desc: string }[] = [
    { key: 'particles', name: '粒子飘浮', icon: Sparkles, desc: '飘浮上升的发光粒子' },
    { key: 'pulse', name: '脉冲光环', icon: Gem, desc: '向外扩散的光环脉冲' },
    { key: 'wave', name: '渐变波浪', icon: Crown, desc: '流动的渐变波浪' },
    { key: 'ripple', name: '涟漪扩散', icon: MousePointer, desc: '点击产生涟漪效果' },
    { key: 'aurora', name: '极光', icon: Star, desc: '梦幻的极光流动' },
    { key: 'neon', name: '霓虹文字', icon: Wand2, desc: '闪烁的霓虹灯效果' },
    { key: 'meteor', name: '流星雨', icon: Sparkles, desc: '划过夜空的流星' },
    { key: 'breathing', name: '呼吸光点', icon: Coins, desc: '有节奏的呼吸动画' },
    { key: 'shimmer', name: '微光扫过', icon: Shield, desc: '闪光扫过效果' },
    { key: 'orbit', name: '轨道环绕', icon: CalendarCheck, desc: '粒子绕中心旋转' },
  ]

  const handleRippleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 1500)
  }

  const renderEffect = () => {
    switch (activeEffect) {
      case 'particles':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="fx-particle absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-10%',
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 ${6 + Math.random() * 10}px ${glow}, 0 0 ${12 + Math.random() * 20}px ${color}50`,
                  '--duration': `${3 + Math.random() * 5}s`,
                  '--delay': `${Math.random() * 5}s`,
                } as React.CSSProperties}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>
        )

      case 'pulse':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 30px ${glow}, 0 0 60px ${color}60` }} />
            <div className="fx-pulse-ring absolute w-20 h-20 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 15px ${glow}` }} />
            <div className="fx-pulse-ring-delay absolute w-20 h-20 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 15px ${glow}` }} />
          </div>
        )

      case 'wave':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90">
            <div className="absolute bottom-0 left-0 w-[200%] h-24 fx-wave" style={{ opacity: 0.4 }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={color} />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-20 fx-wave-delay-1" style={{ opacity: 0.6 }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={glow} />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-16 fx-wave-delay-2" style={{ opacity: 0.8 }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={color} />
              </svg>
            </div>
          </div>
        )

      case 'ripple':
        return (
          <div
            className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center cursor-pointer select-none"
            onClick={handleRippleClick}
          >
            <p className="text-white/50 text-sm z-10 pointer-events-none">点击任意位置</p>
            {ripples.map(r => (
              <div
                key={r.id}
                className="fx-ripple-circle absolute w-8 h-8 rounded-full"
                style={{
                  left: r.x - 16,
                  top: r.y - 16,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 10px ${glow}`,
                }}
              />
            ))}
          </div>
        )

      case 'aurora':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90">
            <div
              className="fx-aurora-blob absolute w-64 h-64 rounded-full blur-3xl"
              style={{
                left: '50%', top: '50%',
                background: `radial-gradient(circle, ${color}80, ${glow}40, transparent)`,
              }}
            />
            <div
              className="fx-aurora-blob-2 absolute w-48 h-48 rounded-full blur-3xl"
              style={{
                left: '40%', top: '40%',
                background: `radial-gradient(circle, ${glow}60, ${color}30, transparent)`,
              }}
            />
            <div
              className="fx-aurora-blob-3 absolute w-56 h-56 rounded-full blur-3xl"
              style={{
                left: '60%', top: '60%',
                background: `radial-gradient(circle, ${color}50, ${glow}20, transparent)`,
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-4 text-white/60 text-xs">Aurora Borealis</div>
          </div>
        )

      case 'neon':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex flex-col items-center justify-center gap-6">
            <h2
              className="fx-neon-text text-4xl font-bold"
              style={{ '--fx-color': color, color: color } as React.CSSProperties}
            >
              NEON
            </h2>
            <p
              className="fx-neon-text text-lg font-medium"
              style={{ '--fx-color': glow, color: glow, animationDelay: '0.5s' } as React.CSSProperties}
            >
              霓虹灯特效
            </p>
          </div>
        )

      case 'meteor':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="fx-meteor absolute"
                style={{
                  top: `${Math.random() * 40}%`,
                  left: `${30 + Math.random() * 60}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${40 + Math.random() * 60}px`,
                  background: `linear-gradient(to bottom, ${color}, transparent)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px ${glow}`,
                  '--duration': `${1.5 + Math.random() * 2}s`,
                  '--delay': `${Math.random() * 4}s`,
                } as React.CSSProperties}
              />
            ))}
            {/* Stars background */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={`s${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )

      case 'breathing':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="flex gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="fx-breathe rounded-full"
                  style={{
                    width: `${16 + i * 8}px`,
                    height: `${16 + i * 8}px`,
                    backgroundColor: color,
                    boxShadow: `0 0 20px ${glow}, 0 0 40px ${color}40`,
                    '--duration': `${2 + i * 0.4}s`,
                    '--delay': `${i * 0.3}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )

      case 'shimmer':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="relative w-64 h-32 rounded-xl overflow-hidden" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color }}>SHIMMER</span>
              </div>
              <div
                className="fx-shimmer absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, ${glow}40, transparent)`,
                }}
              />
            </div>
          </div>
        )

      case 'orbit':
        return (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center">
            {/* Center dot */}
            <div
              className="absolute w-6 h-6 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 20px ${glow}, 0 0 40px ${color}50`,
              }}
            />
            {/* Orbit paths */}
            {[40, 65, 90].map((r, ri) => (
              <div
                key={ri}
                className="absolute rounded-full border"
                style={{
                  width: r * 2, height: r * 2,
                  borderColor: `${color}20`,
                }}
              />
            ))}
            {/* Orbiting dots */}
            {[
              { r: 40, dur: '3s', size: 8, delay: '0s' },
              { r: 65, dur: '5s', size: 6, delay: '1s' },
              { r: 90, dur: '7s', size: 10, delay: '2s' },
            ].map((orb, i) => (
              <div
                key={i}
                className="fx-orbit absolute"
                style={{
                  '--orbit-r': `${orb.r}px`,
                  '--duration': orb.dur,
                  '--delay': orb.delay,
                  width: orb.size,
                  height: orb.size,
                  borderRadius: '50%',
                  backgroundColor: glow,
                  boxShadow: `0 0 10px ${glow}, 0 0 20px ${color}60`,
                  animationDelay: orb.delay,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-rose-500" />
          特效展示
        </h2>
        <div className="flex items-center gap-2">
          {globalEffect && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge className="gap-1 bg-rose-500 text-white text-xs">
                <Sparkles className="h-3 w-3" /> 全场景: {effects.find(e => e.key === globalEffect)?.name}
              </Badge>
            </motion.div>
          )}
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> {effects.length} 种特效
          </Badge>
        </div>
      </div>

      {/* Color Picker */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Palette className="h-4 w-4" /> 选择颜色
            </Label>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: color }} />
              <span className="text-xs font-mono text-muted-foreground">{color}</span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {EFFECT_COLORS.map((c) => (
              <motion.button
                key={c.value}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setSelectedColor(c); if (globalEffect) setGlobalEffectColor(c) }}
                className={`relative h-10 rounded-xl transition-all border-2 ${
                  selectedColor.value === c.value ? 'border-white shadow-lg scale-110' : 'border-transparent hover:border-white/40'
                }`}
                style={{ backgroundColor: c.value, boxShadow: selectedColor.value === c.value ? `0 0 12px ${c.glow}` : undefined }}
                title={c.name}
              >
                {selectedColor.value === c.value && (
                  <Check className="h-4 w-4 absolute inset-0 m-auto text-white drop-shadow-md" />
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Effect Selector */}
      <div className="grid grid-cols-5 gap-2">
        {effects.map((fx) => {
          const Icon = fx.icon
          const isActive = activeEffect === fx.key
          return (
            <motion.button
              key={fx.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveEffect(fx.key)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
                isActive
                  ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <span className={`text-[11px] font-medium leading-tight ${isActive ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {fx.name}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* Apply to Scene Button */}
      <div className="flex gap-3">
        <Button
          className={`flex-1 h-11 font-medium ${
            isAppliedGlobally
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
          }`}
          onClick={() => {
            if (isAppliedGlobally) {
              setGlobalEffect(null)
              toast.success('已关闭全场景特效')
            } else {
              setGlobalEffect(activeEffect)
              setGlobalEffectColor(selectedColor)
              toast.success(`已将「${effects.find(e => e.key === activeEffect)?.name}」应用到全场景！`)
            }
          }}
        >
          {isAppliedGlobally ? (
            <><X className="h-4 w-4 mr-2" /> 关闭全场景特效</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> 应用到全场景</>
          )}
        </Button>
        {globalEffect && globalEffect !== activeEffect && (
          <Button
            variant="outline"
            className="h-11 border-rose-300 text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setGlobalEffect(null)
              toast.success('已关闭全场景特效')
            }}
          >
            <X className="h-4 w-4 mr-1" /> 关闭当前
          </Button>
        )}
      </div>

      {/* Effect Display */}
      <motion.div
        key={activeEffect}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-0">
            {renderEffect()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Effect Description */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
              {(() => { const Icon = effects.find(e => e.key === activeEffect)?.icon || Sparkles; return <Icon className="h-5 w-5" /> })()}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{effects.find(e => e.key === activeEffect)?.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{effects.find(e => e.key === activeEffect)?.desc}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: color, color }}>
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {selectedColor.name}
                </Badge>
                {activeEffect === 'ripple' && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <MousePointer className="h-3 w-3" /> 互动
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Color Input */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-semibold flex items-center gap-1.5">
            <Wand2 className="h-4 w-4" /> 自定义颜色
          </Label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="#ff6600"
                value={color}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    setSelectedColor({ name: '自定义', value: v, glow: v })
                    if (globalEffect) setGlobalEffectColor({ name: '自定义', value: v, glow: v })
                  }
                }}
                className="font-mono pr-12"
              />
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                const newColor = { name: '自定义', value: e.target.value, glow: e.target.value }
                setSelectedColor(newColor)
                if (globalEffect) setGlobalEffectColor(newColor)
              }}
              className="w-10 h-10 rounded-lg cursor-pointer border-0"
              title="选择自定义颜色"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

function SettingsPanel() {
  const {
    userId, username, membershipLevel, walletBalance, points,
    globalEffect, globalEffectColor, setGlobalEffect, setGlobalEffectColor,
    logout, setCurrentView, setShowAuthDialog,
    buttonColor, appBackgroundColor, setButtonColor, setAppBackgroundColor,
    emailVerified, refreshUser, isDeveloper,
    isPrimaryDeveloper, isDeveloperManager,
    setIsDeveloper, setIsDeveloperManager,
  } = useAppStore()

  const [activeEffect, setActiveEffect] = useState<EffectKey>(globalEffect || 'particles')
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [updateChangelog, setUpdateChangelog] = useState<string | null>(null)
  const [versionTapCount, setVersionTapCount] = useState(0)

  // Email verification state
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyCodeSent, setVerifyCodeSent] = useState(false)
  const [verifyCodeCountdown, setVerifyCodeCountdown] = useState(0)
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [devVerifyCode, setDevVerifyCode] = useState('')
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [showReverify, setShowReverify] = useState(false)

  const CURRENT_VERSION = '1.0.0'

  const selectedColor = globalEffectColor
  const setSelectedColor = setGlobalEffectColor
  const color = selectedColor.value
  const glow = selectedColor.glow

  const isAppliedGlobally = globalEffect === activeEffect

  const currentTier = MEMBERSHIP_TIERS.find(t => t.key === membershipLevel) || MEMBERSHIP_TIERS[0]
  const TierIcon = currentTier.icon

  // Load current email from user data
  useEffect(() => {
    if (!userId) return
    fetch(`/api/users/${userId}?t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.email) setCurrentEmail(data.email)
      })
      .catch(() => {})
  }, [userId])

  // Countdown timer for email verification code
  useEffect(() => {
    if (verifyCodeCountdown <= 0) return
    const timer = setTimeout(() => setVerifyCodeCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [verifyCodeCountdown])

  const handleSendVerifyCode = async () => {
    if (!verifyEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(verifyEmail.trim())) {
      toast.error('请输入有效的邮箱地址')
      return
    }
    setVerifyCodeLoading(true)
    try {
      const res = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail.trim(), userId }),
      })
      if (res.ok) {
        const data = await res.json()
        setVerifyCodeSent(true)
        setVerifyCodeCountdown(60)
        if (data.devCode) setDevVerifyCode(data.devCode)
        toast.success('验证码已发送，请查收邮箱')
      } else {
        const err = await res.json()
        toast.error(err.error || '发送验证码失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setVerifyCodeLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verifyEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }
    if (!verifyCode.trim()) {
      toast.error('请输入验证码')
      return
    }
    if (!userId) return
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: verifyEmail.trim(), code: verifyCode.trim() }),
      })
      if (res.ok) {
        await refreshUser()
        setCurrentEmail(verifyEmail.trim())
        setVerifyEmail('')
        setVerifyCode('')
        setVerifyCodeSent(false)
        setDevVerifyCode('')
        setShowReverify(false)
        toast.success('邮箱验证成功！')
        // Sync to cloud storage
        try {
          fetch('/api/cloud-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }).catch(() => {})
        } catch {}
      } else {
        const err = await res.json()
        toast.error(err.error || '验证失败')
      }
    } catch {
      toast.error('网络错误，请重试')
    } finally {
      setVerifyLoading(false)
    }
  }

  const effects: { key: EffectKey; name: string; icon: typeof Sparkles; desc: string }[] = [
    { key: 'particles', name: '粒子飘浮', icon: Sparkles, desc: '飘浮上升的发光粒子' },
    { key: 'pulse', name: '脉冲光环', icon: Gem, desc: '向外扩散的光环脉冲' },
    { key: 'wave', name: '渐变波浪', icon: Crown, desc: '流动的渐变波浪' },
    { key: 'ripple', name: '涟漪扩散', icon: MousePointer, desc: '点击产生涟漪效果' },
    { key: 'aurora', name: '极光', icon: Star, desc: '梦幻的极光流动' },
    { key: 'neon', name: '霓虹文字', icon: Wand2, desc: '闪烁的霓虹灯效果' },
    { key: 'meteor', name: '流星雨', icon: Sparkles, desc: '划过夜空的流星' },
    { key: 'breathing', name: '呼吸光点', icon: Coins, desc: '有节奏的呼吸动画' },
    { key: 'shimmer', name: '微光扫过', icon: Shield, desc: '闪光扫过效果' },
    { key: 'orbit', name: '轨道环绕', icon: CalendarCheck, desc: '粒子绕中心旋转' },
  ]

  const handleRippleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 1500)
  }

  const handleLogout = () => {
    logout()
    setShowLogoutConfirm(false)
    toast.success('已登出')
    // Show auth dialog after logout
    setTimeout(() => {
      setShowAuthDialog(true)
    }, 300)
  }

  const renderEffectPreview = () => {
    switch (activeEffect) {
      case 'particles':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="fx-particle absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-10%',
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 ${6 + Math.random() * 10}px ${glow}, 0 0 ${12 + Math.random() * 20}px ${color}50`,
                  '--duration': `${3 + Math.random() * 5}s`,
                  '--delay': `${Math.random() * 5}s`,
                } as React.CSSProperties}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          </div>
        )
      case 'pulse':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 30px ${glow}, 0 0 60px ${color}60` }} />
            <div className="fx-pulse-ring absolute w-16 h-16 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 15px ${glow}` }} />
            <div className="fx-pulse-ring-delay absolute w-16 h-16 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 15px ${glow}` }} />
          </div>
        )
      case 'wave':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90">
            <div className="absolute bottom-0 left-0 w-[200%] h-20 fx-wave" style={{ opacity: 0.4 }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={color} />
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-[200%] h-16 fx-wave-delay-1" style={{ opacity: 0.7 }}>
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,134.83,141.14,214.86,120.42,273.49,105.5,321.39,56.44,321.39,56.44Z" fill={glow} />
              </svg>
            </div>
          </div>
        )
      case 'ripple':
        return (
          <div
            className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center cursor-pointer select-none"
            onClick={handleRippleClick}
          >
            <p className="text-white/50 text-sm z-10 pointer-events-none">点击任意位置</p>
            {ripples.map(r => (
              <div
                key={r.id}
                className="fx-ripple-circle absolute w-8 h-8 rounded-full"
                style={{
                  left: r.x - 16,
                  top: r.y - 16,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 10px ${glow}`,
                }}
              />
            ))}
          </div>
        )
      case 'aurora':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90">
            <div
              className="fx-aurora-blob absolute w-48 h-48 rounded-full blur-3xl"
              style={{
                left: '50%', top: '50%',
                background: `radial-gradient(circle, ${color}80, ${glow}40, transparent)`,
              }}
            />
            <div
              className="fx-aurora-blob-2 absolute w-40 h-40 rounded-full blur-3xl"
              style={{
                left: '40%', top: '40%',
                background: `radial-gradient(circle, ${glow}60, ${color}30, transparent)`,
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )
      case 'neon':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex flex-col items-center justify-center gap-4">
            <h2
              className="fx-neon-text text-3xl font-bold"
              style={{ '--fx-color': color, color: color } as React.CSSProperties}
            >
              NEON
            </h2>
            <p
              className="fx-neon-text text-base font-medium"
              style={{ '--fx-color': glow, color: glow, animationDelay: '0.5s' } as React.CSSProperties}
            >
              霓虹灯特效
            </p>
          </div>
        )
      case 'meteor':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="fx-meteor absolute"
                style={{
                  top: `${Math.random() * 40}%`,
                  left: `${30 + Math.random() * 60}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${40 + Math.random() * 50}px`,
                  background: `linear-gradient(to bottom, ${color}, transparent)`,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px ${glow}`,
                  '--duration': `${1.5 + Math.random() * 2}s`,
                  '--delay': `${Math.random() * 4}s`,
                } as React.CSSProperties}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`s${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  opacity: 0.3 + Math.random() * 0.5,
                }}
              />
            ))}
          </div>
        )
      case 'breathing':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="fx-breathe rounded-full"
                  style={{
                    width: `${16 + i * 8}px`,
                    height: `${16 + i * 8}px`,
                    backgroundColor: color,
                    boxShadow: `0 0 20px ${glow}, 0 0 40px ${color}40`,
                    '--duration': `${2 + i * 0.4}s`,
                    '--delay': `${i * 0.3}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )
      case 'shimmer':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div className="relative w-56 h-28 rounded-xl overflow-hidden" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color }}>SHIMMER</span>
              </div>
              <div
                className="fx-shimmer absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, ${glow}40, transparent)`,
                }}
              />
            </div>
          </div>
        )
      case 'orbit':
        return (
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-black/90 flex items-center justify-center">
            <div
              className="absolute w-5 h-5 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 20px ${glow}, 0 0 40px ${color}50`,
              }}
            />
            {[35, 55, 75].map((r, ri) => (
              <div
                key={ri}
                className="absolute rounded-full border"
                style={{
                  width: r * 2, height: r * 2,
                  borderColor: `${color}20`,
                }}
              />
            ))}
            {[
              { r: 35, dur: '3s', size: 7, delay: '0s' },
              { r: 55, dur: '5s', size: 5, delay: '1s' },
              { r: 75, dur: '7s', size: 9, delay: '2s' },
            ].map((orb, i) => (
              <div
                key={i}
                className="fx-orbit absolute"
                style={{
                  '--orbit-r': `${orb.r}px`,
                  '--duration': orb.dur,
                  '--delay': orb.delay,
                  width: orb.size,
                  height: orb.size,
                  borderRadius: '50%',
                  backgroundColor: glow,
                  boxShadow: `0 0 10px ${glow}, 0 0 20px ${color}60`,
                  animationDelay: orb.delay,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings className="h-5 w-5 text-fuchsia-500" />
        设置
      </h2>

      {/* ── Account Info ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white border-2 border-white/30">
              {(username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate">{username || '未登录'}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs gap-1">
                  <TierIcon className="h-3 w-3" />
                  {currentTier.name}
                </Badge>
                <span className="text-emerald-100 text-xs">ID: {userId?.slice(0, 8) ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-600">{points}</p>
              <p className="text-xs text-muted-foreground">积分</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">¥{walletBalance.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">余额</p>
            </div>
            <div>
              <p className="text-lg font-bold text-fuchsia-600">{globalEffect ? effects.find(e => e.key === globalEffect)?.name : '无'}</p>
              <p className="text-xs text-muted-foreground">当前特效</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Email Verification ── */}
      {userId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              验证邮箱
            </CardTitle>
            <CardDescription className="text-xs">
              {emailVerified
                ? '你的邮箱已验证，可以更改邮箱地址'
                : '验证邮箱后可使用全部功能，且不再弹出验证提示'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailVerified && currentEmail && !showReverify ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CircleCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-700">已验证邮箱</p>
                    <p className="text-xs text-emerald-600 truncate">{currentEmail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 shrink-0"
                    onClick={() => setShowReverify(true)}
                  >
                    重新验证
                  </Button>
                </div>
              </div>
            ) : emailVerified && currentEmail ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700">更改邮箱地址</p>
                    <p className="text-xs text-blue-500">当前: {currentEmail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => { setShowReverify(false); setVerifyEmail(''); setVerifyCode(''); setVerifyCodeSent(false); setDevVerifyCode('') }}
                  >
                    取消
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">新邮箱地址</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="输入新的邮箱地址..."
                      value={verifyEmail}
                      onChange={(e) => { setVerifyEmail(e.target.value); setVerifyCodeSent(false); setDevVerifyCode('') }}
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      className="h-9 px-3 shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                      disabled={verifyCodeLoading || verifyCodeCountdown > 0 || !verifyEmail.trim()}
                      onClick={handleSendVerifyCode}
                    >
                      {verifyCodeLoading ? '发送中...' : verifyCodeCountdown > 0 ? `${verifyCodeCountdown}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>
                {verifyCodeSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <Label className="text-xs text-muted-foreground">
                      验证码
                      {devVerifyCode && <span className="text-xs text-amber-600 font-mono ml-1">(开发验证码: {devVerifyCode})</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入验证码..."
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        className="h-9 text-sm flex-1"
                        maxLength={6}
                      />
                      <Button
                        className="h-9 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs"
                        disabled={verifyLoading}
                        onClick={handleVerifyEmail}
                      >
                        {verifyLoading ? '验证中...' : '验证新邮箱'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!emailVerified && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-700">邮箱未验证</p>
                      <p className="text-xs text-amber-600">验证后可使用全部功能，且不再弹出验证提示</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">邮箱地址</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="输入你的邮箱地址..."
                      value={verifyEmail}
                      onChange={(e) => { setVerifyEmail(e.target.value); setVerifyCodeSent(false); setDevVerifyCode('') }}
                      className="h-9 text-sm flex-1"
                    />
                    <Button
                      variant="outline"
                      className="h-9 px-3 shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                      disabled={verifyCodeLoading || verifyCodeCountdown > 0 || !verifyEmail.trim()}
                      onClick={handleSendVerifyCode}
                    >
                      {verifyCodeLoading ? '发送中...' : verifyCodeCountdown > 0 ? `${verifyCodeCountdown}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>
                {verifyCodeSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <Label className="text-xs text-muted-foreground">
                      验证码
                      {devVerifyCode && <span className="text-xs text-amber-600 font-mono ml-1">(开发验证码: {devVerifyCode})</span>}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入验证码..."
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        className="h-9 text-sm flex-1"
                        maxLength={6}
                      />
                      <Button
                        className="h-9 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs"
                        disabled={verifyLoading}
                        onClick={handleVerifyEmail}
                      >
                        {verifyLoading ? '验证中...' : '验证邮箱'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Effects Section ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-fuchsia-500" />
              特效展示
            </CardTitle>
            {globalEffect && (
              <Badge className="gap-1 bg-rose-500 text-white text-xs">
                <Sparkles className="h-3 w-3" /> 全场景: {effects.find(e => e.key === globalEffect)?.name}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Color Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">选择颜色</Label>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                <span className="text-xs font-mono text-muted-foreground">{color}</span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {EFFECT_COLORS.map((c) => (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setSelectedColor(c); if (globalEffect) setGlobalEffectColor(c) }}
                  className={`relative h-9 rounded-lg transition-all border-2 ${
                    selectedColor.value === c.value ? 'border-white shadow-lg scale-110' : 'border-transparent hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c.value, boxShadow: selectedColor.value === c.value ? `0 0 12px ${c.glow}` : undefined }}
                  title={c.name}
                >
                  {selectedColor.value === c.value && (
                    <Check className="h-3.5 w-3.5 absolute inset-0 m-auto text-white drop-shadow-md" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Effect Selector */}
          <div className="grid grid-cols-5 gap-2">
            {effects.map((fx) => {
              const Icon = fx.icon
              const isActive = activeEffect === fx.key
              return (
                <motion.button
                  key={fx.key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveEffect(fx.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                    isActive
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    {fx.name}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Effect Preview */}
          <motion.div
            key={activeEffect}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-0">
                {renderEffectPreview()}
              </CardContent>
            </Card>
          </motion.div>

          {/* Apply / Disable Button */}
          <div className="flex gap-3">
            <Button
              className={`flex-1 h-10 font-medium ${
                isAppliedGlobally
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
              }`}
              onClick={() => {
                if (isAppliedGlobally) {
                  setGlobalEffect(null)
                  toast.success('已关闭全场景特效')
                } else {
                  setGlobalEffect(activeEffect)
                  setGlobalEffectColor(selectedColor)
                  toast.success(`已将「${effects.find(e => e.key === activeEffect)?.name}」应用到全场景！`)
                }
              }}
            >
              {isAppliedGlobally ? (
                <><X className="h-4 w-4 mr-2" /> 关闭全场景特效</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> 应用到全场景</>
              )}
            </Button>
            {globalEffect && globalEffect !== activeEffect && (
              <Button
                variant="outline"
                className="h-10 border-rose-300 text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  setGlobalEffect(null)
                  toast.success('已关闭全场景特效')
                }}
              >
                <X className="h-4 w-4 mr-1" /> 关闭当前
              </Button>
            )}
          </div>

          {/* Custom Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5" /> 自定义颜色
            </Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="#ff6600"
                  value={color}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                      setSelectedColor({ name: '自定义', value: v, glow: v })
                      if (globalEffect) setGlobalEffectColor({ name: '自定义', value: v, glow: v })
                    }
                  }}
                  className="font-mono pr-12 h-9"
                />
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  const newColor = { name: '自定义', value: e.target.value, glow: e.target.value }
                  setSelectedColor(newColor)
                  if (globalEffect) setGlobalEffectColor(newColor)
                }}
                className="w-9 h-9 rounded-lg cursor-pointer border-0"
                title="选择自定义颜色"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Theme Colors ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-fuchsia-500" />
            🎨 主题颜色
          </CardTitle>
          <CardDescription className="text-xs">自定义按钮强调色和页面背景色</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Button Accent Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">按钮颜色</Label>
                <p className="text-xs text-muted-foreground">调整主按钮的强调色</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: buttonColor }} />
                <span className="text-xs font-mono text-muted-foreground">{buttonColor}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: '翡翠绿', value: '#10b981' },
                { name: '天空蓝', value: '#0ea5e9' },
                { name: '玫瑰红', value: '#f43f5e' },
                { name: '琥珀橙', value: '#f59e0b' },
                { name: '紫罗兰', value: '#8b5cf6' },
                { name: '青色', value: '#06b6d4' },
                { name: '粉色', value: '#ec4899' },
                { name: '石灰绿', value: '#84cc16' },
                { name: '红色', value: '#ef4444' },
                { name: '靛蓝', value: '#6366f1' },
                { name: '金色', value: '#eab308' },
                { name: '珊瑚色', value: '#fb923c' },
              ].map((c) => (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setButtonColor(c.value)}
                  className={`relative h-9 w-9 rounded-full transition-all border-2 ${
                    buttonColor === c.value ? 'border-white shadow-lg scale-110' : 'border-transparent hover:border-white/40'
                  }`}
                  style={{ backgroundColor: c.value, boxShadow: buttonColor === c.value ? `0 0 12px ${c.value}80` : undefined }}
                  title={c.name}
                >
                  {buttonColor === c.value && (
                    <Check className="h-3.5 w-3.5 absolute inset-0 m-auto text-white drop-shadow-md" />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="font-mono text-xs h-9 flex-1"
                placeholder="#ff6600"
                value={buttonColor}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) setButtonColor(v)
                }}
              />
              <input
                type="color"
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0"
                title="选择自定义颜色"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">预览:</span>
              <button
                className="h-9 px-5 rounded-xl text-white text-sm font-medium shadow-md btn-hover-lift"
                style={{
                  background: `linear-gradient(to right, ${buttonColor}, ${buttonColor})`,
                  boxShadow: `0 4px 14px ${buttonColor}40`,
                }}
              >
                按钮
              </button>
            </div>
          </div>

          <Separator />

          {/* Background Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">背景颜色</Label>
                <p className="text-xs text-muted-foreground">调整应用的整体背景色</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-slate-200 shadow-sm" style={{ backgroundColor: appBackgroundColor }} />
                <span className="text-xs font-mono text-muted-foreground">{appBackgroundColor}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: '纯白', value: '#ffffff' },
                { name: '象牙白', value: '#fffff0' },
                { name: '薄荷绿', value: '#f0fdf4' },
                { name: '淡蓝', value: '#eff6ff' },
                { name: '淡紫', value: '#faf5ff' },
                { name: '暖灰', value: '#f5f5f4' },
                { name: '深色', value: '#1c1917' },
                { name: '暗黑', value: '#0a0a0a' },
              ].map((c) => (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAppBackgroundColor(c.value)}
                  className={`relative h-9 w-9 rounded-full transition-all border-2 ${
                    appBackgroundColor === c.value ? 'border-white shadow-lg scale-110' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  style={{ backgroundColor: c.value, boxShadow: appBackgroundColor === c.value ? `0 0 12px ${c.value === '#ffffff' ? '#d1d5db' : c.value + '80'}` : undefined }}
                  title={c.name}
                >
                  {appBackgroundColor === c.value && (
                    <Check className={`h-3.5 w-3.5 absolute inset-0 m-auto drop-shadow-md ${['#1c1917', '#0a0a0a'].includes(c.value) ? 'text-white' : 'text-slate-700'}`} />
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="font-mono text-xs h-9 flex-1"
                placeholder="#f0f0f0"
                value={appBackgroundColor}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) setAppBackgroundColor(v)
                }}
              />
              <input
                type="color"
                value={appBackgroundColor}
                onChange={(e) => setAppBackgroundColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0"
                title="选择自定义颜色"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">预览:</span>
              <div
                className="h-9 flex-1 rounded-xl border border-slate-200"
                style={{ backgroundColor: appBackgroundColor }}
              />
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => {
                setButtonColor('#10b981')
                setAppBackgroundColor('#ffffff')
                toast.success('已恢复默认主题颜色')
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              恢复默认
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Basic Settings ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            基础设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Version */}
          <div className="py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Gem className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">应用版本</p>
                  <p className="text-xs text-muted-foreground">当前版本信息</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">v{CURRENT_VERSION}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              disabled={checkingUpdate}
              onClick={async () => {
                setCheckingUpdate(true)
                try {
                  const res = await fetch('/api/version/check')
                  if (res.ok) {
                    const data = await res.json()
                    setLatestVersion(data.latestVersion)
                    setUpdateChangelog(data.changelog || null)
                    if (data.latestVersion === CURRENT_VERSION) {
                      toast.success('当前已是最新版本！')
                    } else {
                      toast.info(`发现新版本: v${data.latestVersion}`)
                    }
                  } else {
                    toast.error('检查更新失败')
                  }
                } catch {
                  toast.error('网络错误，无法检查更新')
                } finally {
                  setCheckingUpdate(false)
                }
              }}
            >
              {checkingUpdate ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full" /> 检查中...</>
              ) : (
                <><Search className="h-3.5 w-3.5" /> 搜索最新版本</>
              )}
            </Button>
            {latestVersion && latestVersion !== CURRENT_VERSION && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">新版本可用: v{latestVersion}</span>
                </div>
                {updateChangelog && (
                  <p className="text-xs text-emerald-600/80 mt-1">{updateChangelog}</p>
                )}
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Current Effect Status */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-fuchsia-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-fuchsia-600" />
              </div>
              <div>
                <p className="text-sm font-medium">全场景特效</p>
                <p className="text-xs text-muted-foreground">
                  {globalEffect ? `已启用: ${effects.find(e => e.key === globalEffect)?.name}` : '未启用'}
                </p>
              </div>
            </div>
            <Switch
              checked={!!globalEffect}
              onCheckedChange={(checked) => {
                if (checked) {
                  setGlobalEffect(activeEffect)
                  setGlobalEffectColor(selectedColor)
                  toast.success(`已启用「${effects.find(e => e.key === activeEffect)?.name}」`)
                } else {
                  setGlobalEffect(null)
                  toast.success('已关闭全场景特效')
                }
              }}
            />
          </div>

          <Separator />

          {/* Membership Info */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${currentTier.color}15` }}
              >
                <TierIcon className="h-4 w-4" style={{ color: currentTier.color }} />
              </div>
              <div>
                <p className="text-sm font-medium">会员等级</p>
                <p className="text-xs text-muted-foreground">{currentTier.name} ({currentTier.nameEn})</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCurrentView('membership')}
            >
              查看详情
            </Button>
          </div>
        </CardContent>
      </Card>


      {/* ── Logout Section ── */}
      <Card className="border-red-100">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium">退出登录</p>
                <p className="text-xs text-muted-foreground">登出后需要重新登录才能使用</p>
              </div>
            </div>
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  登出
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认登出</AlertDialogTitle>
                  <AlertDialogDescription>
                    登出后，系统将清除当前登录状态。你需要重新登录才能继续使用会员商城的所有功能。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleLogout}
                  >
                    确认登出
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>


    </motion.div>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function AppFooter() {
  return (
    <footer className="mt-auto py-5 text-center bg-gradient-to-b from-transparent to-slate-50/80">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <div className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <Gem className="h-2.5 w-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-slate-400">会员商城</span>
      </div>
      <p className="text-[10px] text-slate-300">
        © 2026 All rights reserved
      </p>
    </footer>
  )
}

// ─── Flame icon (for checkin streak) ────────────────────────────────────────
// Use a simple inline since lucide-react doesn't have Flame in all versions

function Flame({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Home() {
  const {
    userId, setUserId, currentView, refreshUser, showAuthDialog, setShowAuthDialog,
    buttonColor, appBackgroundColor, isFrozen, frozenReason, emailVerified, isDeveloper,
    isBanned, bannedReason, isHighRisk,
  } = useAppStore()
  const [showSetup, setShowSetup] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [showReloadDialog, setShowReloadDialog] = useState(false)
  const [reloadMessage, setReloadMessage] = useState('')
  const [showFrozenDialog, setShowFrozenDialog] = useState(false)
  const [showEmailVerifyDialog, setShowEmailVerifyDialog] = useState(false)

  // Calculate if background is dark to auto-adjust text contrast
  const isDarkBg = useCallback((hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  }, [])

  // Calculate if button color is too similar to background
  const colorDistance = useCallback((hex1: string, hex2: string) => {
    const c1 = hex1.replace('#', '')
    const c2 = hex2.replace('#', '')
    const r1 = parseInt(c1.substring(0, 2), 16), g1 = parseInt(c1.substring(2, 4), 16), b1 = parseInt(c1.substring(4, 6), 16)
    const r2 = parseInt(c2.substring(0, 2), 16), g2 = parseInt(c2.substring(2, 4), 16), b2 = parseInt(c2.substring(4, 6), 16)
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
  }, [])

  // Apply custom theme colors as CSS custom properties
  useEffect(() => {
    const bgDark = isDarkBg(appBackgroundColor)
    const btnTooSimilar = colorDistance(buttonColor, appBackgroundColor) < 80

    // Determine effective button color - if too similar to background, auto-adjust
    let effectiveBtnColor = buttonColor
    if (btnTooSimilar) {
      // Invert brightness: if bg is dark, make button lighter; if bg is light, make button darker
      const c = buttonColor.replace('#', '')
      const r = parseInt(c.substring(0, 2), 16)
      const g = parseInt(c.substring(2, 4), 16)
      const b = parseInt(c.substring(4, 6), 16)
      if (bgDark) {
        effectiveBtnColor = `#${Math.min(255, r + 120).toString(16).padStart(2, '0')}${Math.min(255, g + 120).toString(16).padStart(2, '0')}${Math.min(255, b + 120).toString(16).padStart(2, '0')}`
      } else {
        effectiveBtnColor = `#${Math.max(0, r - 120).toString(16).padStart(2, '0')}${Math.max(0, g - 120).toString(16).padStart(2, '0')}${Math.max(0, b - 120).toString(16).padStart(2, '0')}`
      }
    }

    document.documentElement.style.setProperty('--custom-btn-from', effectiveBtnColor)
    document.documentElement.style.setProperty('--custom-btn-to', effectiveBtnColor)
    document.documentElement.style.setProperty('--custom-btn-shadow', `${effectiveBtnColor}40`)
    document.documentElement.style.setProperty('--custom-btn-shadow-hover', `${effectiveBtnColor}25`)
    document.documentElement.style.setProperty('--custom-bg', appBackgroundColor)

    // Set text color based on background brightness
    if (bgDark) {
      document.documentElement.style.setProperty('--custom-text-primary', '#f5f5f5')
      document.documentElement.style.setProperty('--custom-text-secondary', '#a1a1aa')
      document.documentElement.style.setProperty('--custom-text-muted', '#71717a')
      document.documentElement.classList.add('dark-bg-mode')
    } else {
      document.documentElement.style.setProperty('--custom-text-primary', '#18181b')
      document.documentElement.style.setProperty('--custom-text-secondary', '#3f3f46')
      document.documentElement.style.setProperty('--custom-text-muted', '#71717a')
      document.documentElement.classList.remove('dark-bg-mode')
    }
  }, [buttonColor, appBackgroundColor, isDarkBg, colorDistance])

  // Initialize user from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      setUserId(storedUserId)
      refreshUser().finally(() => { setInitialized(true) })
    } else {
      // Use microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setInitialized(true)
        setShowSetup(true)
      })
    }
  }, [])

  // When user logs out (userId becomes null), show the auth dialog
  useEffect(() => {
    if (initialized && !userId) {
      queueMicrotask(() => setShowSetup(true))
    }
  }, [userId, initialized])

  // Auto Cloud Backup - only for developers, every 30 seconds
  useEffect(() => {
    if (!userId || !isDeveloper) return
    let backupInterval: ReturnType<typeof setInterval> | null = null
    const performAutoBackup = async () => {
      try {
        await fetch('/api/cloud-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force: false }),
        })
      } catch {}
    }
    const startBackup = setTimeout(() => {
      performAutoBackup()
      backupInterval = setInterval(performAutoBackup, 30000)
    }, 10000)
    return () => {
      clearTimeout(startBackup)
      if (backupInterval) clearInterval(backupInterval)
    }
  }, [userId, isDeveloper])

  // Periodic User Data Sync - every 5 seconds
  useEffect(() => {
    if (!userId) return
    let syncInterval: ReturnType<typeof setInterval> | null = null
    const startSync = setTimeout(() => {
      syncInterval = setInterval(() => {
        refreshUser()
      }, 5000)
    }, 3000)
    return () => {
      clearTimeout(startSync)
      if (syncInterval) clearInterval(syncInterval)
    }
  }, [userId, refreshUser])

  // Restore Status Polling - check every 5 seconds
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let pageLoadTime = new Date().toISOString()
    const checkRestoreStatus = async () => {
      try {
        const res = await fetch('/api/restore-status')
        if (res.ok) {
          const data = await res.json()
          if (data.lastRestore && data.lastRestore > pageLoadTime) {
            setReloadMessage(data.message || '更新已完成，请您重新加载页面')
            setShowReloadDialog(true)
          }
        }
      } catch {}
    }
    const startPolling = setTimeout(() => {
      checkRestoreStatus()
      pollInterval = setInterval(checkRestoreStatus, 5000)
    }, 3000)
    return () => {
      clearTimeout(startPolling)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  // Frozen Account Dialog
  useEffect(() => {
    if (isFrozen && userId && !isDeveloper) {
      queueMicrotask(() => setShowFrozenDialog(true))
    }
  }, [isFrozen, userId, isDeveloper])

  // Banned Account Dialog - check on mount and on state change
  useEffect(() => {
    if (isBanned && userId) {
      queueMicrotask(() => {/* banned dialog is always shown */})
      // Force banned users to home view
      if (currentView !== 'home') {
        useAppStore.getState().setCurrentView('home')
      }
    }
  }, [isBanned, userId, currentView])

  // Email Verify Dialog for Old Accounts
  useEffect(() => {
    if (userId && !emailVerified && initialized && !isDeveloper) {
      queueMicrotask(() => setShowEmailVerifyDialog(true))
    }
  }, [userId, emailVerified, initialized, isDeveloper])

  const renderView = () => {
    switch (currentView) {
      case 'membership':
        return <MembershipCenter />
      case 'checkin':
        return <DailyCheckIn />
      case 'shop':
        return <ProductShop />
      case 'cart':
        return <ShoppingCartView />
      case 'myorders':
        return <MyOrders />
      case 'tracking':
        return <OrderTracking />
      case 'wallet':
        return <VirtualWallet />
      case 'coupons':
        return <CouponsPanel />
      case 'effects':
        return <EffectsShowcase />
      case 'settings':
        return <SettingsPanel />
      case 'developer':
        return <DeveloperPortal />
      case 'invite':
        return <InvitePanel />
      case 'friends':
        return <FriendsPanel />
      case 'chat':
        return <ChatPanel />
      case 'aiservice':
        return <AIServiceChat />
      default:
        return <HomeGrid />
    }
  }

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Banned user - only show banned dialog, block all other UI
  if (isBanned && userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6 shadow-lg">
          <Shield className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">账号已被封禁</h2>
        <p className="text-sm text-muted-foreground mb-2 max-w-xs text-center">
          您的账号已被管理员封禁，无法使用任何功能。
        </p>
        {bannedReason && (
          <p className="text-sm text-red-500 font-medium mb-4">原因：{bannedReason}</p>
        )}
        <p className="text-xs text-muted-foreground mb-6">如需解封请联系管理员。</p>
        <Button variant="destructive" onClick={() => { useAppStore.getState().logout(); useAppStore.getState().setShowAuthDialog(true); }}>
          退出登录
        </Button>
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" /> 账号已被封禁
              </DialogTitle>
              <DialogDescription>
                您的账号已被管理员封禁，无法使用任何功能。
                {bannedReason && <span className="block mt-2 text-red-500 font-medium">原因：{bannedReason}</span>}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={() => { useAppStore.getState().logout(); useAppStore.getState().setShowAuthDialog(true); }}>
                退出登录
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: appBackgroundColor }}>
      <GlobalEffectOverlay />
      <AppHeader />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 relative z-10">
        {userId ? (
          <AnimatePresence mode="wait">
            <div key={currentView}>
              {renderView()}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50">
              <Lock className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">请先登录</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              登录你的账户后即可使用会员商城的全部功能
            </p>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-11 px-8 shadow-md shadow-emerald-500/25 btn-hover-lift"
              onClick={() => setShowAuthDialog(true)}
            >
              <User className="h-4 w-4 mr-2" />
              登录 / 注册
            </Button>
            <Button
              variant="outline"
              className="mt-3 h-9 px-6 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowAuthDialog(true)}
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              备用登录入口
            </Button>
          </motion.div>
        )}
      </main>
      <AppFooter />
      <AuthDialog open={showSetup || showAuthDialog} onClose={() => { setShowSetup(false); setShowAuthDialog(false) }} />

      {/* Reload Dialog - when cloud restore happens */}
      <Dialog open={showReloadDialog} onOpenChange={setShowReloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-sky-500" />
              数据已更新
            </DialogTitle>
            <DialogDescription>
              {reloadMessage || '更新已完成，请您重新加载页面'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600">
              重新加载
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banned Account Dialog - highest priority, blocks everything */}
      <Dialog open={isBanned && !!userId} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" /> 账号已被封禁
            </DialogTitle>
            <DialogDescription>
              您的账号已被管理员封禁，无法使用任何功能。
              {bannedReason && <span className="block mt-2 text-red-500 font-medium">原因：{bannedReason}</span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => { useAppStore.getState().logout(); useAppStore.getState().setShowAuthDialog(true); }}>
              退出登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Frozen Account Dialog */}
      <Dialog open={showFrozenDialog} onOpenChange={setShowFrozenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              账户已被冻结
            </DialogTitle>
            <DialogDescription>
              {frozenReason || '你的账户已被管理员冻结，如有疑问请联系客服。'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFrozenDialog(false)}>
              我知道了
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Verify Dialog for Old Accounts */}
      <Dialog open={showEmailVerifyDialog} onOpenChange={setShowEmailVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" />
              请验证邮箱
            </DialogTitle>
            <DialogDescription>
              为了账户安全，请验证你的邮箱地址。验证后即可正常使用所有功能。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>提示</Label>
              <p className="text-sm text-muted-foreground">请前往设置页面完成邮箱验证，或联系管理员获取帮助。</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEmailVerifyDialog(false)} className="flex-1">
              稍后验证
            </Button>
            <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" onClick={() => { setShowEmailVerifyDialog(false); useAppStore.getState().setCurrentView('settings') }}>
              前往设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
