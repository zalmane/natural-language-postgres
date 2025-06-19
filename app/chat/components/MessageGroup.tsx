import React, { useMemo } from "react";
import { Message } from "ai";
import { Button } from "@/components/ui/button";
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { FishLogo } from "../FishLogo";
import { UserMessage, AssistantMessage, ReasoningMessage, ToolInvocationMessage } from "../messages";

interface MessageGroupProps {
  group: Message[];
  groupIdx: number;
  totalGroups: number;
  isLoading: boolean;
  isLastGroup: boolean;
  feedback: Record<string, 'up' | 'down' | null>;
  copiedMessageId: string | null;
  clickedButton: string | null;
  handleFeedback: (messageId: string, type: 'up' | 'down') => void;
  handleCopy: (messageId: string, text: string) => void;
  handleButtonClick: (buttonId: string, callback: () => void) => void;
  toggleReasoning: (messageId: string) => void;
  expandedReasonings: Set<string>;
  lastMessageRef?: React.RefObject<HTMLDivElement | null>;
  scrollContainerHeight?: number;
}

export const MessageGroup = React.memo(function MessageGroup({
  group,
  groupIdx,
  totalGroups,
  isLoading,
  isLastGroup,
  feedback,
  copiedMessageId,
  clickedButton,
  handleFeedback,
  handleCopy,
  handleButtonClick,
  toggleReasoning,
  expandedReasonings,
  lastMessageRef,
  scrollContainerHeight,
}: MessageGroupProps) {
  const messageContent = useMemo(() => {
    return group.map((message, idx) => (
      <div key={message.id} className="flex w-full gap-4">
        <div className="flex flex-col gap-4 flex-1">
          {message.parts?.map((part: any, index: number) => {
            switch (part.type) {
              case "text":
                return message.role === "user" ? (
                  <UserMessage key={index} text={part.text ?? ""} />
                ) : (
                  <AssistantMessage key={index} text={part.text ?? ""} isLoading={isLoading} />
                );
              case "reasoning": {
                const isComplete = Boolean(message.parts && message.parts.length > index + 1);
                const isExpanded = expandedReasonings.has(message.id);
                const summary =
                  Array.isArray(part.details) && part.details.length > 0 && 'text' in part.details[0]
                    ? (part.details[0] as any).text?.split('.')[0] || 'Thinking...'
                    : 'Thinking...';
                return (
                  <ReasoningMessage
                    key={index}
                    isComplete={isComplete}
                    isExpanded={isExpanded}
                    summary={summary}
                    details={Array.isArray(part.details) ? part.details.filter((d: any) => d.type === 'text') : []}
                    onToggle={() => toggleReasoning(message.id)}
                  />
                );
              }
              case "tool-invocation":
                return <ToolInvocationMessage key={index} toolInvocation={(part as any).toolInvocation} />;
              default:
                return null;
            }
          }) || <div className="whitespace-pre-wrap">{message.content}</div>}
        </div>
      </div>
    ));
  }, [group, isLoading, expandedReasonings, toggleReasoning]);

  const feedbackButtons = useMemo(() => {
    if (!isLastGroup) return null;
    
    return (
      <div className="flex items-center justify-between gap-2">
        <FishLogo animated={isLoading} />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 transition-colors ${copiedMessageId === group[0].id ? 'text-blue-500' : ''}`}
            onClick={() => {
              const lastMessage = group[0];
              const textPart = lastMessage.parts?.find((p: any) => p.type === 'text');
              const text = textPart ? (textPart as any).text : lastMessage.content;
              handleButtonClick('copy', () => handleCopy(lastMessage.id, text));
            }}
          >
            <Copy className={`h-4 w-4 transition-transform ${clickedButton === 'copy' ? 'scale-110' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 transition-colors ${feedback[group[0].id] === 'up' ? 'text-green-500' : ''}`}
            onClick={() => handleButtonClick('up', () => handleFeedback(group[0].id, 'up'))}
          >
            <ThumbsUp className={`h-4 w-4 transition-transform ${clickedButton === 'up' ? 'scale-110' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 transition-colors ${feedback[group[0].id] === 'down' ? 'text-red-500' : ''}`}
            onClick={() => handleButtonClick('down', () => handleFeedback(group[0].id, 'down'))}
          >
            <ThumbsDown className={`h-4 w-4 transition-transform ${clickedButton === 'down' ? 'scale-110' : ''}`} />
          </Button>
        </div>
      </div>
    );
  }, [
    isLastGroup,
    isLoading,
    group,
    copiedMessageId,
    clickedButton,
    feedback,
    handleButtonClick,
    handleCopy,
    handleFeedback
  ]);

  return (
    <div
      className="flex w-full pt-3 gap-4 flex-col"
      ref={isLastGroup ? lastMessageRef : undefined}
      style={isLastGroup ? { minHeight: scrollContainerHeight } : undefined}
    >
      {messageContent}
      {feedbackButtons}
    </div>
  );
}); 