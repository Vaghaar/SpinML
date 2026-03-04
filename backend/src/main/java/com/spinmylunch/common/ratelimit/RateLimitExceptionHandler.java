package com.spinmylunch.common.ratelimit;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filtre Servlet qui ajoute les headers Retry-After et X-RateLimit-* sur les réponses 429.
 * Fonctionne en complément de GlobalExceptionHandler pour les réponses hors Spring MVC.
 */
@Component
@Order(1)
public class RateLimitExceptionHandler implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        try {
            chain.doFilter(req, res);
        } catch (AppException ex) {
            if (ex.getErrorCode() == ErrorCode.SPIN_RATE_LIMIT) {
                HttpServletResponse httpRes = (HttpServletResponse) res;
                if (!httpRes.isCommitted()) {
                    httpRes.setStatus(429);
                    httpRes.setHeader("Retry-After", "60");
                    httpRes.setHeader("X-RateLimit-Limit",  "10");
                    httpRes.setHeader("X-RateLimit-Remaining", "0");
                    httpRes.setContentType("application/json;charset=UTF-8");
                    httpRes.getWriter().write(
                            "{\"code\":\"SPIN_RATE_LIMIT\",\"message\":\"" + ex.getMessage() + "\"}");
                }
            } else {
                throw ex;
            }
        }
    }
}
