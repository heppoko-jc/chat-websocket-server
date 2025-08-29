// chat-websocket-server/server.ts
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" })); // 本番は許可ドメインを絞ってください

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// 動作確認/ヘルスチェック（不要なら削除OK）
app.get("/", (_req: Request, res: Response): void => {
  res.status(200).type("text/plain").send("OK");
});
app.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true });
});

io.on("connection", (socket) => {
  console.log("⚡️ connected:", socket.id);

  // チャット一覧やプッシュ用：ユーザー固有ルーム
  socket.on("setUserId", (userId: string) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 ${socket.id} joined user room user:${userId}`);
  });

  // チャットルーム
  socket.on("joinChat", (chatId: string) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(`🔑 ${socket.id} joined chat ${chatId}`);
  });

  // メッセージ中継
  socket.on(
    "sendMessage",
    (payload: { chatId: string; toUserId?: string; [k: string]: unknown }) => {
      if (!payload?.chatId) return;
      console.log("📩 relay message:", payload);
      // 同じチャットの参加者へ
      io.to(payload.chatId).emit("newMessage", payload);
      // 受信者のユーザールームへ
      if (payload.toUserId) {
        io.to(`user:${payload.toUserId}`).emit("newMessage", payload);
      }
    }
  );

  // マッチ成立中継（新旧イベント名どちらでもクライアントが受けられるように両方emit）
  socket.on(
    "matchEstablished",
    (data: {
      chatId?: string;
      notifyUserIds?: string[]; // 両参加者IDを配列で
      [k: string]: unknown;
    }) => {
      console.log("🎉 relay matchEstablished:", data);

      // チャット部屋宛（両者ともjoinしていればこれで届く）
      if (data.chatId) {
        io.to(data.chatId).emit("matchEstablished", data);
        io.to(data.chatId).emit("newMatch", data); // 後方互換
      }

      // 参加ユーザー個別宛（片方しかjoinしていないケースをカバー）
      if (Array.isArray(data.notifyUserIds)) {
        for (const uid of data.notifyUserIds) {
          io.to(`user:${uid}`).emit("matchEstablished", data);
          io.to(`user:${uid}`).emit("newMatch", data); // 後方互換
        }
      }
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