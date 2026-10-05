package org.example.capstone.config;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRateLimitInterceptorTest {

    private final AtomicLong now = new AtomicLong(1_000);
    private final AiRateLimitInterceptor interceptor = new AiRateLimitInterceptor(now::get);

    private boolean call(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(ip);
        return interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
    }

    @Test
    void preflightRequestsDoNotConsumeTheLimit() {
        MockHttpServletRequest preflight = new MockHttpServletRequest("OPTIONS", "/api/v1/ai/search");
        preflight.setRemoteAddr("3.3.3.3");
        preflight.addHeader("Origin", "http://localhost:5173");
        preflight.addHeader("Access-Control-Request-Method", "POST");

        for (int i = 0; i < AiRateLimitInterceptor.MAX_PER_MINUTE * 2; i++) {
            assertTrue(interceptor.preHandle(preflight, new MockHttpServletResponse(), new Object()));
        }
        assertTrue(call("3.3.3.3"), "il limite è ancora intero per le chiamate vere");
    }

    @Test
    void blocksAfterLimitPerIpAndResetsNextWindow() {
        for (int i = 0; i < AiRateLimitInterceptor.MAX_PER_MINUTE; i++) {
            assertTrue(call("1.1.1.1"));
        }
        assertEquals(ErrorCode.RATE_LIMITED, assertThrows(ApiException.class, () -> call("1.1.1.1")).getCode());
        assertTrue(call("2.2.2.2"), "un altro IP non è limitato");

        now.addAndGet(60_000);
        assertTrue(call("1.1.1.1"), "nuova finestra");
    }
}
