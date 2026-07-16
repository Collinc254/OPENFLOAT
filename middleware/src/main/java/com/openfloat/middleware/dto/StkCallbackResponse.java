package com.openfloat.middleware.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class StkCallbackResponse {

    @JsonProperty("Body")
    private ResponseBody body;

    public ResponseBody getBody() { return body; }
    public void setBody(ResponseBody body) { this.body = body; }

    public static class ResponseBody {
        @JsonProperty("stkCallback")
        private StkCallback stkCallback;

        public StkCallback getStkCallback() { return stkCallback; }
        public void setStkCallback(StkCallback stkCallback) { this.stkCallback = stkCallback; }
    }

    public static class StkCallback {
        @JsonProperty("MerchantRequestID")
        private String merchantRequestId;

        @JsonProperty("CheckoutRequestID")
        private String checkoutRequestId;

        @JsonProperty("ResultCode")
        private int resultCode;

        @JsonProperty("ResultDesc")
        private String resultDesc;

        @JsonProperty("CallbackMetadata")
        private CallbackMetadata callbackMetadata;

        // Getters and Setters
        public String getMerchantRequestId() { return merchantRequestId; }
        public void setMerchantRequestId(String merchantRequestId) { this.merchantRequestId = merchantRequestId; }
        
        public String getCheckoutRequestId() { return checkoutRequestId; }
        public void setCheckoutRequestId(String checkoutRequestId) { this.checkoutRequestId = checkoutRequestId; }
        
        public int getResultCode() { return resultCode; }
        public void setResultCode(int resultCode) { this.resultCode = resultCode; }
        
        public String getResultDesc() { return resultDesc; }
        public void setResultDesc(String resultDesc) { this.resultDesc = resultDesc; }
        
        public CallbackMetadata getCallbackMetadata() { return callbackMetadata; }
        public void setCallbackMetadata(CallbackMetadata callbackMetadata) { this.callbackMetadata = callbackMetadata; }
    }

    public static class CallbackMetadata {
        @JsonProperty("Item")
        private List<Item> item;

        public List<Item> getItem() { return item; }
        public void setItem(List<Item> item) { this.item = item; }
    }

    public static class Item {
        @JsonProperty("Name")
        private String name;

        @JsonProperty("Value")
        private Object value;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public Object getValue() { return value; }
        public void setValue(Object value) { this.value = value; }
    }
}