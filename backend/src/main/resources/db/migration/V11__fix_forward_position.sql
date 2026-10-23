-- L'API invia "Forward" per gli attaccanti di alcune risposte (es. Raphinha, Gyokeres): non era mappato e il ruolo restava nullo.
UPDATE player SET position = 'ATT' WHERE position IS NULL;
UPDATE player_season_stat SET position = 'ATT' WHERE position IS NULL;
