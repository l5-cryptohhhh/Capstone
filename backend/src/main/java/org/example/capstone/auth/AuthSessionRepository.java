package org.example.capstone.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {

    @Query("select s from AuthSession s join fetch s.user where s.tokenHash = :hash")
    Optional<AuthSession> findWithUser(@Param("hash") String hash);

    /** Chiude tutte le sessioni dell'utente tranne quella indicata. Restituisce quante ne ha chiuse. */
    @Modifying
    @Query("delete from AuthSession s where s.user.id = :userId and s.tokenHash <> :keep")
    int deleteOthers(@Param("userId") Long userId, @Param("keep") String keep);
}
