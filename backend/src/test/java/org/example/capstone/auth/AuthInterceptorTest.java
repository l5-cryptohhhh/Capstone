package org.example.capstone.auth;

import org.example.capstone.auth.AuthService.UserDto;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthInterceptorTest {

    private final AuthService service = Mockito.mock(AuthService.class);
    private final AuthInterceptor interceptor = new AuthInterceptor(service);
    private final RequireAuthInterceptor require = new RequireAuthInterceptor();

    private MockHttpServletRequest request(String authorization) {
        MockHttpServletRequest r = new MockHttpServletRequest();
        if (authorization != null) r.addHeader("Authorization", authorization);
        return r;
    }

    @Test
    void validTokenSetsUser() {
        UserDto user = new UserDto(1L, "a@b.it", "Anna");
        Mockito.when(service.authenticate("tok")).thenReturn(Optional.of(user));
        MockHttpServletRequest r = request("Bearer tok");

        assertTrue(interceptor.preHandle(r, new MockHttpServletResponse(), new Object()));
        assertEquals(user, AuthInterceptor.currentUser(r));
        assertTrue(require.preHandle(r, new MockHttpServletResponse(), new Object()));
    }

    @Test
    void anonymousIsNotBlockedByAuthInterceptorButRejectedByRequireAuth() {
        MockHttpServletRequest r = request(null);

        assertTrue(interceptor.preHandle(r, new MockHttpServletResponse(), new Object()));
        assertNull(AuthInterceptor.currentUser(r));
        assertEquals(ErrorCode.UNAUTHORIZED,
                assertThrows(ApiException.class, () -> require.preHandle(r, new MockHttpServletResponse(), new Object()))
                        .getCode());
    }

    @Test
    void invalidTokenIsTreatedAsAnonymous() {
        Mockito.when(service.authenticate("bad")).thenReturn(Optional.empty());
        MockHttpServletRequest r = request("Bearer bad");

        interceptor.preHandle(r, new MockHttpServletResponse(), new Object());
        assertNull(AuthInterceptor.currentUser(r));
    }
}
