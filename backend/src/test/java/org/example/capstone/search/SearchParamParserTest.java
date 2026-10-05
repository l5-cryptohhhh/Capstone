package org.example.capstone.search;

import org.example.capstone.common.ApiException;
import org.example.capstone.player.Position;
import org.example.capstone.stats.MetricKey;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SearchParamParserTest {

    private static SearchParamParser.Request request(Map<String, String> params) {
        return new SearchParamParser.Request(null, null, null, null, null, null, null, null,
                "minutes", "desc", 0, 20, params);
    }

    @Test
    void parsesPercentileAndValueFiltersTogether() {
        SearchCriteria c = SearchParamParser.parse(request(Map.of(
                "pct.def_actions_p90.min", "70",
                "val.dribbles_success_p90.min", "1.5",
                "val.dribbles_success_p90.max", "4")));

        assertThat(c.filters()).hasSize(2);
        MetricFilter pct = c.filters().stream().filter(f -> f.type() == FilterType.PERCENTILE).findFirst().orElseThrow();
        assertThat(pct.metric()).isEqualTo(MetricKey.DEF_ACTIONS_P90);
        assertThat(pct.min()).isEqualByComparingTo("70");
        assertThat(pct.max()).isNull();
        MetricFilter val = c.filters().stream().filter(f -> f.type() == FilterType.VALUE).findFirst().orElseThrow();
        assertThat(val.min()).isEqualByComparingTo(new BigDecimal("1.5"));
        assertThat(val.max()).isEqualByComparingTo("4");
    }

    @Test
    void acceptsAppearancesAsSort() {
        SearchCriteria c = SearchParamParser.parse(new SearchParamParser.Request(null, null, null, null, null, null,
                null, null, "appearances", "desc", 0, 20, Map.of()));

        assertThat(c.sort()).isEqualTo("appearances");
    }

    @Test
    void ignoresUnrelatedParameters() {
        SearchCriteria c = SearchParamParser.parse(request(Map.of("q", "x", "page", "0", "foo", "bar")));

        assertThat(c.filters()).isEmpty();
    }

    @Test
    void rejectsUnknownMetric() {
        assertThatThrownBy(() -> SearchParamParser.parse(request(Map.of("pct.fantasia_p90.min", "50"))))
                .isInstanceOf(ApiException.class).hasMessageContaining("fantasia_p90");
    }

    @Test
    void rejectsMalformedFilterNames() {
        assertThatThrownBy(() -> SearchParamParser.parse(request(Map.of("pct.goals_p90", "50"))))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> SearchParamParser.parse(request(Map.of("pct.goals_p90.avg", "50"))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsNonNumericAndOutOfRangeValues() {
        assertThatThrownBy(() -> SearchParamParser.parse(request(Map.of("val.goals_p90.min", "tanti"))))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> SearchParamParser.parse(request(Map.of("pct.goals_p90.min", "150"))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void validatesPagingAndSort() {
        assertThatThrownBy(() -> SearchParamParser.parse(new SearchParamParser.Request(
                null, null, null, null, null, null, null, null, "minutes", "desc", 0, 500, Map.of())))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> SearchParamParser.parse(new SearchParamParser.Request(
                null, null, null, null, null, null, null, null, "password", "desc", 0, 20, Map.of())))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> SearchParamParser.parse(new SearchParamParser.Request(
                null, null, 30, 20, null, null, null, null, "minutes", "desc", 0, 20, Map.of())))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void acceptsMetricKeyAsSortAndAscendingOrder() {
        SearchCriteria c = SearchParamParser.parse(new SearchParamParser.Request(
                null, Position.MID, null, 22, null, null, 2024, null, "def_actions_p90", "asc", 0, 20, Map.of()));

        assertThat(c.sort()).isEqualTo("def_actions_p90");
        assertThat(c.descending()).isFalse();
        assertThat(c.position()).isEqualTo(Position.MID);
    }
}
