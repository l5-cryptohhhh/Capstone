package org.example.capstone.player.dto;

import org.example.capstone.player.Position;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record PlayerDetailDto(
        Long id,
        String name,
        String firstname,
        String lastname,
        Integer age,
        LocalDate birthDate,
        String nationality,
        Integer heightCm,
        Integer weightKg,
        String photoUrl,
        Position position,
        Instant lastSyncedAt,
        List<SeasonDto> seasons) {
}
