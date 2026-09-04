export type RoomStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export type SeatStatus = "AVAILABLE" | "PENDING_PAYMENT" | "COMPLETED";

export interface SecuredByRecord {
  userId: string;
  name: string;
  qty: number;
  at: string;
}

export interface SeatTask {
  id: string;
  roomId: string;
  targetLocation: string; // เช่น "VIP Zone A"
  targetDate: string;     // เช่น "25 Oct 2026"
  price: number;          // เช่น 6500
  quantityNeeded: number; // เช่น 2
  quantitySecured: number;// เช่น 1
  note?: string;          // แผนสำรอง เช่น "ถ้า VIP หลุด เอา Zone B ทันที"
  status: SeatStatus;     // "AVAILABLE" | "PENDING_PAYMENT" | "COMPLETED"
  securedBy: SecuredByRecord[];
  lastUpdatedBy: string;  // เช่น "Mark"
  lastUpdatedAt: string;  // เช่น "15s ago" หรือ ISO String
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text?: string;
  imageUrl?: string;
  isShoutout?: boolean;
  shoutoutType?: "GOT_IT" | "DROPPED" | "NEED_HELP";
  createdAt: string;
}

export interface RoomMemberItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface Room {
  id: string;
  title: string;
  bannerUrl?: string;
  seatingPlanUrl?: string;
  ticketUrl?: string;
  description?: string;
  eventDate: string;
  inviteCode: string;
  status: RoomStatus;
  createdById: string;
  role?: "OWNER" | "MEMBER";
  memberCount: number;
  taskCount?: number;
  createdAt?: string;
  members?: RoomMemberItem[];
}
