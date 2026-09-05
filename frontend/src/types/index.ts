export type RoomStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export type SeatStatus = "AVAILABLE" | "PENDING_PAYMENT" | "COMPLETED";

export interface SecuredByRecord {
  userId: string;
  name: string;
  qty: number;
  at: string;
  zoneName?: string; // เช่น "VIP Zone A (หลัก)" หรือ "Zone B (สำรอง)"
  zoneType?: "MAIN" | "BACKUP";
  isAssignee?: boolean;
}

export interface TaskAssignee {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export interface PendingPaymentRecord {
  id: string;
  userId: string;
  name: string;
  zoneType: "MAIN" | "BACKUP";
  zoneName: string;
  price: number;
  at: string;
}

export interface SeatTask {
  id: string;
  roomId: string;
  targetLocation: string; // เช่น "VIP Zone A"
  backupLocation?: string | null; // เช่น "Zone B" (ไม่บังคับ)
  targetDate: string;     // เช่น "25 Oct 2026"
  price: number;          // เช่น 6500
  backupPrice?: number | null; // เช่น 4500 (ไม่บังคับ)
  quantityNeeded: number; // เช่น 2
  quantitySecured: number;// เช่น 1
  note?: string;          // แผนสำรอง เช่น "ถ้า VIP หลุด เอา Zone B ทันที"
  status: SeatStatus;     // "AVAILABLE" | "PENDING_PAYMENT" | "COMPLETED"
  securedBy: SecuredByRecord[];
  pendingPayments?: PendingPaymentRecord[];
  assignee?: TaskAssignee | null;
  assignees?: TaskAssignee[];
  lastUpdatedBy: string;  // เช่น "Mark"
  lastUpdatedAt: string;  // เช่น "15s ago" หรือ ISO String
}

export interface ReplyToMessage {
  id: string;
  userName: string;
  text?: string;
  imageUrl?: string;
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
  replyTo?: ReplyToMessage | null;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  createdAt: string;
  isSending?: boolean;
  error?: boolean;
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

export interface TypingUser {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ReadReceiptUser {
  userId: string;
  name: string;
  avatarUrl?: string | null;
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
  pinnedMessageId?: string | null;
  pinnedMessage?: Message | null;
  role?: "OWNER" | "MEMBER";
  memberCount: number;
  taskCount?: number;
  unreadCount?: number;
  createdAt?: string;
  members?: RoomMemberItem[];
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface RoomInvitationItem {
  id: string;
  roomId: string;
  roomTitle: string;
  roomBannerUrl?: string | null;
  roomEventDate?: string | null;
  inviteCode: string;
  inviterId: string;
  inviterName: string;
  inviterAvatarUrl?: string | null;
  inviteeId: string;
  inviteeName?: string;
  inviteeEmail?: string;
  inviteeAvatarUrl?: string | null;
  status: InvitationStatus;
  createdAt: string;
}

export interface SearchUserResult {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  membershipStatus?: "MEMBER" | "INVITED" | null;
}
