import { useCallback } from "react";
import { useLiveAvatarContext } from "./context";
import { MessageSender } from "./types";

export const useTextChat = (mode: "FULL" | "CUSTOM") => {
  const { sessionRef, setMessages } = useLiveAvatarContext();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message to chat history
      setMessages((prev) => [
        ...prev,
        {
          sender: MessageSender.USER,
          message: message.trim(),
          timestamp: Date.now(),
        },
      ]);

      if (mode === "FULL") {
        return sessionRef.current.message(message);
      } else if (mode === "CUSTOM") {
        const response = await fetch("/api/openai-chat-complete", {
          method: "POST",
          body: JSON.stringify({ message }),
        });
        const { response: chatResponseText } = await response.json();

        // Add avatar response to chat history
        setMessages((prev) => [
          ...prev,
          {
            sender: MessageSender.AVATAR,
            message: chatResponseText,
            timestamp: Date.now(),
          },
        ]);

        const res = await fetch("/api/elevenlabs-text-to-speech", {
          method: "POST",
          body: JSON.stringify({ text: chatResponseText }),
        });
        const { audio } = await res.json();
        // Have the avatar repeat the audio
        return sessionRef.current.repeatAudio(audio);
      }
    },
    [sessionRef, mode, setMessages],
  );

  return {
    sendMessage,
  };
};
