-- API-Football invia alcuni nomi con entità HTML (es. "D&apos;Ambrosio"): si correggono quelli già salvati.
-- &amp; per ultimo, così "&amp;apos;" non diventa un apostrofo per errore.
UPDATE player SET
    name      = replace(replace(replace(name,      '&apos;', ''''), '&#39;', ''''), '&amp;', '&'),
    firstname = replace(replace(replace(firstname, '&apos;', ''''), '&#39;', ''''), '&amp;', '&'),
    lastname  = replace(replace(replace(lastname,  '&apos;', ''''), '&#39;', ''''), '&amp;', '&')
WHERE name LIKE '%&%' OR firstname LIKE '%&%' OR lastname LIKE '%&%';

UPDATE team SET name = replace(replace(replace(name, '&apos;', ''''), '&#39;', ''''), '&amp;', '&')
WHERE name LIKE '%&%';
