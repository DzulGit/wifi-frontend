// ── User ─────────────────────────────────────────────────────
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export interface User {
  id: string
  fullName: string
  email: string | null
  phone: string
  address: string
  district: string | null
  city: string | null
  province: string | null
  customerCode: string
  status: UserStatus
  packageId: string | null
  package?: Package
  activatedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── Admin ─────────────────────────────────────────────────────
export type AdminRole = 'SUPERADMIN' | 'ADMIN' | 'TECHNICIAN'

export interface Admin {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
}

// ── Package ───────────────────────────────────────────────────
export interface Package {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  speedDown: number
  speedUp: number
  isUnlimited: boolean
  features: string[]
  isActive: boolean
  isPopular: boolean
  color: string | null
  sortOrder: number
  _count?: { users: number }
}

// ── Registration ──────────────────────────────────────────────
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Registration {
  id: string
  fullName: string
  phone: string
  email: string | null
  address: string
  city: string | null
  packageId: string
  status: RegistrationStatus
  rejectedReason: string | null
  approvedAt: string | null
  createdAt: string
}

// ── Invoice ───────────────────────────────────────────────────
export type InvoiceStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface Invoice {
  id: string
  invoiceNumber: string
  userId: string
  packageId: string
  amount: number
  penaltyAmount: number
  totalAmount: number
  billingMonth: number
  billingYear: number
  dueDate: string
  status: InvoiceStatus
  paidAt: string | null
  user?: Partial<User>
  package?: Partial<Package>
  payments?: Payment[]
  createdAt: string
}

// ── Payment ───────────────────────────────────────────────────
export type PaymentMethod = 'BANK_TRANSFER' | 'QRIS' | 'CASH' | 'AUTO_GATEWAY'
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface Payment {
  id: string
  paymentCode: string
  invoiceId: string
  userId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  proofImageUrl: string | null
  notes: string | null
  rejectedReason: string | null
  processedAt: string | null
  invoice?: Partial<Invoice>
  user?: Partial<User>
  createdAt: string
}

// ── Ticket ────────────────────────────────────────────────────
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Ticket {
  id: string
  ticketNumber: string
  userId: string
  title: string
  description: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  attachmentUrl: string | null
  resolvedAt: string | null
  user?: Partial<User>
  replies?: TicketReply[]
  _count?: { replies: number }
  createdAt: string
}

export interface TicketReply {
  id: string
  ticketId: string
  message: string
  isFromAdmin: boolean
  adminId: string | null
  admin?: Partial<Admin>
  createdAt: string
}

// ── API Response ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
}