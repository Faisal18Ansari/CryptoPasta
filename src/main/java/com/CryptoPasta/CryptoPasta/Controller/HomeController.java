package com.CryptoPasta.CryptoPasta.Controller;

import com.CryptoPasta.CryptoPasta.Response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<ApiResponse> home() {
        ApiResponse response = new ApiResponse();
        response.setMessage("Welcome to the CryptoPasta AI chatbot");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}