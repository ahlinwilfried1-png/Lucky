import { db } from "./firebase.js";
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";

// Helper state
let isFirebaseLoadedMockState = true;

// 1. Load entire database state from Firebase Firestore
export async function loadStateFromSupabase(): Promise<any> {
  try {
    console.log("iAgri Firebase: Loading state from cloud Firestore...");
    
    const [
      uSnap, pSnap, iSnap, dSnap, wSnap, cSnap, tSnap, nSnap, bSnap, sSnap
    ] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "products")),
      getDocs(collection(db, "investments")),
      getDocs(collection(db, "deposits")),
      getDocs(collection(db, "withdrawals")),
      getDocs(collection(db, "referral_commissions")),
      getDocs(collection(db, "tickets")),
      getDocs(collection(db, "notifications")),
      getDocs(collection(db, "bonus_codes")),
      getDocs(collection(db, "settings"))
    ]);

    const users = uSnap.docs.map(doc => {
      const u = doc.data();
      return {
        id: u.id,
        name: u.name,
        whatsapp: u.whatsapp,
        country: u.country || "Togo",
        passwordHash: u.password_hash || u.passwordHash || "",
        balance: Number(u.balance || 0),
        dailyEarnings: Number(u.daily_earnings || u.dailyEarnings || 0),
        totalEarnings: Number(u.total_earnings || u.totalEarnings || 0),
        totalDeposits: Number(u.total_deposits || u.totalDeposits || 0),
        totalWithdrawals: Number(u.total_withdrawals || u.totalWithdrawals || 0),
        status: u.status || "active",
        referralCode: u.referral_code || u.referralCode || "",
        referredByCode: u.referred_by_code || u.referredByCode || null,
        bonusPoints: Number(u.bonus_points || u.bonusPoints || 0),
        created_at: u.created_at || new Date().toISOString(),
        isAdmin: !!u.is_admin || !!u.isAdmin,
        lastDailyCheckin: u.last_daily_checkin || u.lastDailyCheckin || null
      };
    });

    const products = pSnap.docs.map(doc => {
      const p = doc.data();
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        dailyReturn: Number(p.daily_return || p.dailyReturn || 0),
        durationDays: Number(p.duration_days || p.durationDays || 10),
        totalReturn: Number(p.total_return || p.totalReturn || 0),
        badge: p.badge || undefined,
        maxPurchaseCount: p.max_purchase_count !== undefined ? Number(p.max_purchase_count) : 3,
        isBlocked: !!p.is_blocked || !!p.isBlocked
      };
    });

    // Seed default products to Firebase if none exist
    if (products.length === 0) {
      console.log("iAgri Firebase: No products found, seeding default agricultural VIP packages...");
      const defaultProducts = [
        { id: "vip-1", name: "VIP 1 (Élevage de Poules) 🐔", price: 5000, dailyReturn: 400, durationDays: 15, totalReturn: 6000, badge: "Populaire", maxPurchaseCount: 10 },
        { id: "vip-2", name: "VIP 2 (Cultures Maraîchères) 🍅", price: 10000, dailyReturn: 900, durationDays: 15, totalReturn: 13500, badge: "Recommandé", maxPurchaseCount: 5 },
        { id: "vip-3", name: "VIP 3 (Plantation d'Ananas) 🍍", price: 25000, dailyReturn: 2400, durationDays: 15, totalReturn: 36000, badge: "Rentable", maxPurchaseCount: 3 },
        { id: "vip-4", name: "VIP 4 (Ferme Bovine Moderne) 🐄", price: 50000, dailyReturn: 5200, durationDays: 15, totalReturn: 78000, maxPurchaseCount: 2 },
        { id: "vip-5", name: "VIP 5 (Énergie Solaire iAgri) ☀️", price: 100000, dailyReturn: 11000, durationDays: 15, totalReturn: 165000, badge: "Élite", maxPurchaseCount: 1 }
      ];
      await Promise.all(defaultProducts.map(p => setDoc(doc(db, "products", p.id), p)));
      return loadStateFromSupabase(); // Re-load after seeding
    }

    const investments = iSnap.docs.map(doc => {
      const inv = doc.data();
      return {
        id: inv.id,
        userId: inv.user_id || inv.userId,
        planId: inv.plan_id || inv.planId,
        planName: inv.plan_name || inv.planName,
        price: Number(inv.price || 0),
        dailyReturn: Number(inv.daily_return || inv.dailyReturn || 0),
        totalWeeks: Number(inv.total_weeks || inv.totalWeeks || 1),
        daysActive: Number(inv.days_active || inv.daysActive || 0),
        totalReturn: Number(inv.total_return || inv.totalReturn || 0),
        purchaseDate: inv.purchase_date || inv.purchaseDate,
        lastClaimDate: inv.last_claim_date || inv.lastClaimDate,
        durationDays: Number(inv.duration_days || inv.durationDays || 10)
      };
    });

    const deposits = dSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: d.id,
        userId: d.user_id || d.userId,
        whatsapp: d.whatsapp,
        amount: Number(d.amount || 0),
        reference: d.reference || "",
        paymentCapture: d.payment_capture || d.paymentCapture || "",
        provider: d.provider,
        status: d.status || "pending",
        date: d.date
      };
    });

    const withdrawals = wSnap.docs.map(doc => {
      const w = doc.data();
      return {
        id: w.id,
        userId: w.user_id || w.userId,
        whatsapp: w.whatsapp,
        amount: Number(w.amount || 0),
        provider: w.provider,
        status: w.status || "pending",
        date: w.date,
        paymentProof: w.payment_proof || w.paymentProof || ""
      };
    });

    const referralCommissions = cSnap.docs.map(doc => {
      const c = doc.data();
      return {
        id: c.id,
        fromUserId: c.from_user_id || c.fromUserId,
        toUserId: c.to_user_id || c.toUserId,
        amount: Number(c.amount || 0),
        level: Number(c.level || 1),
        date: c.date
      };
    });

    const tickets = tSnap.docs.map(doc => {
      const t = doc.data();
      return {
        id: t.id,
        userId: t.user_id || t.userId,
        sender: t.sender || "user",
        message: t.message || "",
        date: t.date
      };
    });

    const notifications = nSnap.docs.map(doc => {
      const n = doc.data();
      return {
        id: n.id,
        userId: n.user_id || n.userId,
        title: n.title || "",
        message: n.message || "",
        date: n.date,
        readBy: Array.isArray(n.read_by || n.readBy) ? (n.read_by || n.readBy) : []
      };
    });

    const bonusCodes = bSnap.docs.map(doc => {
      const b = doc.data();
      return {
        code: b.code,
        amount: Number(b.amount || 0),
        claimedBy: Array.isArray(b.claimed_by || b.claimedBy) ? (b.claimed_by || b.claimedBy) : [],
        created_by: b.created_by || b.createdBy || "admin-master",
        usageLimit: b.usage_limit || b.usageLimit || 100
      };
    });

    const settingsRow = sSnap.docs.length > 0 ? sSnap.docs[0].data() : null;
    const settings = settingsRow ? {
      whatsappGroupLink: settingsRow.whatsapp_group_link || settingsRow.whatsappGroupLink,
      telegramChannelLink: settingsRow.telegram_channel_link || settingsRow.telegramChannelLink
    } : {
      whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: "https://t.me/InvestaPremiumCanal"
    };

    console.log(`iAgri Firebase SUCCESS: Loaded ${users.length} users, ${products.length} products, and ${deposits.length} deposits.`);
    return {
      users,
      products,
      investments,
      deposits,
      withdrawals,
      referralCommissions,
      tickets,
      notifications,
      bonusCodes,
      settings
    };
  } catch (err: any) {
    console.error("iAgri Firebase core load state failed:", err.message);
    return null;
  }
}

// 2. Save entire State to Firebase Firestore
export async function saveStateToSupabase(state: any): Promise<boolean> {
  try {
    console.log("iAgri Firebase: Saving state to cloud Firestore...");
    const promises: Promise<void>[] = [];

    // Save users
    if (state.users && state.users.length > 0) {
      state.users.forEach((u: any) => {
        const docRef = doc(db, "users", String(u.id));
        promises.push(setDoc(docRef, {
          id: u.id,
          name: u.name,
          whatsapp: u.whatsapp,
          country: u.country || "Togo",
          password_hash: u.passwordHash || u.password_hash || "",
          balance: Number(u.balance || 0),
          daily_earnings: Number(u.dailyEarnings || u.daily_earnings || 0),
          total_earnings: Number(u.totalEarnings || u.total_earnings || 0),
          total_deposits: Number(u.totalDeposits || u.total_deposits || 0),
          total_withdrawals: Number(u.totalWithdrawals || u.total_withdrawals || 0),
          status: u.status || "active",
          referral_code: u.referralCode || u.referral_code || "",
          referred_by_code: u.referredByCode || u.referred_by_code || null,
          bonus_points: Number(u.bonusPoints || u.bonus_points || 0),
          created_at: u.created_at || new Date().toISOString(),
          is_admin: !!u.isAdmin || !!u.is_admin,
          last_daily_checkin: u.lastDailyCheckin || u.last_daily_checkin || null
        }, { merge: true }));
      });
    }

    // Save products
    if (state.products && state.products.length > 0) {
      state.products.forEach((p: any) => {
        const docRef = doc(db, "products", String(p.id));
        promises.push(setDoc(docRef, {
          id: p.id,
          name: p.name,
          price: Number(p.price || 0),
          daily_return: Number(p.dailyReturn || p.daily_return || 0),
          duration_days: Number(p.durationDays || p.duration_days || 10),
          total_return: Number(p.totalReturn || p.total_return || 0),
          badge: p.badge || null,
          max_purchase_count: p.maxPurchaseCount !== undefined ? Number(p.maxPurchaseCount) : 3,
          is_blocked: !!p.isBlocked || !!p.is_blocked
        }, { merge: true }));
      });
    }

    // Save investments
    if (state.investments && state.investments.length > 0) {
      state.investments.forEach((inv: any) => {
        const docRef = doc(db, "investments", String(inv.id));
        promises.push(setDoc(docRef, {
          id: inv.id,
          user_id: inv.userId || inv.user_id,
          plan_id: inv.planId || inv.plan_id || null,
          plan_name: inv.planName || inv.plan_name,
          price: Number(inv.price || 0),
          daily_return: Number(inv.dailyReturn || inv.daily_return || 0),
          total_weeks: Number(inv.totalWeeks || inv.total_weeks || 1),
          days_active: Number(inv.daysActive || inv.days_active || 0),
          total_return: Number(inv.totalReturn || inv.total_return || 0),
          purchase_date: inv.purchaseDate || inv.purchase_date,
          last_claim_date: inv.lastClaimDate || inv.last_claim_date,
          duration_days: Number(inv.durationDays || inv.duration_days || 10)
        }, { merge: true }));
      });
    }

    // Save deposits
    if (state.deposits && state.deposits.length > 0) {
      state.deposits.forEach((d: any) => {
        const docRef = doc(db, "deposits", String(d.id));
        promises.push(setDoc(docRef, {
          id: d.id,
          user_id: d.userId || d.user_id,
          whatsapp: d.whatsapp,
          amount: Number(d.amount || 0),
          reference: d.reference || null,
          payment_capture: d.paymentCapture || d.payment_capture || null,
          provider: d.provider,
          status: d.status || "pending",
          date: d.date
        }, { merge: true }));
      });
    }

    // Save withdrawals
    if (state.withdrawals && state.withdrawals.length > 0) {
      state.withdrawals.forEach((w: any) => {
        const docRef = doc(db, "withdrawals", String(w.id));
        promises.push(setDoc(docRef, {
          id: w.id,
          user_id: w.userId || w.user_id,
          whatsapp: w.whatsapp,
          amount: Number(w.amount || 0),
          provider: w.provider,
          status: w.status || "pending",
          date: w.date,
          payment_proof: w.paymentProof || w.payment_proof || null
        }, { merge: true }));
      });
    }

    // Save referral commissions
    if (state.referralCommissions && state.referralCommissions.length > 0) {
      state.referralCommissions.forEach((c: any) => {
        const docRef = doc(db, "referral_commissions", String(c.id));
        promises.push(setDoc(docRef, {
          id: c.id,
          from_user_id: c.fromUserId || c.from_user_id,
          to_user_id: c.toUserId || c.to_user_id,
          amount: Number(c.amount || 0),
          level: Number(c.level || 1),
          date: c.date
        }, { merge: true }));
      });
    }

    // Save tickets
    if (state.tickets && state.tickets.length > 0) {
      state.tickets.forEach((t: any) => {
        const docRef = doc(db, "tickets", String(t.id));
        promises.push(setDoc(docRef, {
          id: t.id,
          user_id: t.userId || t.user_id,
          sender: t.sender || "user",
          message: t.message,
          date: t.date
        }, { merge: true }));
      });
    }

    // Save notifications
    if (state.notifications && state.notifications.length > 0) {
      state.notifications.forEach((n: any) => {
        const docRef = doc(db, "notifications", String(n.id));
        promises.push(setDoc(docRef, {
          id: n.id,
          user_id: n.userId || n.user_id,
          title: n.title,
          message: n.message,
          date: n.date,
          read_by: Array.isArray(n.readBy || n.read_by) ? (n.readBy || n.read_by) : []
        }, { merge: true }));
      });
    }

    // Save bonus codes
    if (state.bonusCodes && state.bonusCodes.length > 0) {
      state.bonusCodes.forEach((b: any) => {
        const docRef = doc(db, "bonus_codes", String(b.code));
        promises.push(setDoc(docRef, {
          code: b.code,
          amount: Number(b.amount || 0),
          claimed_by: Array.isArray(b.claimedBy || b.claimed_by) ? (b.claimedBy || b.claimed_by) : [],
          created_by: b.created_by || b.createdBy || "admin-master",
          usage_limit: b.usageLimit || b.usage_limit || 100
        }, { merge: true }));
      });
    }

    // Save global settings
    if (state.settings) {
      const docRef = doc(db, "settings", "primary");
      promises.push(setDoc(docRef, {
        id: "primary",
        whatsapp_group_link: state.settings.whatsappGroupLink,
        telegram_channel_link: state.settings.telegramChannelLink
      }, { merge: true }));
    }

    await Promise.all(promises);
    return true;
  } catch (err: any) {
    console.error("iAgri Firebase save warning:", err.message);
    return false;
  }
}

export async function deleteProductFromSupabase(productId: string) {
  try {
    await deleteDoc(doc(db, "products", productId));
  } catch (e) {
    console.error("Firebase delete product failed", e);
  }
}

export async function deleteUserFromSupabase(userId: string) {
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (e) {
    console.error("Firebase delete user failed", e);
  }
}

// 3. Client-side Realtime Adapter mockup of Supabase Channels powered natively by Firestore listens
export const supabase: any = {
  channel(channelName: string) {
    let callbackRef: ((payload: any) => void) | null = null;
    let unsubscribeFn: (() => void) | null = null;

    return {
      on(event: string, filter: any, callback: (payload: any) => void) {
        callbackRef = callback;
        const table = filter.table;
        
        if (table === "users") {
          const uId = filter.filter ? filter.filter.split("eq.")[1] : null;
          if (uId) {
            unsubscribeFn = onSnapshot(doc(db, "users", uId), (docSnap) => {
              if (docSnap.exists() && callbackRef) {
                const u = docSnap.data();
                callbackRef({
                  new: {
                    id: u.id,
                    name: u.name,
                    whatsapp: u.whatsapp,
                    country: u.country,
                    password_hash: u.password_hash,
                    balance: Number(u.balance || 0),
                    daily_earnings: Number(u.daily_earnings || 0),
                    total_earnings: Number(u.total_earnings || 0),
                    total_deposits: Number(u.total_deposits || 0),
                    total_withdrawals: Number(u.total_withdrawals || 0),
                    status: u.status || "active",
                    referral_code: u.referral_code,
                    referred_by_code: u.referred_by_code || null,
                    bonus_points: Number(u.bonus_points || 0),
                    last_daily_checkin: u.last_daily_checkin || null
                  }
                });
              }
            });
          } else {
            // General users snapshot (for admin view)
            unsubscribeFn = onSnapshot(collection(db, "users"), () => {
              if (callbackRef) callbackRef({ new: {} });
            });
          }
        } 
        else if (table === "tickets") {
          const uId = filter.filter ? filter.filter.split("eq.")[1] : null;
          if (uId) {
            // User-specific support tickets
            const q = query(collection(db, "tickets"), where("user_id", "==", uId));
            unsubscribeFn = onSnapshot(q, () => {
              if (callbackRef) callbackRef({ new: {} });
            });
          } else {
            // All tickets (admin)
            unsubscribeFn = onSnapshot(collection(db, "tickets"), () => {
              if (callbackRef) callbackRef({ new: {} });
            });
          }
        } 
        else if (table === "notifications") {
          unsubscribeFn = onSnapshot(collection(db, "notifications"), (colSnap) => {
            colSnap.docChanges().forEach((change) => {
              if (change.type === "added" && callbackRef) {
                const n = change.doc.data();
                callbackRef({
                  new: {
                    id: n.id,
                    user_id: n.user_id,
                    title: n.title,
                    message: n.message,
                    date: n.date,
                    read_by: n.read_by || []
                  }
                });
              }
            });
          });
        }
        else if (table === "deposits") {
          unsubscribeFn = onSnapshot(collection(db, "deposits"), () => {
            if (callbackRef) callbackRef({ new: {} });
          });
        }
        else if (table === "withdrawals") {
          unsubscribeFn = onSnapshot(collection(db, "withdrawals"), () => {
            if (callbackRef) callbackRef({ new: {} });
          });
        }

        return this;
      },
      subscribe() {
        console.log(`[Firebase Adapter] Subscribed to real-time events for channel: ${channelName}`);
        return {
          unsubscribe() {
            if (unsubscribeFn) {
              unsubscribeFn();
              console.log(`[Firebase Adapter] Unsubscribed channel: ${channelName}`);
            }
          }
        };
      }
    };
  },
  removeChannel(chan: any) {
    if (chan && typeof chan.unsubscribe === "function") {
      chan.unsubscribe();
    }
  },
  from(tableName: string) {
    return {
      async select(fields?: string) {
        try {
          const colSnap = await getDocs(collection(db, tableName));
          const data = colSnap.docs.map(doc => {
            const row = doc.data();
            // Map settings standard for select tests
            if (tableName === "users") {
              return {
                id: row.id,
                name: row.name,
                whatsapp: row.whatsapp,
                balance: Number(row.balance || 0),
                created_at: row.created_at || new Date().toISOString()
              };
            }
            return row;
          });
          return { data, error: null };
        } catch (err: any) {
          console.error(`[Firebase Adapter] select fail on ${tableName}:`, err);
          return { data: null, error: err };
        }
      }
    };
  }
};
