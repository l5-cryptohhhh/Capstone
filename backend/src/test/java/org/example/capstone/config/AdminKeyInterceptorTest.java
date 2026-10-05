package org.example.capstone.config;

import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminKeyInterceptorTest {

    private static boolean call(String configuredKey, String headerValue) {
        AdminKeyInterceptor interceptor = new AdminKeyInterceptor(new SecurityProperties(configuredKey, null));
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (headerValue != null) {
            request.addHeader("X-Admin-Key", headerValue);
        }
        return interceptor.preHandle(request, new MockHttpServletResponse(), new Object());
    }

    @Test
    void acceptsCorrectKey() {
        assertThat(call("secret", "secret")).isTrue();
    }

    @Test
    void lettingBrowserPreflightThroughDoesNotRequireTheKey() {
        AdminKeyInterceptor interceptor = new AdminKeyInterceptor(new SecurityProperties("secret", null));
        MockHttpServletRequest preflight = new MockHttpServletRequest("OPTIONS", "/api/v1/admin/import/run");
        preflight.addHeader("Origin", "http://localhost:5173");
        preflight.addHeader("Access-Control-Request-Method", "POST");

        assertThat(interceptor.preHandle(preflight, new MockHttpServletResponse(), new Object())).isTrue();
    }

    @Test
    void rejectsWrongOrMissingKey() {
        assertThatThrownBy(() -> call("secret", "wrong")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> call("secret", null)).isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsEverythingWhenKeyNotConfigured() {
        assertThatThrownBy(() -> call("", "")).isInstanceOfSatisfying(ApiException.class,
                e -> assertThat(e.getCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
        assertThatThrownBy(() -> call(null, "x")).isInstanceOf(ApiException.class);
    }
}
