import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/config/app";
import ChatMessage from "./ChatMessage";

const createMessage = (role, text) => ({
    id: crypto.randomUUID(),
    role,
    text,
});

const ChatbotWidget = ({ fullName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending, isOpen]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const prompt = inputValue.trim();
        if (!prompt || isSending) return;

        const jwt = localStorage.getItem("jwt");
        if (!jwt) {
            setErrorMessage("Your session has expired. Please sign in again.");
            return;
        }

        setMessages((current) => [...current, createMessage("user", prompt)]);
        setInputValue("");
        setErrorMessage("");
        setIsSending(true);

        try {
            const response = await api.post(
                "/ai/chat",
                { prompt },
                { headers: { Authorization: `Bearer ${jwt}` } }
            );

            const answer = response.data?.message;
            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error("The chatbot returned an empty response.");
            }

            setMessages((current) => [
                ...current,
                createMessage("assistant", answer),
            ]);
        } catch (error) {
            const status = error.response?.status;

            if (status === 401 || status === 403) {
                setErrorMessage("Your session has expired. Please sign in again.");
            } else if (status === 502 || status === 503) {
                setErrorMessage("The chatbot is temporarily unavailable. Please try again.");
            } else {
                setErrorMessage("Could not reach the chatbot. Check your connection and retry.");
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <section className="fixed bottom-3 right-5 z-40 flex flex-col items-end gap-2">
            {isOpen && (
                <div
                    id="cryptopasta-chat-panel"
                    className="flex h-[70vh] w-[18rem] flex-col rounded-md bg-sidebar md:w-[22rem]"
                >
                    <div className="flex h-[12%] shrink-0 items-center justify-between border-b px-6">
                        <p>Chat Bot</p>
                        <Button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            variant="ghost"
                            size="icon"
                            aria-label="Close chat"
                        >
                            <X />
                        </Button>
                    </div>

                    <div
                        className="scroll-container flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-2"
                        aria-live="polite"
                    >
                        <div className="w-auto self-start pb-5">
                            <div className="max-w-[90%] rounded-md bg-sidebar-accent px-4 py-3">
                                <p>Hi, {fullName || "there"}!</p>
                                <p>You can ask Crypto Related Questions.</p>
                                <p>
                                    For example, What is the price, market cap or
                                    current volume etc.
                                </p>
                            </div>
                        </div>

                        {messages.map((message) => (
                            <ChatMessage key={message.id} message={message} />
                        ))}

                        {isSending && (
                            <ChatMessage
                                message={{
                                    id: "chatbot-pending",
                                    role: "assistant",
                                    text: "Thinking...",
                                }}
                            />
                        )}

                        {errorMessage && (
                            <p role="alert" className="text-sm text-red-400">
                                {errorMessage}
                            </p>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex h-[12%] shrink-0 items-center gap-2 border-t px-2"
                    >
                        <Input
                            className="h-full min-w-0 flex-1 border-none outline-none"
                            placeholder="Write Prompt"
                            value={inputValue}
                            maxLength={1000}
                            disabled={isSending}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.nativeEvent.isComposing) {
                                    event.preventDefault();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            aria-label="Send message"
                            disabled={!inputValue.trim() || isSending}
                        >
                            <Send />
                        </Button>
                    </form>
                </div>
            )}

            <Button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                aria-controls="cryptopasta-chat-panel"
                className="h-[3rem] w-[10rem] items-center gap-2"
            >
                <MessageCircle className="size-7 fill-white -rotate-90 stroke-none" />
                <span className="text-2xl">Chat Bot</span>
            </Button>
        </section>
    );
};

export default ChatbotWidget;