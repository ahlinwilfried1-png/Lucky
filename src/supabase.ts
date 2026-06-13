import { createClient } from "@supabase/supabase-js";

// Supabase API Secrets config compatible with Node and Client runtimes
const supabaseUrl = (typeof process !== "undefined" && process?.env?.SUPABASE_URL) || 
                    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_SUPABASE_URL) || 
                    "https://opgtmssgdsjhxjqywgyh.supabase.co";

const supabaseKey = (typeof process !== "undefined" && process?.env?.SUPABASE_KEY) || 
                    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_SUPABASE_KEY) || 
                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ3Rtc3NnZHNqaHhqcXl3Z3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyOTU1NSwiZXhwIjoyMDk2OTA1NTU1fQ.8NeQ77-B8A_K2xTzEPkdxfPLJbhKYL0uDAUm-aQNuOo";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Determines if Supabase can be connected and has correct relational tables
let isSupabaseLoadedMockState = false;

// Convert/Format entities consistently between Memory and Supabase
export async function loadStateFromSupabase(): Promise<any> {
  try {
    const [
      uRes, pRes, iRes, dRes, wRes, cRes, tRes, nRes, bRes, sRes
    ] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("products").select("*"),
      supabase.from("investments").select("*"),
      supabase.from("deposits").select("*"),
      supabase.from("withdrawals").select("*"),
      supabase.from("referral_commissions").select("*"),
      supabase.from("tickets").select("*"),
      supabase.from("notifications").select("*"),
      supabase.from("bonus_codes").select("*"),
      supabase.from("settings").select("*")
    ]);

    // Check if table users is missing
    if (uRes.error && (uRes.error.code === "PGRST205" || uRes.error.message.includes("does not exist"))) {
      console.warn("iAgri Supabase: Base tables are missing. Please execute the SQL schema in your Supabase SQL Editor.");
      return null;
    }

    // Explicitly log any table query errors for diagnostic visibility in logs
    if (uRes.error) console.error("iAgri Supabase load warning (users):", uRes.error);
    if (pRes.error) console.error("iAgri Supabase load warning (products):", pRes.error);
    if (iRes.error) console.error("iAgri Supabase load warning (investments):", iRes.error);
    if (dRes.error) console.error("iAgri Supabase load warning (deposits):", dRes.error);
    if (wRes.error) console.error("iAgri Supabase load warning (withdrawals):", wRes.error);
    if (cRes.error) console.error("iAgri Supabase load warning (referral_commissions):", cRes.error);
    if (tRes.error) console.error("iAgri Supabase load warning (tickets):", tRes.error);
    if (nRes.error) console.error("iAgri Supabase load warning (notifications):", nRes.error);
    if (bRes.error) console.error("iAgri Supabase load warning (bonus_codes):", bRes.error);
    if (sRes.error) console.error("iAgri Supabase load warning (settings):", sRes.error);

    const users = (uRes.data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      whatsapp: u.whatsapp,
      country: u.country,
      passwordHash: u.password_hash,
      balance: Number(u.balance || 0),
      dailyEarnings: Number(u.daily_earnings || 0),
      totalEarnings: Number(u.total_earnings || 0),
      totalDeposits: Number(u.total_deposits || 0),
      totalWithdrawals: Number(u.total_withdrawals || 0),
      status: u.status || "active",
      referralCode: u.referral_code,
      referredByCode: u.referred_by_code || null,
      bonusPoints: Number(u.bonus_points || 0),
      created_at: u.created_at,
      isAdmin: !!u.is_admin,
      lastDailyCheckin: u.last_daily_checkin || null
    }));

    const products = (pRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      dailyReturn: Number(p.daily_return || 0),
      durationDays: Number(p.duration_days || 10),
      totalReturn: Number(p.total_return || 0),
      badge: p.badge || undefined,
      maxPurchaseCount: p.max_purchase_count !== undefined ? Number(p.max_purchase_count) : 3,
      isBlocked: !!p.is_blocked
    }));

    const investments = (iRes.data || []).map((inv: any) => ({
      id: inv.id,
      userId: inv.user_id,
      planId: inv.plan_id,
      planName: inv.plan_name,
      price: Number(inv.price || 0),
      dailyReturn: Number(inv.daily_return || 0),
      totalWeeks: Number(inv.total_weeks || 1),
      daysActive: Number(inv.days_active || 0),
      totalReturn: Number(inv.total_return || 0),
      purchaseDate: inv.purchase_date,
      lastClaimDate: inv.last_claim_date,
      durationDays: Number(inv.duration_days || 10)
    }));

    const deposits = (dRes.data || []).map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      whatsapp: d.whatsapp,
      amount: Number(d.amount || 0),
      reference: d.reference || "",
      paymentCapture: d.payment_capture || "",
      provider: d.provider,
      status: d.status || "pending",
      date: d.date
    }));

    const withdrawals = (wRes.data || []).map((w: any) => ({
      id: w.id,
      userId: w.user_id,
      whatsapp: w.whatsapp,
      amount: Number(w.amount || 0),
      provider: w.provider,
      status: w.status || "pending",
      date: w.date
    }));

    const referralCommissions = (cRes.data || []).map((c: any) => ({
      id: c.id,
      fromUserId: c.from_user_id,
      toUserId: c.to_user_id,
      amount: Number(c.amount || 0),
      level: Number(c.level || 1),
      date: c.date
    }));

    const tickets = (tRes.data || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      sender: t.sender || "user",
      message: t.message || "",
      date: t.date
    }));

    const notifications = (nRes.data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title || "",
      message: n.message || "",
      date: n.date,
      readBy: Array.isArray(n.read_by) ? n.read_by : []
    }));

    const bonusCodes = (bRes.data || []).map((b: any) => ({
      code: b.code,
      amount: Number(b.amount || 0),
      claimedBy: Array.isArray(b.claimed_by) ? b.claimed_by : [],
      created_by: b.created_by || "admin-master",
      usageLimit: b.usage_limit
    }));

    const settingsRow = sRes.data && sRes.data.length > 0 ? sRes.data[0] : null;
    const settings = settingsRow ? {
      whatsappGroupLink: settingsRow.whatsapp_group_link,
      telegramChannelLink: settingsRow.telegram_channel_link
    } : {
      whatsappGroupLink: "https://chat.whatsapp.com/ExempleGroupeInvesta",
      telegramChannelLink: "https://t.me/InvestaPremiumCanal"
    };

    console.log("iAgri Supabase: Full relational state loaded successfully.");
    isSupabaseLoadedMockState = true;
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
    console.warn("iAgri Supabase could not load state:", err.message);
    return null;
  }
}

// Helper to handle upserts safely with individual row fallback upon general failure
async function upsertWithFallback(table: string, rows: any[], idField: string = "id"): Promise<boolean> {
  if (!rows || rows.length === 0) return true;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) {
    console.warn(`iAgri Supabase: Batch upsert on table "${table}" failed (${error.message || error}). Trying row-by-row fallback...`);
    let someFailed = false;
    for (const row of rows) {
      const { error: rowError } = await supabase.from(table).upsert(row);
      if (rowError) {
        console.error(`iAgri Supabase Error: Row upsert FAILED in table "${table}" for ${idField}="${row[idField]}":`, rowError.message || rowError);
        someFailed = true;
      }
    }
    return !someFailed;
  }
  return true;
}

// Bi-directional state pushes
export async function saveStateToSupabase(state: any): Promise<boolean> {
  let isAllSuccessful = true;

  // 1. Users
  try {
    if (state.users && state.users.length > 0) {
      const usersRows = state.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        whatsapp: u.whatsapp,
        country: u.country,
        password_hash: u.passwordHash,
        balance: u.balance,
        daily_earnings: u.dailyEarnings,
        total_earnings: u.totalEarnings,
        total_deposits: u.totalDeposits,
        total_withdrawals: u.totalWithdrawals,
        status: u.status,
        referral_code: u.referralCode,
        referred_by_code: u.referredByCode || null,
        bonus_points: u.bonusPoints,
        created_at: u.created_at,
        is_admin: !!u.isAdmin,
        last_daily_checkin: u.lastDailyCheckin || null
      }));
      const ok = await upsertWithFallback("users", usersRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (users):", err.message);
    isAllSuccessful = false;
  }

  // 2. Products
  try {
    if (state.products && state.products.length > 0) {
      const productsRows = state.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        daily_return: p.dailyReturn,
        duration_days: p.durationDays,
        total_return: p.totalReturn,
        badge: p.badge || null,
        max_purchase_count: p.maxPurchaseCount,
        is_blocked: !!p.isBlocked
      }));
      const ok = await upsertWithFallback("products", productsRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (products):", err.message);
    isAllSuccessful = false;
  }

  // 3. Investments
  try {
    if (state.investments && state.investments.length > 0) {
      const investmentsRows = state.investments.map((inv: any) => ({
        id: inv.id,
        user_id: inv.userId,
        plan_id: inv.planId || null,
        plan_name: inv.planName,
        price: inv.price,
        daily_return: inv.dailyReturn,
        total_weeks: inv.totalWeeks,
        days_active: inv.daysActive,
        total_return: inv.totalReturn,
        purchase_date: inv.purchaseDate,
        last_claim_date: inv.lastClaimDate,
        duration_days: inv.durationDays || 10
      }));
      const ok = await upsertWithFallback("investments", investmentsRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (investments):", err.message);
    isAllSuccessful = false;
  }

  // 4. Deposits
  try {
    if (state.deposits && state.deposits.length > 0) {
      const depositsRows = state.deposits.map((d: any) => ({
        id: d.id,
        user_id: d.userId,
        whatsapp: d.whatsapp,
        amount: d.amount,
        reference: d.reference || null,
        payment_capture: d.paymentCapture || null,
        provider: d.provider,
        status: d.status,
        date: d.date
      }));
      const ok = await upsertWithFallback("deposits", depositsRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (deposits):", err.message);
    isAllSuccessful = false;
  }

  // 5. Withdrawals
  try {
    if (state.withdrawals && state.withdrawals.length > 0) {
      const withdrawalsRows = state.withdrawals.map((w: any) => ({
        id: w.id,
        user_id: w.userId,
        whatsapp: w.whatsapp,
        amount: w.amount,
        provider: w.provider,
        status: w.status,
        date: w.date
      }));
      const ok = await upsertWithFallback("withdrawals", withdrawalsRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (withdrawals):", err.message);
    isAllSuccessful = false;
  }

  // 6. Referral commissions
  try {
    if (state.referralCommissions && state.referralCommissions.length > 0) {
      const commRows = state.referralCommissions.map((c: any) => ({
        id: c.id,
        from_user_id: c.fromUserId,
        to_user_id: c.toUserId,
        amount: c.amount,
        level: c.level,
        date: c.date
      }));
      const ok = await upsertWithFallback("referral_commissions", commRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (referralCommissions):", err.message);
    isAllSuccessful = false;
  }

  // 7. Support tickets
  try {
    if (state.tickets && state.tickets.length > 0) {
      const ticketsRows = state.tickets.map((t: any) => ({
        id: t.id,
        user_id: t.userId,
        sender: t.sender,
        message: t.message,
        date: t.date
      }));
      const ok = await upsertWithFallback("tickets", ticketsRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (tickets):", err.message);
    isAllSuccessful = false;
  }

  // 8. Notifications
  try {
    if (state.notifications && state.notifications.length > 0) {
      const notRows = state.notifications.map((n: any) => ({
        id: n.id,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        date: n.date,
        read_by: n.readBy || []
      }));
      const ok = await upsertWithFallback("notifications", notRows, "id");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (notifications):", err.message);
    isAllSuccessful = false;
  }

  // 9. Bonus Codes
  try {
    if (state.bonusCodes && state.bonusCodes.length > 0) {
      const bonusRows = state.bonusCodes.map((b: any) => ({
        code: b.code,
        amount: b.amount,
        claimed_by: b.claimedBy || [],
        created_by: b.created_by,
        usage_limit: b.usageLimit || 100
      }));
      const ok = await upsertWithFallback("bonus_codes", bonusRows, "code");
      if (!ok) isAllSuccessful = false;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (bonusCodes):", err.message);
    isAllSuccessful = false;
  }

  // 10. Settings
  try {
    if (state.settings) {
      const { error } = await supabase.from("settings").upsert({
        id: "primary",
        whatsapp_group_link: state.settings.whatsappGroupLink,
        telegram_channel_link: state.settings.telegramChannelLink
      });
      if (error) throw error;
    }
  } catch (err: any) {
    console.error("iAgri Supabase save warning (settings):", err.message);
    isAllSuccessful = false;
  }

  return isAllSuccessful;
}

// Singular table Delete proxies (re-sync cleanups)
export async function deleteProductFromSupabase(productId: string) {
  try {
    await supabase.from("products").delete().eq("id", productId);
  } catch (e) {
    console.error("Supabase live delete product failed", e);
  }
}

export async function deleteUserFromSupabase(userId: string) {
  try {
    await supabase.from("users").delete().eq("id", userId);
  } catch (e) {
    console.error("Supabase live delete user failed", e);
  }
}
