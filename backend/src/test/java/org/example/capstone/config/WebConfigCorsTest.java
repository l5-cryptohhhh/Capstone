package org.example.capstone.config;

import org.example.capstone.auth.AuthInterceptor;
import org.example.capstone.auth.AuthService;
import org.example.capstone.auth.RequireAuthInterceptor;
import org.example.capstone.ingestion.AdminImportController;
import org.example.capstone.ingestion.ImportRunner;
import org.example.capstone.ingestion.ImportService;
import org.example.capstone.ingestion.quota.QuotaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminImportController.class)
@Import({WebConfig.class, AdminKeyInterceptor.class, AiRateLimitInterceptor.class, AuthInterceptor.class,
        RequireAuthInterceptor.class})
@EnableConfigurationProperties(SecurityProperties.class)
@TestPropertySource(properties = {
        "scoutai.security.admin-key=secret",
        "scoutai.security.cors-allowed-origin=http://localhost:5173"})
class WebConfigCorsTest {

    private static final String ALLOWED_ORIGIN = "http://localhost:5173";
    private static final String OTHER_ORIGIN = "http://other.example";
    private static final String STATUS_URL = "/api/v1/admin/import/status";

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AuthService authService;
    @MockitoBean
    private ImportRunner runner;
    @MockitoBean
    private ImportService service;
    @MockitoBean
    private QuotaService quota;

    @Test
    void preflightFromAllowedOriginSucceedsWithoutAdminKey() throws Exception {
        mvc.perform(options(STATUS_URL)
                        .header("Origin", ALLOWED_ORIGIN)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", AdminKeyInterceptor.HEADER))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));
    }

    @Test
    void preflightFromOtherOriginIsRejected() throws Exception {
        mvc.perform(options(STATUS_URL)
                        .header("Origin", OTHER_ORIGIN)
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void actualRequestFromOtherOriginIsRejected() throws Exception {
        mvc.perform(get(STATUS_URL)
                        .header("Origin", OTHER_ORIGIN)
                        .header(AdminKeyInterceptor.HEADER, "secret"))
                .andExpect(status().isForbidden());
    }
}
