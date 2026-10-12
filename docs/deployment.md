# Uruchomione wdrożenie — 12 października 2026

- Serwer: `root@185.193.113.216`, Debian 13.7 amd64.
- Katalog: `/opt/bhp/releases/20261012-ui2`.
- Obraz aplikacji: `bhp-app:20261012-ui2`.
- Kontenery: `bhp-app-1`, `bhp-db-1`, `bhp-proxy-1`.
- Trwałe wolumeny: `bhp_postgres_data`, `bhp_media_data`.
- Wejście publiczne: `https://185.193.113.216` na porcie 443. Port 80 przekierowuje na HTTPS i obsługuje walidację certyfikatu.
- Dane przy wdrożeniu nowego wyglądu: 0 wpisów gości, 0 pytań, 4 konta, 0 filmów. Liczby były identyczne przed i po aktualizacji.

## Dostęp

Otwórz `https://185.193.113.216`. Panel administratora: `https://185.193.113.216/admin`; ochrona: `https://185.193.113.216/ochrona`. Tunel SSH nie jest potrzebny. Wejście przez HTTP przekierowuje na HTTPS.

Publiczny wariant jest zapisany w serwerowym `.env`: `COMPOSE_FILE=compose.yml:compose.public.yml`, `APP_ORIGIN=https://185.193.113.216`, `COOKIE_SECURE=true`. Standardowe `docker compose` oraz skrypty wdrożenia i kopii automatycznie uwzględniają tę konfigurację.

Pierwotne konta aplikacji: `admin` oraz `ochrona`; dodatkowe konta są widoczne w zakładce **Użytkownicy**. Plik `D:/js/bhp/secrets/local-accounts.txt` zawiera pierwotne hasła i nie aktualizuje się po ich zmianie w panelu. Przy kontroli nowego wyglądu zapisane tam wcześniejsze hasło konta `ochrona` nie zostało zaakceptowane; nie zmieniano hasła na serwerze. Nie są to dane logowania SSH. Hasła kont są przechowywane na serwerze wyłącznie jako hasze w PostgreSQL.

Nowe konta dodaje administrator w `/admin` → **Użytkownicy**: login, rola Administrator/Ochrona i hasło (12–128 znaków). W tej samej zakładce można zmieniać hasła oraz blokować i odblokowywać konta. Zmiana hasła lub blokada kończy sesje danego konta. Panel chroni ostatniego aktywnego administratora przed zablokowaniem. SSH nie jest potrzebne do zarządzania kontami.

## Operacje na serwerze

```sh
cd /opt/bhp/releases/20261012-ui2
docker compose ps
docker compose logs --tail=100 app
docker compose exec app node scripts/user.mjs password admin
bash scripts/backup.sh
systemctl status bhp-certbot-renew.timer
bash scripts/renew-certificates.sh --dry-run
```

Certyfikat Let's Encrypt dla adresu IP jest w `/opt/bhp/tls/letsencrypt`. Timer sprawdza odnowienie co sześć godzin i przeładowuje Nginx. Test wydania i próbnego odnowienia przeszedł poprawnie. Kontrola publicznego HTTPS potwierdziła zaufany certyfikat, bezpieczne cookies, logowanie obu ról, blokadę anonimowego odczytu rejestru i przekierowanie HTTP 308.

Sprawdzona kopia: `/opt/bhp/releases/20261012T123041861Z/backups/20261012T124853Z`. Została odtworzona w osobnych kontenerach i bazie, z potwierdzeniem stanu aplikacji oraz liczby rekordów. Po uzyskaniu zgody pobrano ją również na komputer do `D:/js/bhp/backups/20261012T124853Z`. Kopie zawierają dane osobowe, hasze kont i sekrety bazy; przechowuj je prywatnie. Odtwarzanie i kolejne wdrożenia opisuje [README](../README.md).

Przed wdrożeniem panelu użytkowników wykonano dodatkową kopię na VPS: `/opt/bhp/releases/20261012T123041861Z/backups/20261012T132833Z`. Poprzedni katalog `/opt/bhp/releases/20261012T123041861Z` i obraz `bhp-app:20261012T124345Z` zachowano do ewentualnego wycofania aktualizacji. Usługa odnowienia certyfikatów korzysta z aktualnego katalogu wdrożenia.

Na prośbę właściciela wyczyszczono rejestr gości (wraz z wynikami i blacklistą), pytania, metadane filmów, próby quizu, sesje i liczniki limitów. Wszystkie pola kont, w tym hasze haseł, role i statusy, zachowano bez zmian. Pozostawiono historię migracji oraz znacznik zakończonego importu, aby kolejne uruchomienie nie przywróciło starych danych. Kopię sprzed czyszczenia `/opt/bhp/releases/20261012-users/backups/20261012T134431Z-before-clear` odtworzono i sprawdzono w osobnej bazie na VPS. Ta kopia pozostaje na serwerze; nie pobierano jej na komputer.

## Pozostałe ustawienia

Aktualizacja `20261012-ui2` powiększa kafelki gości i podwykonawców oraz ich ikony, centruje zawartość i wybór języka, a favicon zastępuje oryginalnym logo MAN. Telefon przyjmuje cyfry, zwykłe spacje i znaki `(`, `)`, `+`, `-`; wymaga co najmniej jednej cyfry, z dotychczasowym limitem 160 znaków. Reguła działa w formularzu i przy zapisie quizu przez API. Komunikaty są dostępne w czterech językach. Poprzedni katalog i obraz `20261012-ui` pozostawiono do wycofania; baza nie wymagała zmian.

Rejestr jest dostępny jako JSON przez `GET /api/visitors`, w postaci `{ "visitors": [...] }`. Wymagana jest sesja administratora lub ochrony; żądanie bez zalogowania zwraca `401`. Po zalogowaniu do panelu można otworzyć ten adres w tej samej przeglądarce. Aplikacja nie udostępnia obecnie osobnych kluczy API.

Odświeżenie interfejsu wdrożono jako osobny obraz i katalog `20261012-ui`, zachowując poprzednią wersję `20261012-users` do wycofania. Zmiany obejmują wygląd, układ na telefonach i teksty interfejsu; nie zmieniają schematu ani danych bazy. Logo MAN zachowano w oryginalnym pliku. Nagłówki i nazwy filmów zawijają się, a tabele przewijają we własnym obszarze. Lokalna kontrola Chrome obejmowała 73 widoki przy szerokościach 320, 390, 768 i 1440 px oraz wszystkie cztery języki.

Należy dodać pytania i rzeczywiste filmy szkoleniowe, sprawdzić pełny przebieg w przeglądarce oraz ustalić regularny harmonogram kopii. Domenę można dodać później; HTTPS działa już dla IP. Szczegóły kontroli: [verification.md](verification.md).
