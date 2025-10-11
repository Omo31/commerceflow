"use client";
import { useState, useRef, useEffect } from "react";
import {
  addDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
  where,
  limit,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { Send, X } from "lucide-react";
import {
  useAuth,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from "@/firebase";
import type {
  SupportChatMessage,
  SupportChatSession,
} from "@/lib/support-chat-types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

type SupportChatProps = {
  onClose: () => void;
};

export function SupportChat({ onClose }: SupportChatProps) {
  const firestore = useFirestore();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () =>
      firestore && chatSessionId
        ? query(
            collection(firestore, `supportChats/${chatSessionId}/messages`),
            orderBy("timestamp", "asc"),
          )
        : null,
    [firestore, chatSessionId],
  );
  const { data: messages, isLoading } =
    useCollection<SupportChatMessage>(messagesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const getOrCreateChatSession = async () => {
      if (!firestore || !user) return;

      const supportChatsRef = collection(firestore, "supportChats");
      const q = query(
        supportChatsRef,
        where("userId", "==", user.uid),
        limit(1),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const newSessionRef = doc(supportChatsRef);
        const newSession: SupportChatSession = {
          id: newSessionRef.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: [],
        };
        await setDoc(newSessionRef, newSession);
        setChatSessionId(newSessionRef.id);
      } else {
        setChatSessionId(querySnapshot.docs[0].id);
      }
    };

    getOrCreateChatSession();
  }, [firestore, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newMessage.trim() || !chatSessionId) return;

    const messageData = {
      text: newMessage,
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      timestamp: serverTimestamp(),
    };

    const messagesRef = collection(
      firestore,
      `supportChats/${chatSessionId}/messages`,
    );

    try {
      await addDoc(messagesRef, messageData);
      setNewMessage("");
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
        path: messagesRef.path,
        operation: "create",
        requestResourceData: messageData,
      });
      errorEmitter.emit("permission-error", permissionError);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Support Chat</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close chat</span>
        </Button>
      </CardHeader>
      <CardContent className="h-80">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isLoading && <p>Loading chat...</p>}
            {!isLoading &&
              messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3",
                    msg.userId === user?.uid ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.userId !== user?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-xs rounded-lg p-3 text-sm",
                      msg.userId === user?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p className="font-bold">{msg.userName}</p>
                    <p>{msg.text}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {msg.timestamp?.toDate().toLocaleTimeString()}
                    </p>
                  </div>
                  {msg.userId === user?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{msg.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            {!isLoading && messages?.length === 0 && (
              <p className="text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
