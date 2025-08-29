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

// ---- 重複放送の最終ガード（同じマッチを複数回飛ばさない）----
const recentMatchKeys = new Set<string>();
const makeMatchKey = (d: any) =>
  `${d.matchId ?? ""}|${d.chatId ?? ""}|${d.matchedAt ?? ""}`;

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

  // ---- マッチ成立中継（matchEstablished の一本化）----
  socket.on(
    "matchEstablished",
    (data: {
      chatId?: string;
      notifyUserIds?: string[]; // 両参加者IDを配列で
      matchId?: string;
      matchedAt?: string;
      [k: string]: unknown;
    }) => {
      // 重複放送ガード
      const key = makeMatchKey(data);
      if (recentMatchKeys.has(key)) return;
      recentMatchKeys.add(key);
      setTimeout(() => recentMatchKeys.delete(key), 8000); // 8秒保持

      console.log("🎉 relay matchEstablished:", data);

      // チャット部屋宛（両者がjoinしていればここで届く）
      if (data.chatId) {
        io.to(data.chatId).emit("matchEstablished", data);
      }

      // 参加ユーザー個別宛（片方しかjoinしていないケースをカバー）
      if (Array.isArray(data.notifyUserIds)) {
        for (const uid of data.notifyUserIds) {
          io.to(`user:${uid}`).emit("matchEstablished", data);
        }
      }

      // ※ 後方互換の newMatch は送らない（重複の主因だったため廃止）
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