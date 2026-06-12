// Client-side API hooks to interact with our Express custom backend endpoints
const API_BASE = "";

export async function fetchPlatformStats() {
  const res = await fetch(`${API_BASE}/api/platform-stats`);
  if (!res.ok) throw new Error("Erreur de chargement des statistiques de la plateforme");
  return res.json();
}

export async function registerUser(payload: any) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de l'inscription");
  }
  return res.json();
}

export async function loginUser(payload: any) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de la connexion");
  }
  return res.json();
}

export async function resetPassword(payload: any) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de la réinitialisation");
  }
  return res.json();
}

export async function fetchUserProfile(userId: string) {
  const res = await fetch(`${API_BASE}/api/user/profile/${userId}`);
  if (!res.ok) throw new Error("Erreur de chargement du profil utilisateur");
  return res.json();
}

export async function submitDeposit(payload: any) {
  const res = await fetch(`${API_BASE}/api/user/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de la soumission du dépôt");
  }
  return res.json();
}

export async function requestWithdrawal(payload: any) {
  const res = await fetch(`${API_BASE}/api/user/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec du retrait");
  }
  return res.json();
}

export async function purchaseProduct(userId: string, productId: string) {
  const res = await fetch(`${API_BASE}/api/user/buy-product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de l'investissement");
  }
  return res.json();
}

export async function claimBonusCode(userId: string, code: string) {
  const res = await fetch(`${API_BASE}/api/user/redeem-bonus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Échec de la réclamation du code");
  }
  return res.json();
}

export async function claimDailyGift(userId: string) {
  const res = await fetch(`${API_BASE}/api/user/daily-reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Récompense quotidienne déjà échue");
  }
  return res.json();
}

export async function fetchUserNotifications(userId: string) {
  const res = await fetch(`${API_BASE}/api/user/notifications/${userId}`);
  if (!res.ok) throw new Error("Erreur d'acquisition des notifications");
  return res.json();
}

export async function markNotificationsAsRead(userId: string) {
  const res = await fetch(`${API_BASE}/api/user/notifications/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function sendChatMessage(userId: string, sender: string, message: string) {
  const res = await fetch(`${API_BASE}/api/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, sender, message }),
  });
  if (!res.ok) throw new Error("L'envoi a échoué");
  return res.json();
}

export async function fetchChatHistory(userId: string) {
  const res = await fetch(`${API_BASE}/api/chat/history/${userId}`);
  if (!res.ok) throw new Error("Chargement du chat échoué");
  return res.json();
}


// --- ADMIN METRIC HANDLERS ---

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/api/admin/stats`);
  if (!res.ok) throw new Error("Erreur de stats d'administration");
  return res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`);
  if (!res.ok) throw new Error("Erreur de liste utilisateurs");
  return res.json();
}

export async function executeAdminUserAction(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/users/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchAdminDeposits() {
  const res = await fetch(`${API_BASE}/api/admin/deposits`);
  if (!res.ok) throw new Error("Erreur de liste dépôts");
  return res.json();
}

export async function executeAdminDepositAction(depositId: string, action: "approve" | "reject") {
  const res = await fetch(`${API_BASE}/api/admin/deposits/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ depositId, action }),
  });
  return res.json();
}

export async function fetchAdminWithdrawals() {
  const res = await fetch(`${API_BASE}/api/admin/withdrawals`);
  if (!res.ok) throw new Error("Erreur de liste retraits");
  return res.json();
}

export async function executeAdminWithdrawalAction(withdrawalId: string, action: "approve" | "reject") {
  const res = await fetch(`${API_BASE}/api/admin/withdrawals/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ withdrawalId, action }),
  });
  return res.json();
}

export async function fetchAdminProducts() {
  const res = await fetch(`${API_BASE}/api/admin/products`);
  if (!res.ok) throw new Error("Erreur de liste produits");
  return res.json();
}

export async function createAdminProduct(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteAdminProduct(productId: string) {
  const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
    method: "DELETE"
  });
  return res.json();
}

export async function updateAdminProduct(productId: string, payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function triggerAdminGlobalNotification(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/notify-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function generateAdminBonusCode(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/bonus-codes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchAdminBonusCodes() {
  const res = await fetch(`${API_BASE}/api/admin/bonus-codes`);
  if (!res.ok) throw new Error("Erreur de chargement des codes bonus");
  return res.json();
}

export async function fetchAdminChats() {
  const res = await fetch(`${API_BASE}/api/admin/chats`);
  if (!res.ok) throw new Error("Erreur de chargement des fils de discussion");
  return res.json();
}

export async function fetchPlatformSettings() {
  const res = await fetch(`${API_BASE}/api/public/settings`);
  if (!res.ok) throw new Error("Erreur de chargement des configurations");
  return res.json();
}

export async function updatePlatformSettings(payload: any) {
  const res = await fetch(`${API_BASE}/api/admin/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
