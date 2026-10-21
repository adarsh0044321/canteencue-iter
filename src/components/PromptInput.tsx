import React, { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowRight, BookOpen } from "lucide-react";

interface PromptInputProps {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  onOpenQuickOptions?: () => void;
  onOpenMenuModal?: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = "Tell me what you feel like eating...",
  onOpenQuickOptions,
  onOpenMenuModal,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Web Speech API recognition support
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please type your request.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const sanitizedInput = trimmed.length > 1000 ? trimmed.substring(0, 1000) : trimmed;
    onSubmit(sanitizedInput);
    setInput("");
  };

  return (
    <form
      className="prompt-card"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        id="prompt-textarea"
        ref={textareaRef}
        aria-label="Food decision request"
        className="prompt__textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        disabled={isLoading}
      />

      <div className="prompt__bar">
        {/* Left quick actions: Menu & Preferences */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {onOpenMenuModal && (
            <button
              type="button"
              className="prompt-menu-btn"
              onClick={onOpenMenuModal}
              aria-label="View Full Canteen Menu"
              title="Browse Canteen Menu"
            >
              <BookOpen size={14} />
              <span>Menu</span>
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={onOpenQuickOptions}
            aria-label="Add dietary or budget constraint"
            title="Quick preference options"
          >
            <Plus size={19} />
          </button>
        </div>

        {/* Right buttons: Voice and Submit */}
        <div className="prompt__actions">
          <button
            type="button"
            className={`icon-btn ${isListening ? "icon-btn--listening" : ""}`}
            onClick={toggleListening}
            aria-label={isListening ? "Listening... click to stop" : "Speak your food request"}
            title={isListening ? "Listening..." : "Voice input"}
          >
            <Mic size={18} />
          </button>

          <button
            type="submit"
            className="icon-btn icon-btn--send"
            disabled={!input.trim() || isLoading}
            aria-label="Send food request"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </form>
  );
};
