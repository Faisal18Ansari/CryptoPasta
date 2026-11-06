package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Response.ApiResponse;
import com.CryptoPasta.CryptoPasta.Response.PromptBody;
import com.CryptoPasta.CryptoPasta.Services.ChatbotService;
import com.CryptoPasta.CryptoPasta.Services.ChatbotServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai/chat")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> chat(
            @RequestBody(required = false) PromptBody request) {

        if (request == null || request.getPrompt() == null
                || request.getPrompt().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (request.getPrompt().length() > 1000) {
            return ResponseEntity.badRequest().build();
        }
        ApiResponse response = new ApiResponse();
        response.setMessage(chatbotService.answerPrompt(request.getPrompt().trim()));
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(ChatbotServiceException.class)
    public ResponseEntity<ApiResponse> handleChatbotFailure() {
        ApiResponse response = new ApiResponse();
        response.setMessage("The chatbot is temporarily unable to answer. Please try again.");
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(response);
    }
}