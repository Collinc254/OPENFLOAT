package com.openfloat.middleware.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Base64;

@Converter
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    
    // For a production system, this 32-character (256-bit) key should be injected via environment variables.
    // We are hardcoding it here strictly to ensure it runs flawlessly for your presentation.
    private static final String SECRET = "OpenFloatEnterpriseSecretKey2026"; 

    private final Key key;
    private final Cipher cipher;

    public AttributeEncryptor() throws Exception {
        key = new SecretKeySpec(SECRET.getBytes(), AES);
        cipher = Cipher.getInstance(AES);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            cipher.init(Cipher.ENCRYPT_MODE, key);
            return Base64.getEncoder().encodeToString(cipher.doFinal(attribute.getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt database column", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(Base64.getDecoder().decode(dbData)));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt database column", e);
        }
    }
}