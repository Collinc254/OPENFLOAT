package com.openfloat.middleware.model;

import com.openfloat.middleware.entity.Permission;
import lombok.Data;

import java.util.Set;

@Data
public class UpdatePermissionsRequest {
    private Set<Permission> permissions;
}