package org.example.capstone.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.capstone.common.ApiException;
import org.example.capstone.common.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/** Limita le chiamate a /api/v1/ai/** per IP (finestra fissa di 1 minuto): ogni chiamata costa token. */
@Component
public class AiRateLimitInterceptor implements HandlerInterceptor {

    static final int MAX_PER_MINUTE = 20;
    private static final long WINDOW_MS = 60_000;
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private record Window(long start, int count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final LongSupplier clock;

    public AiRateLimitInterceptor() {
        this(System::currentTimeMillis);
    }

    AiRateLimitInterceptor(LongSupplier clock) {
        this.clock = clock;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long now = clock.getAsLong();
        if (windows.size() > MAX_TRACKED_CLIENTS) {
            windows.values().removeIf(w -> now - w.start() >= WINDOW_MS);
        }
        // getRemoteAddr e non X-Forwarded-For: l'header è falsificabile dal client
        Window updated = windows.merge(request.getRemoteAddr(), new Window(now, 1),
                (old, fresh) -> now - old.start() >= WINDOW_MS ? fresh : new Window(old.start(), old.count() + 1));
        if (updated.count() > MAX_PER_MINUTE) {
            throw new ApiException(ErrorCode.RATE_LIMITED, "Troppe richieste AI: riprova tra un minuto");
        }
        return true;
    }
}
