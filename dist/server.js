"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" })); // 本番は許可ドメインを絞ってください
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*" },
});
// ---- 重複放送の最終ガード（同じマッチを複数回飛ばさない）----
const recentMatchKeys = new Set();
const makeMatchKey = (d) => { var _a, _b, _c; return `${(_a = d.matchId) !== null && _a !== void 0 ? _a : ""}|${(_b = d.chatId) !== null && _b !== void 0 ? _b : ""}|${(_c = d.matchedAt) !== null && _c !== void 0 ? _c : ""}`; };
// 動作確認/ヘルスチェック（不要なら削除OK）
app.get("/", (_req, res) => {
    res.status(200).type("text/plain").send("OK");
});
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
io.on("connection", (socket) => {
    console.log("⚡️ connected:", socket.id);
    // チャット一覧やプッシュ用：ユーザー固有ルーム
    socket.on("setUserId", (userId) => {
        if (!userId)
            return;
        socket.join(`user:${userId}`);
        console.log(`👤 ${socket.id} joined user room user:${userId}`);
    });
    // チャットルーム
    socket.on("joinChat", (chatId) => {
        if (!chatId)
            return;
        socket.join(chatId);
        console.log(`🔑 ${socket.id} joined chat ${chatId}`);
    });
    // メッセージ中継
    socket.on("sendMessage", (payload) => {
        if (!(payload === null || payload === void 0 ? void 0 : payload.chatId))
            return;
        console.log("📩 relay message:", payload);
        // 同じチャットの参加者へ
        io.to(payload.chatId).emit("newMessage", payload);
        // 受信者のユーザールームへ
        if (payload.toUserId) {
            io.to(`user:${payload.toUserId}`).emit("newMessage", payload);
        }
    });
    // ---- マッチ成立中継（matchEstablished の一本化）----
    socket.on("matchEstablished", (data) => {
        // 重複放送ガード
        const key = makeMatchKey(data);
        if (recentMatchKeys.has(key))
            return;
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
    });
    socket.on("disconnect", () => {
        console.log("❌ disconnected:", socket.id);
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 WS server on :${PORT}`);
});
