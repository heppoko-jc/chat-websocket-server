// chat-websocket-server/server.ts
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// 本番では origin を自ドメインに絞る
app.use(cors({ origin: "*" }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// --- 動作確認・ヘルスチェック（※不要なら削除OK） ---
app.get("/", (_req: Request, res: Response): void => {
  res.status(200).type("text/plain").send("OK");
});
app.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true });
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("⚡️ connected:", socket.id);

  // チャット一覧などで使う：ユーザー固有ルーム
  socket.on("setUserId", (userId: string) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 ${socket.id} joined user room user:${userId}`);
  });

  // チャットルーム参加
  socket.on("joinChat", (chatId: string) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`🔑 ${socket.id} joined chat ${chatId}`);
  });

  // メッセージ中継：チャットルーム + 受信者ユーザールーム
  socket.on(
    "sendMessage",
    (payload: { chatId: string; toUserId?: string; [k: string]: unknown }) => {
      if (!payload?.chatId) return;
      console.log("📩 relay message:", payload);
      io.to(payload.chatId).emit("newMessage", payload);
      if (payload.toUserId) {
        io.to(`user:${payload.toUserId}`).emit("newMessage", payload);
      }
    }
  );

  // マッチ成立通知：新旧イベント名に両対応
  socket.on(
    "matchEstablished",
    (data: { chatId?: string; targetUserId?: string; [k: string]: unknown }) => {
      console.log("🎉 relay matchEstablished:", data);
      if (data.chatId) io.to(data.chatId).emit("matchEstablished", data);
      if (data.targetUserId)
        io.to(`user:${data.targetUserId}`).emit("matchEstablished", data);
      // 後方互換（クライアントが newMatch を購読している場合）
      if (data.chatId) io.to(data.chatId).emit("newMatch", data);
    }
  );

  socket.on("disconnect", () => {
    console.log("❌ disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WS server on :${PORT}`);
});