import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

// ✅ PORT を number 型に変換
const PORT: number = Number(process.env.PORT) || 3001;

const io = new Server({
  cors: {
    origin: "*", // 全てのオリジンからのアクセスを許可
  },
});

io.on("connection", (socket) => {
  console.log("✅ ユーザーが接続:", socket.id);

  socket.on("message", (data) => {
    console.log("💬 メッセージ受信:", data);
    io.emit("message", data); // 全クライアントにブロードキャスト
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断:", socket.id);
  });
});

io.listen(PORT); // ✅ ここでエラーが出ないようにする

console.log(`🚀 WebSocket サーバーがポート ${PORT} で起動しました！`);
