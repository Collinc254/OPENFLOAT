package com.openfloat.middleware.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import java.io.InputStream;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Base64;


@Slf4j
@Component
public class B2CSecurityUtility {

    /**
     * Encrypts the Daraja Initiator Password using Safaricom's Public Certificate.
     * 
     * @param plaintextPassword The plain text initiator password.
     * @param certInputStream   The input stream of the Safaricom .cer certificate file.
     * @return The Base64 encoded encrypted password.
     */
    public String encryptInitiatorPassword(String plaintextPassword, InputStream certInputStream) {
        try {
            // 1. Read the Safaricom Public Certificate
            CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
            X509Certificate certificate = (X509Certificate) certFactory.generateCertificate(certInputStream);
            PublicKey publicKey = certificate.getPublicKey();

            // 2. Set up the RSA Cipher exactly as Safaricom expects
            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.ENCRYPT_MODE, publicKey);

            // 3. Encrypt the password
            byte[] cipherText = cipher.doFinal(plaintextPassword.getBytes("UTF-8"));

            // 4. Encode the encrypted byte array to a Base64 String
            return Base64.getEncoder().encodeToString(cipherText);

        } catch (Exception e) {
            log.error("Failed to encrypt Safaricom Initiator Password: {}", e.getMessage());
            throw new RuntimeException("Encryption Error: Could not generate SecurityCredential", e);
        }
    }
}