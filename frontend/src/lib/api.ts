import {
  User,
  Item,
  Claim,
  Location,
  MatchResult,
  Notification,
  RewardLedgerEntry,
  LeaderboardUser,
  HeatmapPoint,
  AdminStats
} from "./types";

const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/+$/, "");
export const API_BASE = configuredApiUrl.endsWith("/api/v1")
  ? configuredApiUrl
  : `${configuredApiUrl}/api/v1`;

// Uploaded files and QR codes are served by Render, not the Vercel frontend.
export function getMediaUrl(path: string): string {
  return new URL(path, `${new URL(API_BASE).origin}/`).toString();
}

export const API_ORIGIN = new URL(API_BASE).origin;

export const IMG_FALLBACK = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80";
export const onImgError = (e: { currentTarget: HTMLImageElement }) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = IMG_FALLBACK;
};

const MAX_IMAGE_MB = 5;
const MAX_IMAGES = 5;
export function validateImages(files: File[], existing: number): { ok: File[]; error: string } {
  const ok: File[] = [];
  let error = "";
  for (const f of files) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) error = `"${f.name}" is not a JPG, PNG, WEBP or GIF image.`;
    else if (f.size > MAX_IMAGE_MB * 1024 * 1024) error = `"${f.name}" is larger than ${MAX_IMAGE_MB} MB.`;
    else if (existing + ok.length >= MAX_IMAGES) error = `You can upload at most ${MAX_IMAGES} photos.`;
    else ok.push(f);
  }
  return { ok, error };
}

export const assetUrl = (u?: string) => u ? getMediaUrl(u) : undefined;

function getHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cf_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const api = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },

  register: async (userData: any): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  demoLogin: async (role: "student" | "staff" | "admin"): Promise<{ access_token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/demo-login/${role}`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Demo login for ${role} failed`);
    }
    return res.json();
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user profile");
    return res.json();
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
  },

  getItems: async (params?: Record<string, string>): Promise<Item[]> => {
    const query = new URLSearchParams(params || {}).toString();
    const res = await fetch(`${API_BASE}/items/?${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch items");
    return res.json();
  },

  getItemById: async (id: number): Promise<Item> => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch item details");
    return res.json();
  },

  createItem: async (formData: FormData): Promise<Item> => {
    const res = await fetch(`${API_BASE}/items/`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit report");
    }
    return res.json();
  },

  getItemMatches: async (id: number): Promise<MatchResult[]> => {
    const res = await fetch(`${API_BASE}/items/${id}/matches`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch item matches");
    return res.json();
  },

  lookupByQrToken: async (token: string): Promise<Item> => {
    const res = await fetch(`${API_BASE}/items/qr-lookup/${encodeURIComponent(token)}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Invalid or unauthorized QR code");
    }
    return res.json();
  },

  updateItemStatus: async (id: number, status: string, storage_location?: string): Promise<Item> => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, storage_location }),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
  },

  deleteItem: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete item");
    return res.json();
  },

  searchByText: async (params: Record<string, string>): Promise<Item[]> => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/search/text?${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Search request failed");
    return res.json();
  },

  searchByImage: async (imageFile: File, category?: string): Promise<MatchResult[]> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("type", "found");
    if (category) {
      formData.append("category", category);
    }
    const res = await fetch(`${API_BASE}/search/image`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Image search failed");
    }
    return res.json();
  },

  submitClaim: async (claimData: { item_id: number; proof_description: string; proof_image_url?: string }): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/claims/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(claimData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to submit claim");
    }
    return res.json();
  },

  getClaims: async (status?: string): Promise<Claim[]> => {
    const query = status ? `?status=${status}` : "";
    const res = await fetch(`${API_BASE}/claims/${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load claims");
    return res.json();
  },

  reviewClaim: async (claimId: number, status: string, staff_notes?: string): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/claims/${claimId}/review`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ status, staff_notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update claim review");
    }
    return res.json();
  },

  getLocations: async (): Promise<Location[]> => {
    const res = await fetch(`${API_BASE}/locations/`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load campus locations");
    return res.json();
  },

  getMyRewards: async (): Promise<RewardLedgerEntry[]> => {
    const res = await fetch(`${API_BASE}/rewards/my-history`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch reward history");
    return res.json();
  },

  getLeaderboard: async (): Promise<LeaderboardUser[]> => {
    const res = await fetch(`${API_BASE}/rewards/leaderboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load leaderboard");
    return res.json();
  },

  getNotifications: async (): Promise<Notification[]> => {
    const res = await fetch(`${API_BASE}/notifications/`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  markNotificationRead: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "POST",
      headers: getHeaders(),
    });
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: "POST",
      headers: getHeaders(),
    });
  },

  getAdminStats: async (): Promise<AdminStats> => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch admin stats");
    return res.json();
  },

  getHeatmapData: async (): Promise<HeatmapPoint[]> => {
    const res = await fetch(`${API_BASE}/admin/heatmap`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch heatmap data");
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load users");
    return res.json();
  },

  getAuditLogs: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  },
};
