import { useEffect, useState } from "react";
import socket from "./socket";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./index.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [users, setUsers] = useState([]);
  const [fen, setFen] = useState("start");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [chess] = useState(new Chess());

  useEffect(() => {
    socket.on("updateUsers", setUsers);
    socket.on("boardState", (newFen) => {
      chess.load(newFen);
      setFen(newFen);
    });
    socket.on("PlayerRole", setPlayerRole);
    socket.on("chatMessage", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("updateUsers");
      socket.off("boardState");
      socket.off("PlayerRole");
      socket.off("chatMessage");
    };
  }, [chess]);

  const joinRoom = () => {
    if (!username || !roomName) return;
    socket.emit("joinRoom", { username, roomName });
  };

  const createRoom = () => {
    if (!username || !roomName) return;
    socket.emit("createRoom", { username, roomName });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    socket.emit("sendMessage", { message: chatInput, username, roomName });
    setChatInput("");
  };

  const onDrop = (sourceSquare, targetSquare) => {
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    const result = chess.move(move);
    if (result) {
      socket.emit("move", move, roomName);
    }
  };

  return (
    <div className="container mx-auto p-5 flex flex-col items-center">
      <div className="max-w-md w-full mb-5">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="form-input mb-2"
        />
        <input
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room Name"
          className="form-input mb-2"
        />
        <div className="flex gap-4">
          <button className="button" onClick={createRoom}>
            Create Room
          </button>
          <button className="button" onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-5xl">
        <div className="sidebar">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <ul>
            {users.map((user, i) => (
              <li key={i}>
                {user.username} ({user.role})
              </li>
            ))}
          </ul>
        </div>

        <div className="board-container col-span-1">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation={playerRole === "b" ? "black" : "white"}
            arePiecesDraggable={
              (playerRole === "w" && chess.turn() === "w") ||
              (playerRole === "b" && chess.turn() === "b")
            }
            customBoardStyle={{ borderRadius: 4, boxShadow: "0 4px 10px rgba(0,0,0,0.4)" }}
          />
        </div>

        <div className="chat-container">
          <h2 className="text-xl font-bold mb-4">Chat</h2>
          <div className="chat-messages max-h-48 overflow-y-auto mb-2">
            {chatMessages.map((msg, i) => (
              <div key={i}>
                <strong>{msg.username}</strong>: {msg.message}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="chat-form flex">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 py-2 px-3 rounded border border-gray-300 bg-gray-700 text-white"
              placeholder="Type your message..."
            />
            <button type="submit" className="button ml-2">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
