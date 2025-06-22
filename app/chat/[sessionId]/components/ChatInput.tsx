import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({ input, isLoading, handleInputChange, handleSubmit }: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 py-4">
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Type your message..."
        className="flex-1"
        disabled={isLoading}
        data-testid="chat-input"
      />
      <Button type="submit" disabled={isLoading || !input.trim()} data-testid="send-button">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
} 