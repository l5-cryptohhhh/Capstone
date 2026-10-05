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
