export interface User {
  id: string;
  name: string;
  whatsapp: string;
  country: string;
  balance: number;
  dailyEarnings: number;
  totalEarnings: number;
  totalDeposits: number;
  totalWithdrawals: number;
  status: "active" | "blocked";
  referralCode: string;
  referredByCode: string | null;
  created_at: string;
  isAdmin?: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  dailyReturn: number;
  totalWeeks: number;
  daysActive: number;
  totalReturn: number;
  purchaseDate: string;
  lastClaimDate: string;
}

export interface Deposit {
  id: string;
  userId: string;
  whatsapp: string;
  amount: number;
  reference: string;
  paymentCapture: string;
  provider: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  userName?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  whatsapp: string;
  amount: number;
  provider: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  userName?: string;
  userBalance?: number;
}

export interface ReferralStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalInvited: number;
  bonusEarned: number;
  level1List: Array<{ name: string; date: string; country: string; status: string }>;
  level2List: Array<{ name: string; date: string; country: string; status: string }>;
  level3List: Array<{ name: string; date: string; country: string; status: string }>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: "user" | "admin";
  message: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  dailyReturn: number;
  durationDays: number;
  totalReturn: number;
  badge?: string;
  maxPurchaseCount?: number;
}

export interface BonusCode {
  code: string;
  amount: number;
  claimedBy: string[];
}
