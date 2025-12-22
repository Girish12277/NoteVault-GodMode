export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  degree?: string;
  specialization?: string;
  university?: string;
  universityId?: string;
  college?: string;
  semester?: number;
  bio?: string;
  location?: any; // JSON type from DB, typically null or object
  is_seller: boolean;
  universityName?: string;
  phone?: string;
  preferredLanguage: 'en' | 'hi';
  role: 'buyer' | 'seller' | 'admin';
  createdAt: Date;
  purchasedNoteIds?: string[];
}

export interface Post {
  id: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  likes: number;
  createdAt: string;
  sellerId: string;
  seller?: {
    name: string;
    avatar: string;
  };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    full_name: string;
    profile_picture_url: string;
  };
}
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  degree?: 'BTech' | 'BSc' | 'BA' | 'BCom' | 'BBA' | 'MSc' | 'MTech' | 'MBA' | 'PhD';  // OPTIONAL (filled via onboarding)
  collegeName?: string;      // OPTIONAL (filled via onboarding)
  currentSemester?: number;  // OPTIONAL (filled via onboarding)
  referralCode?: string;
}

export interface Note {
  id: string;
  title: string;
  description: string;
  subject: string;
  degree: string;
  specialization: string;
  university: string;
  college: string;
  semester: number;
  language: 'en' | 'hi' | 'both';
  price: number;
  pages: number;
  format: 'pdf' | 'docx';
  coverImage: string;
  previewPages: string[];
  tableOfContents: string[];
  sellerId: string;
  sellerName: string;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Review {
  id: string;
  noteId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export interface CartItem {
  noteId: string;
  note: Note;
  addedAt: Date;
}

export interface WishlistItem {
  noteId: string;
  note: Note;
  addedAt: Date;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  noteId: string;
  amount: number;
  commission: number;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  paymentMethod: string;
  watermarkId: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface SellerWallet {
  sellerId: string;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnAmount: number;
}

export interface Category {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  icon: string;
  count: number;
}

export interface University {
  id: string;
  name: string;
  location: string;
  colleges: College[];
}

export interface College {
  id: string;
  name: string;
  universityId: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  scope: 'GLOBAL' | 'CATEGORY' | 'SELLER' | 'NOTE';
}

export interface CouponValidationResponse {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
  message?: string;
  couponId?: string;
  code?: string;
}
