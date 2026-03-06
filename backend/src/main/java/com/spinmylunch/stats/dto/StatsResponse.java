package com.spinmylunch.stats.dto;

import java.util.List;

public record StatsResponse(
        List<PlaceCount> topPlaces,
        long             totalSpins
) {
    public record PlaceCount(String label, long count) {}
}
