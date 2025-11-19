"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  LiveAvatarContextProvider,
  useSession,
  useTextChat,
  useVoiceChat,
  useChatHistory,
} from "../liveavatar";
import { SessionState } from "@heygen/liveavatar-web-sdk";
import { useAvatarActions } from "../liveavatar/useAvatarActions";
import { MessageSender } from "../liveavatar/types";

const Button: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-white text-black px-4 py-2 rounded-md"
    >
      {children}
    </button>
  );
};

const LiveAvatarSessionComponent: React.FC<{
  mode: "FULL" | "CUSTOM";
  onSessionStopped: () => void;
}> = ({ mode, onSessionStopped }) => {
  const [message, setMessage] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [showHistoryAfterSession, setShowHistoryAfterSession] = useState(false);
  const messages = useChatHistory();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    sessionState,
    isStreamReady,
    startSession,
    stopSession,
    connectionQuality,
    keepAlive,
    attachElement,
  } = useSession();
  const {
    isAvatarTalking,
    isUserTalking,
    isMuted,
    isActive,
    isLoading,
    start,
    stop,
    mute,
    unmute,
  } = useVoiceChat();

  const { interrupt, repeat, startListening, stopListening } =
    useAvatarActions(mode);

  const { sendMessage } = useTextChat(mode);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (sessionState === SessionState.DISCONNECTED) {
      if (messages.length > 0) {
        setShowHistoryAfterSession(true);
        // Delay onSessionStopped to allow history modal to show
        setTimeout(() => {
          onSessionStopped();
        }, 100);
      } else {
        onSessionStopped();
      }
    }
  }, [sessionState, onSessionStopped, messages.length]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isStreamReady && videoRef.current) {
      attachElement(videoRef.current);
    }
  }, [attachElement, isStreamReady]);

  useEffect(() => {
    if (sessionState === SessionState.INACTIVE) {
      startSession();
    }
  }, [startSession, sessionState]);

  const VoiceChatComponents = (
    <>
      <p>Voice Chat Active: {isActive ? "true" : "false"}</p>
      <p>Voice Chat Loading: {isLoading ? "true" : "false"}</p>
      {isActive && <p>Muted: {isMuted ? "true" : "false"}</p>}
      <Button
        onClick={() => {
          if (isActive) {
            stop();
          } else {
            start();
          }
        }}
        disabled={isLoading}
      >
        {isActive ? "Stop Voice Chat" : "Start Voice Chat"}
      </Button>
      {isActive && (
        <Button
          onClick={() => {
            if (isMuted) {
              unmute();
            } else {
              mute();
            }
          }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </Button>
      )}
    </>
  );

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Show history after session modal
  if (showHistoryAfterSession && messages.length > 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 py-4 px-4">
        <div className="bg-zinc-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Konuşma Geçmişi</h2>
            <button
              onClick={() => {
                setShowHistoryAfterSession(false);
                onSessionStopped();
              }}
              className="bg-white text-black px-4 py-2 rounded-md"
            >
              Kapat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === MessageSender.USER
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.sender === MessageSender.USER
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-700 text-white"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">
                    {msg.sender === MessageSender.USER ? "Siz" : "Avatar"}
                  </div>
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-row gap-4 py-4 px-4">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-[1080px]">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
          <button
            className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-md"
            onClick={() => stopSession()}
          >
            Stop
          </button>
        </div>
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
          <p>Session state: {sessionState}</p>
          <p>Connection quality: {connectionQuality}</p>
          {mode === "FULL" && (
            <p>User talking: {isUserTalking ? "true" : "false"}</p>
          )}
          <p>Avatar talking: {isAvatarTalking ? "true" : "false"}</p>
          {mode === "FULL" && VoiceChatComponents}
          <Button
            onClick={() => {
              keepAlive();
            }}
          >
            Keep Alive
          </Button>
          <div className="w-full h-full flex flex-row items-center justify-center gap-4">
            <Button
              onClick={() => {
                startListening();
              }}
            >
              Start Listening
            </Button>
            <Button
              onClick={() => {
                stopListening();
              }}
            >
              Stop Listening
            </Button>
            <Button
              onClick={() => {
                interrupt();
              }}
            >
              Interrupt
            </Button>
          </div>
          <div className="w-full h-full flex flex-row items-center justify-center gap-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-[400px] bg-white text-black px-4 py-2 rounded-md"
            />
            <Button
              onClick={() => {
                sendMessage(message);
                setMessage("");
              }}
            >
              Send
            </Button>
            <Button
              onClick={() => {
                repeat(message);
                setMessage("");
              }}
            >
              Repeat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showChatHistory && (
        <div className="w-80 bg-zinc-800 rounded-lg p-4 flex flex-col h-[calc(100vh-2rem)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Konuşma Geçmişi</h3>
            <button
              onClick={() => setShowChatHistory(false)}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                Henüz mesaj yok
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === MessageSender.USER
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        msg.sender === MessageSender.USER
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-700 text-white"
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {msg.sender === MessageSender.USER ? "Siz" : "Avatar"}
                      </div>
                      <div className="text-sm">{msg.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Show chat history button when hidden */}
      {!showChatHistory && (
        <button
          onClick={() => setShowChatHistory(true)}
          className="fixed right-4 top-4 bg-white text-black px-4 py-2 rounded-md shadow-lg"
        >
          Konuşma Geçmişini Göster
        </button>
      )}
    </div>
  );
};

export const LiveAvatarSession: React.FC<{
  mode: "FULL" | "CUSTOM";
  sessionAccessToken: string;
  onSessionStopped: () => void;
}> = ({ mode, sessionAccessToken, onSessionStopped }) => {
  return (
    <LiveAvatarContextProvider sessionAccessToken={sessionAccessToken}>
      <LiveAvatarSessionComponent
        mode={mode}
        onSessionStopped={onSessionStopped}
      />
    </LiveAvatarContextProvider>
  );
};
