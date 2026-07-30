package com.openfloat.middleware.model;

import com.openfloat.middleware.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private Role role;
}