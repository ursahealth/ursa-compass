import React from "react";

export interface CopilotUIProps {
  userId: string;
  onSendMessage: (message: string) => void;
  messages: { sender: "user" | "assistant"; text: string }[];
}

export const CopilotUI: React.FC<CopilotUIProps> = ({
  userId,
  messages,
  onSendMessage,
}) => {
  const [input, setInput] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="p-4 rounded-xl shadow-md max-w-xl mx-auto border">
      <h2 className="text-xl font-semibold mb-4">Copilot Chat ({userId})</h2>
      <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.sender === "user"
                ? "bg-blue-100 text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-2 py-1 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
};

