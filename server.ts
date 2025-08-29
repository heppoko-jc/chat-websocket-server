// chat-websocket-server/server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("⚡️ connected:", socket.id);

  // 追加: ユーザー固有ルームに参加（チャット一覧画面が使う）
  socket.on("setUserId", (userId: string) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 ${socket.id} joined user room user:${userId}`);
  });

  // 既存: チャットルーム参加
  socket.on("joinChat", (chatId: string) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`🔑 ${socket.id} joined chat ${chatId}`);
  });

  // 変更: 受け取ったメッセージを部屋へリレー + 受信者ユーザールームにもリレー
  socket.on("sendMessage", (payload: { chatId: string; toUserId?: string; [k: string]: any }) => {
    if (!payload?.chatId) return;
    console.log("📩 relay message:", payload);
    io.to(payload.chatId).emit("newMessage", payload);
    if (payload.toUserId) {
      io.to(`user:${payload.toUserId}`).emit("newMessage", payload);
    }
  });

  // 変更: マッチ通知のイベント名をクライアントに合わせる
  socket.on("matchEstablished", (data: { chatId?: string; targetUserId?: string; [k: string]: any }) => {
    console.log("🎉 relay matchEstablished:", data);
    if (data.chatId) io.to(data.chatId).emit("matchEstablished", data);
    if (data.targetUserId) io.to(`user:${data.targetUserId}`).emit("matchEstablished", data);
    // 後方互換: 旧イベント名も投げておく（不要なら消してOK）
    if (data.chatId) io.to(data.chatId).emit("newMatch", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WS server on :${PORT}`);
});