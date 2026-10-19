package org.example.capstone.note;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerNoteRepository extends JpaRepository<PlayerNote, Long> {

    List<PlayerNote> findByUserIdAndPlayerIdOrderByCreatedAtDesc(Long userId, Long playerId);

    long countByUserIdAndPlayerId(Long userId, Long playerId);

    Optional<PlayerNote> findByIdAndUserId(Long id, Long userId);
}
