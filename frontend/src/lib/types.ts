export type UserRole = "student" | "staff" | "admin";
export type BadgeTier = "Bronze" | "Silver" | "Gold";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  department?: string;
  student_id?: string;
  total_points: number;
  badge_tier: BadgeTier;
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  code?: string;
  building: string;
  latitude: number;
  longitude: number;
  description?: string;
  floors?: string;
  is_active: boolean;
}

export interface ItemImage {
  id: number;
  file_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Item {
  id: number;
  tracking_code: string;
  type: "lost" | "found";
  name: string;
  category: string;
  description: string;
  color?: string;
  brand?: string;
  model?: string;
  weight?: string;
  material?: string;
  distinguishing_features?: string;
  private_details?: string;
  status: "reported" | "stored" | "claim_pending" | "verified" | "returned" | "recovered" | "archived";
  date_event: string;
  time_event?: string;
  location_id?: number;
  building_room?: string;
  storage_location?: string;
  contact_preference?: string;
  owner_id: number;
  qr_token?: string;
  qr_image_url?: string;
  created_at: string;
  updated_at?: string;
  images: ItemImage[];
  location?: Location;
  owner?: User;
}

export interface ScoreBreakdown {
  image_score: number;
  description_score: number;
  attribute_score: number;
  location_score: number;
  date_score: number;
  overall_similarity: number;
}

export interface MatchResult {
  item: Item;
  scores: ScoreBreakdown;
  status: string;
}

export interface Claim {
  id: number;
  item_id: number;
  claimant_id: number;
  proof_description: string;
  proof_image_url?: string;
  status: "pending" | "approved" | "rejected" | "returned";
  staff_notes?: string;
  reviewed_by_id?: number;
  reviewed_at?: string;
  created_at: string;
  item?: Item;
  claimant?: User;
  reviewer?: User;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: "match" | "claim" | "reward" | "status" | "system";
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface RewardLedgerEntry {
  id: number;
  points: number;
  reason: string;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface LeaderboardUser {
  id: number;
  full_name: string;
  avatar_url?: string;
  department?: string;
  total_points: number;
  badge_tier: BadgeTier;
  recovered_count: number;
  rank: number;
}

export interface HeatmapPoint {
  location_id: number;
  name: string;
  building: string;
  latitude: number;
  longitude: number;
  lost_count: number;
  found_count: number;
  total_items: number;
  intensity: number;
}

export interface AdminStats {
  total_users: number;
  total_lost_reports: number;
  total_found_reports: number;
  successful_recoveries: number;
  pending_claims: number;
  active_reports: number;
  reward_points_issued: number;
  recovery_rate: number;
  category_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
}
