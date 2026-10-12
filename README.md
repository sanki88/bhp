# Rejestracja i szkolenia BHP

Next.js 16.4 / Node.js 24 / PostgreSQL 18. Aplikacja przechowuje dane wyłącznie w PostgreSQL. Filmy są plikami w trwałym wolumenie, a ich metadane są w bazie. Dane JSON służą tylko do jednorazowej migracji.

## Stan przygotowania

Szczegóły kontroli i rzeczy pozostające przed uruchomieniem: [docs/verification.md](docs/verification.md).

- Aplikacja działa publicznie pod `https://185.193.113.216`, Debian 13.7 amd64 (wersja sprawdzona na serwerze), w Dockerze. HTTP przekierowuje na HTTPS. Login SSH: `root`; tunel nie jest potrzebny do korzystania ze strony.
- Aktualna wersja na VPS: `20261012-ui2`. Po migracji i wykonaniu kopii wyczyszczono dane szkoleniowe na prośbę właściciela, zachowując konta. Przy ostatnim wdrożeniu baza zawierała 0 gości, 0 pytań, 4 konta i 0 filmów.
- Konta administratorów i ochrony są w PostgreSQL; zarządza się nimi w panelu **Użytkownicy**. Lokalny, ignorowany `secrets/local-accounts.txt` zawiera wyłącznie pierwotne hasła i nie aktualizuje się po ich zmianie.
- Nie ma plików filmów szkoleniowych. Należy dodać je przez panel administratora; brak filmu blokuje szkolenie.
- Sprawdzono logowanie obu ról, kontrolę dostępu, restart kontenerów i odtworzenie kopii w osobnym projekcie Compose. Szczegóły uruchomionego wdrożenia: [docs/deployment.md](docs/deployment.md).

## Konta administratorów i ochrony

Zaloguj się do `/admin` i otwórz zakładkę **Użytkownicy**. Wpisz login, wybierz rolę **Administrator** lub **Ochrona** i dwukrotnie wpisz hasło (12–128 znaków). Konto jest aktywne od razu po zapisaniu. Login ma 3–80 znaków i jest zapisywany małymi literami; może zawierać litery a–z, cyfry, kropkę, myślnik oraz podkreślenie.

Na liście kont można zmieniać hasła oraz blokować i odblokowywać dostęp. Zmiana hasła lub blokada kończy wszystkie sesje danego konta. Zmiana własnego hasła wylogowuje administratora. Nie można zablokować ostatniego aktywnego administratora. Ochrona nie ma dostępu do zarządzania kontami; nie ma funkcji publicznej rejestracji pracowników.

## Praca lokalna

Wymagany Node.js 24 i PostgreSQL. `npm ci`, następnie konfiguracja `.env.local`:

```dotenv
DATABASE_URL=postgresql://LOGIN:HASLO@127.0.0.1:5432/bhp
DB_SSL=disable
APP_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
MEDIA_DIR=data/media
```

Dla zewnętrznej bazy wymagającej TLS ustaw `DB_SSL=require`; nie wyłączaj weryfikacji certyfikatu. Baza wewnątrz sieci Dockera używa jawnie `DB_SSL=disable`.

```sh
npm run db:migrate
npm run db:import
npm run user -- create admin admin
npm run user -- create ochrona guard
npm run dev
```

Przygotowana w tym środowisku instancja lokalna korzysta z `.cache/pg-test` i portu 55432, z oddzielnymi bazami `bhp_local` oraz `bhp_test`. Nie zmienia istniejącej usługi PostgreSQL 18. Po ponownym uruchomieniu Windows można ją włączyć w PowerShell:

```powershell
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D 'D:/js/bhp/.cache/pg-test' -l 'D:/js/bhp/.cache/pg-test.log' -o '-p 55432 -h 127.0.0.1' -w start
```

Hasła wprowadzaj w interaktywnym terminalu; skrypt zarządzania kontami nie przyjmuje ich w argumentach. Lokalne hasła przenieś do menedżera haseł i usuń plik z hasłami. Sesje wygasają po 8 godzinach. Zmiana hasła i blokada konta unieważnia jego wszystkie sesje.

## Paczka do przeniesienia

```sh
npm run lint
npm test
npm run build
npm run release
```

Paczka `releases/bhp-*.tar.gz` zawiera kod i spójny odczyt bazy z aktualnymi danymi, kontami (wyłącznie hasze haseł), pytaniami i filmami. Nie zawiera `.env`, sekretów bazy, haseł jawnym tekstem, `.git`, `node_modules` ani danych testowych. Zawiera dane osobowe: przechowuj ją prywatnie i przesyłaj przez SSH. Ogranicz zmiany danych podczas przygotowywania pierwszej paczki. Obraz buduje się na Linuksie; nie przenosimy windowsowego `.next`.

Wariant `npm run release -- --legacy` służy jedynie do danych sprzed migracji, gdy nie skonfigurowano bazy. Standardowa paczka zawsze korzysta z bazy i przerwie pracę, jeśli nie może jej odczytać.

Transfer z Windows (hasło tylko w terminalu SSH):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/send-release.ps1 -Login LOGIN -Archive releases/bhp-TIMESTAMP.tar.gz
```

Zweryfikuj odcisk klucza hosta SSH przy pierwszym połączeniu; skrypt nie wyłącza tej kontroli.

## Pierwsze wdrożenie na Debianie 13

Poniższe czynności wykonujemy po połączeniu SSH i przeglądzie istniejących usług. Docker może wymagać `sudo`; komendy zakładają sesję z dostępem do silnika Dockera.

```sh
ssh LOGIN@185.193.113.216
cd ~/bhp/incoming
sha256sum -c bhp-TIMESTAMP.tar.gz.sha256
umask 077
mkdir -p ../releases/TIMESTAMP
tar -xzf bhp-TIMESTAMP.tar.gz -C ../releases/TIMESTAMP
cd ../releases/TIMESTAMP
```

Jeśli Docker nie jest zainstalowany, przygotowany skrypt korzysta z [oficjalnego repozytorium Docker dla Debiana](https://docs.docker.com/engine/install/debian/) i zatrzymuje się po wykryciu konfliktującego silnika:

```sh
bash scripts/install-docker-debian.sh
```

Konfiguracja nie wymaga Node.js na hoście:

```sh
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/work" -w /work node:24-bookworm-slim node scripts/setup-env.mjs
# Sprawdź .env: APP_ORIGIN, COOKIE_SECURE, BIND_ADDRESS, HTTP_PORT.
bash scripts/deploy.sh
docker compose exec app node scripts/user.mjs list
```

Migracje są transakcyjne. Import jest jednorazowy; następne wdrożenia nie nadpisują danych, pytań ani haseł. Konta lokalne eksportowane do paczki zachowują role i hasła; przed oddaniem aplikacji zmień hasła interaktywnie na serwerze. Jeśli paczka pochodzi ze starych JSON bez kont, utwórz konta poleceniami `create`.

```sh
docker compose exec app node scripts/user.mjs password admin
docker compose exec app node scripts/user.mjs password ochrona
# Dodatkowe indywidualne konto pracownika:
docker compose exec app node scripts/user.mjs create LOGIN guard
# Blokada konta:
docker compose exec app node scripts/user.mjs disable LOGIN
```

Przy konfiguracji domyślnej otwórz drugi lokalny terminal:

```sh
ssh -N -L 8080:127.0.0.1:8080 LOGIN@185.193.113.216
```

Dla obecnego VPS na Windows można uruchomić `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/open-tunnel.ps1`. Hasło SSH podaje się w terminalu. Okno musi pozostać otwarte podczas korzystania z aplikacji; `Ctrl+C` zamyka tunel.

Aplikacja: `http://localhost:8080`, administrator: `/admin`, ochrona: `/ochrona`. `APP_ORIGIN` musi dokładnie odpowiadać adresowi widocznemu w przeglądarce. Podgląd przez tunel używa `COOKIE_SECURE=false`; domena HTTPS wymaga `COOKIE_SECURE=true` i właściwego `APP_ORIGIN=https://...`. Nie wystawiaj HTTP na publicznym interfejsie. Jeśli docelowo ma być VPN, `BIND_ADDRESS` ustaw na jego prywatny adres po sprawdzeniu tunelu i reguł dostępu. Konfiguracja domeny/certyfikatu zależy od wskazanego adresu i istniejącego reverse proxy.

## Publiczny adres IP z HTTPS

Obecny VPS korzysta z tego wariantu. Po pierwszym wdrożeniu, przy wolnych portach 80/443, jako root uruchom:

```sh
bash scripts/enable-public-ip.sh 185.193.113.216
```

Skrypt sprawdza wydanie certyfikatu, uzyskuje certyfikat Let's Encrypt dla IP, włącza `compose.public.yml`, ustawia `APP_ORIGIN=https://185.193.113.216` i `COOKIE_SECURE=true`, a następnie testuje odnowienie certyfikatu. Publiczne porty to 80 (walidacja certyfikatu i przekierowanie na HTTPS) oraz 443. PostgreSQL i Next.js pozostają w sieciach Dockera. Aplikacja nie wymaga tunelu SSH.

Certyfikaty i konto ACME znajdują się w `/opt/bhp/tls/letsencrypt`, poza katalogiem wersji aplikacji. Nie usuwaj tego katalogu przy aktualizacji. Certyfikaty dla IP są krótkoterminowe; timer `bhp-certbot-renew.timer` sprawdza odnowienie co sześć godzin, a po udanym przebiegu przeładowuje Nginx. Test i stan:

```sh
bash scripts/renew-certificates.sh --dry-run
systemctl status bhp-certbot-renew.timer
journalctl -u bhp-certbot-renew.service --no-pager -n 50
```

Po przeniesieniu kodu do nowego katalogu uruchom ponownie `enable-public-ip.sh`, żeby zaktualizować ścieżkę usługi odnawiania. Istniejący certyfikat zostanie zachowany. Zmiana IP lub dodanie domeny wymaga aktualizacji certyfikatu, `PUBLIC_HOST` i `APP_ORIGIN`.

## Kontrola na serwerze

```sh
docker compose ps
docker compose logs --tail=100 app db proxy
curl --fail http://127.0.0.1:8080/api/health
curl -i http://127.0.0.1:8080/api/visitors
```

Health powinien zwrócić 200, rejestr bez zalogowania 401. Następnie sprawdź w przeglądarce logowanie obu ról, pełny film i quiz, wpis w rejestrze, eksport, wylogowanie. Sprawdź również restart `docker compose restart` i zachowanie danych. Limit filmu to 200 MB; obsługiwane rozszerzenia MP4, WebM i Ogg (kodek musi być wspierany przez przeglądarkę). Przyciski języka wymagają osobnych filmów i minimum pięciu pytań.

## Kopie i odtwarzanie

```sh
bash scripts/backup.sh
```

Powstaje `backups/UTC_TIMESTAMP/`: `database.dump`, `media.tar.gz`, konfiguracja i sekrety. Kopia wymaga krótkiej przerwy aplikacji. Skopiuj ją poza serwer i zabezpiecz dostęp. Skrypt nie usuwa starszych kopii ani plików filmów.

Próbę odtwarzania wykonaj w **odrębnym katalogu** z kodem tej wersji i osobnymi wolumenami. Skopiuj sekrety oraz konfigurację z kopii i zmień w testowym `.env`: `COMPOSE_FILE=compose.yml`, `COMPOSE_PROJECT_NAME=bhp_restore`, `BIND_ADDRESS=127.0.0.1`, `HTTP_PORT=18080`, `APP_ORIGIN=http://localhost:18080`, `COOKIE_SECURE=false`. Dzięki temu test nie zajmie publicznych portów działającej aplikacji. Nie uruchamiaj migracji przed odtworzeniem zrzutu do pustej bazy:

```sh
chmod 700 secrets
chmod 444 secrets/db_password secrets/postgres_password
chmod 644 docker/init-db.sh
docker compose up -d --wait db
docker compose exec -T db pg_restore -U bhp -d bhp --exit-on-error < /BEZPIECZNA/SCIEZKA/database.dump
docker compose build app
docker compose run --rm -T --no-deps --entrypoint tar app -C /app/data -xzf - < /BEZPIECZNA/SCIEZKA/media.tar.gz
docker compose up -d --wait
```

Potwierdź liczbę rekordów i odtwarzanie filmów. Nie używaj `docker compose down -v` w działającym wdrożeniu: usuwa wolumeny z danymi.

Uprawnienia są istotne po kopiowaniu pod `umask 077`: katalog `secrets` pozostaje dostępny wyłącznie właścicielowi na hoście, natomiast zamontowane pliki muszą być czytelne dla użytkowników kontenerów. Przy wdrożeniu normalizuje je `scripts/deploy.sh`.

Kopia aplikacji nie zawiera zewnętrznego katalogu `/opt/bhp/tls`. Na odtwarzanym serwerze certyfikat można uzyskać ponownie przez `enable-public-ip.sh`, gdy publiczny adres i porty są już dostępne.

## Aktualizacje i wycofanie

Przed aktualizacją wykonaj backup. Rozpakuj nową wersję w nowym katalogu, skopiuj do niej dotychczasowe `.env` i katalog `secrets`; zachowaj identyczny `COMPOSE_PROJECT_NAME`, aby użyć tych samych wolumenów. Uruchom `bash scripts/deploy.sh`. Każdy udany deploy zapisuje własny tag `APP_VERSION` w `.env`.

Powrót do poprzedniego kodu: wejdź do poprzedniego katalogu i uruchom `docker compose up -d --no-build --wait`. Jest to bezpieczne tylko przy kompatybilnym schemacie. Gdy migracja jest niekompatybilna, przygotuj odtworzenie backupu w odrębnym projekcie i dopiero po sprawdzeniu przełącz ruch. Nie nadpisuj działającej bazy automatycznie.

## Testy integracyjne

`npm run test:integration` wymaga `.cache/test.env` wskazującego wyłącznie lokalną bazę `bhp_test`. Testy czyszczą jej tabele, ale odmawiają pracy z inną nazwą bazy lub hostem. Używają produkcyjnej kompilacji na porcie 3100, danych syntetycznych i osobnego katalogu filmów. Należy uruchomić build przed testem.
