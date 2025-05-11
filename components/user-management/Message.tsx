"use client";

interface MessageProps {
  type: "error" | "success";
  message: string | null;
}

export default function Message({ type, message }: MessageProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-4 p-3 ${
        type === "error"
          ? "bg-red-50 text-red-500"
          : "bg-green-50 text-green-600"
      } text-sm rounded-md`}
    >
      {message}
    </div>
  );
}
