export type SupportChatMessage = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: any; // Can be a Date or a Firestore Timestamp
};

export type SupportChatSession = {
  id: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
  messages: SupportChatMessage[];
};
