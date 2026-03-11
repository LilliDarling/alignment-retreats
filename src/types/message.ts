export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  retreat_id: string | null;
  subject: string;
  body: string;
  message_type: string;
  read: boolean;
  created_at: string;
  sender_name: string | null;
  sender_photo: string | null;
  recipient_name: string | null;
  recipient_photo: string | null;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string | null;
  profile_photo: string | null;
}
