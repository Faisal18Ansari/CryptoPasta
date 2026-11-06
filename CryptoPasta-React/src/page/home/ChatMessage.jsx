const ChatMessage = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[90%] whitespace-pre-wrap break-words rounded-md bg-sidebar-accent px-5 py-2">
                {message.text}
            </div>
        </div>
    );
};

export default ChatMessage;