# Kontrola i wdrożenie — 12 października 2026

Przepływ: rejestracja gościa → aktywny film → losowanie quizu → weryfikacja odpowiedzi na serwerze → PostgreSQL → rejestr administratora/ochrony.

## Naprawione problemy

- Usunięto wpisane w kodzie przeglądarki `admin/1234` i PIN `2468`. Konta i role są w PostgreSQL; hasła są haszowane scrypt z osobną losową solą. Nowe konta nie otrzymują domyślnego hasła.
- API rejestru, eksportu, pytań i filmów sprawdza sesję i rolę przy każdym żądaniu. Ochrona może czytać rejestr, administrator zmieniać dane. Poprawne odpowiedzi są dostępne tylko administratorowi.
- Sesje są losowe, przechowywane w bazie jako SHA-256, wygasają po 8 godzinach, są unieważniane przy wylogowaniu, zmianie hasła lub blokadzie konta. Cookie: HttpOnly, SameSite=Strict, Secure przy HTTPS.
- Mutacje sprawdzają Origin; logowanie i quiz mają limity prób w bazie, a proxy dodatkowe limity żądań i rozmiaru przesyłania.
- Rejestr, język szkolenia, pytania, konta, sesje i metadane filmów są w bazie. Brak DATABASE_URL/sekretu powoduje błąd zamiast cichego przejścia na JSON. Migracje są wersjonowane i transakcyjne.
- Quiz jest przypisany do wydanych przez serwer pytań, języka i rodzaju szkolenia. Transakcja zapobiega podwójnemu zapisowi przy równoległym kliknięciu lub odtworzeniu żądania.
- Usunięto zastępowanie brakującego filmu demonstracją. Filmy są w trwałym wolumenie, obsługiwane strumieniowo z żądaniami Range. Brakujące pliki są wykrywane.
- Zaktualizowano Next.js 16.2.4 do 16.4.0 oraz poprawione zależności przechodnie.
- Docker nie publikuje portu PostgreSQL ani samego Next.js. Konfiguracja bazowa korzysta z 127.0.0.1:8080; wdrożony wariant publiczny udostępnia Nginx na portach 80/443. Aplikacja działa jako użytkownik bez uprawnień root, baza aplikacji używa roli bez uprawnień superużytkownika.

## Weryfikacja

- Aktualizacja `20261012-ui2`: większe kafelki i ikony 40 px, wyśrodkowana zawartość i języki, favicon z oryginalnym logo MAN. Chrome lokalnie i przez publiczny HTTPS: wszystkie cztery języki przy szerokościach 320/390/1440 px, brak poziomego przepełnienia i błędów JavaScript. Sprawdzono również rzeczywiste renderowanie favicon SVG z osadzonym obrazem MAN.
- Walidacja telefonu: testy jednostkowe dozwolonych znaków i nieprawidłowych typów/znaków, w tym znaków nowej linii. Test integracyjny z PostgreSQL potwierdza odrzucenie ośmiu niepoprawnych numerów przez API bez zapisania gościa i bez zużycia próby quizu; następnie poprawny numer `+48 (123) 456-789` zapisuje się z zachowaniem formatowania. Chrome sprawdza blokowanie nieprawidłowego formularza, akceptację dozwolonego formatowania i usuwanie błędu po poprawieniu numeru. Kontrola produkcyjna nie wysyła quizów ani nie tworzy rekordów.
- Po tych zmianach `npm test`, `npm run lint`, `npm run build` i `npm run test:integration` przeszły poprawnie. Build Dockera na VPS również zakończył się sukcesem. Obraz `bhp-app:20261012-ui2` działa; wszystkie trzy kontenery są healthy. Stan przed i po aktualizacji: `0 gości / 0 pytań / 4 konta / 0 filmów`. Odnowienie certyfikatów wskazuje bieżący katalog, timer jest aktywny, ostatnie uruchomienie zakończyło się sukcesem. Publiczny `GET /api/visitors` bez sesji zwraca `401`.

- Odświeżony interfejs: wspólny nagłówek z oryginalnym logo MAN, mniejsze i płynnie skalowane tytuły, uporządkowane odstępy, spokojniejsze tło i cienie, czytelny wybór języka. Usunięto globalne ukrywanie poziomego przepełnienia oraz sztywne szerokości kafelków.
- Chrome, osobna lokalna baza testowa: 73 widoki przy 320/390/768/1440 px, cztery języki i obie grupy szkoleniowe; rzeczywiste logowanie administratora i ochrony. Długie tytuły pytań i filmów wstrzyknięto wyłącznie jako odpowiedzi testowe w przeglądarce. Film, quiz i potwierdzenie z długim nazwiskiem sprawdzono z syntetycznymi odpowiedziami sieciowymi i nagraniem testowym. Brak poziomego przepełnienia strony, obciętych nagłówków i błędów JavaScript. Test tych stanów sprawdza układ, nie potwierdza dostępności rzeczywistych filmów w produkcji.
- Po zmianach interfejsu `npm run lint` i `npm run build` zakończyły się poprawnie. Nie zmieniano procedur zapisu ani struktury bazy.
- Wdrożenie obrazu `bhp-app:20261012-ui` zachowało stan bazy `0 gości / 0 pytań / 4 konta / 0 filmów` sprzed aktualizacji. Wszystkie trzy kontenery healthy; odnowienie certyfikatów wskazuje nowy katalog, timer aktywny i ostatnie uruchomienie zakończone sukcesem.
- Publiczny HTTPS po wdrożeniu: cztery języki strony głównej na 320/390/1440 px, długi niemiecki tytuł szkolenia, obraz MAN, logowanie administratora, wszystkie zakładki i widoczne w całości etykiety nawigacji mobilnej. Widok ochrony na 320 px sprawdzono z konta administratora (uprawnionego do tego panelu). Wcześniejsze hasło ochrony z lokalnego pliku zwróciło 401; nie zmieniano go ani konta. Test roli ochrony na osobnej bazie lokalnej przeszedł poprawnie. Testy produkcyjne nie tworzyły ani nie modyfikowały rekordów biznesowych.

- Rozbudowano `/admin` o zakładkę „Użytkownicy”: tworzenie administratorów i ochrony, zmiana haseł, blokowanie i odblokowanie. API wymaga administratora i poprawnego Origin. Hasze nie są zwracane do przeglądarki.
- Testy nowych kont: obie role, nieprawidłowy login/hasło/rola, duplikaty niezależnie od wielkości liter, unieważnienie sesji po zmianie hasła i blokadzie, ponowne logowanie po odblokowaniu oraz wyścig dwóch żądań blokowania ostatnich administratorów. Zawsze pozostaje aktywny administrator.
- Przeglądarka Chrome na lokalnej bazie testowej: utworzenie obu ról formularzem, walidacja potwierdzenia hasła, logowanie nowym kontem, zmiana hasła i wylogowanie poprzedniej sesji, blokowanie/odblokowanie, widok komputera i telefonu. Brak błędów przeglądarki.
- Panel użytkowników wdrożono w obrazie `bhp-app:20261012-users`. Chrome przez publiczny HTTPS: logowanie istniejących kont, formularz i wybór obu ról, lista bez haszy, anonimowy dostęp do API 401, dostęp ochrony 403. Test produkcyjny nie tworzył ani nie zmieniał kont; operacje zapisu sprawdzono na osobnej bazie testowej.
- Powtórne wdrożenie pomija odczyt starych plików importu, gdy baza zawiera znacznik zakończonego importu. Test regresji potwierdza to również przy niepoprawnym JSON w starych plikach. Dane po aktualizacji: 4 wpisy, 11 pytań, 2 konta, 0 filmów; kontenery aplikacji, bazy i proxy healthy.

- `npm run lint` — poprawnie.
- `npm test` — haszowanie, niezależne sole, prawidłowe i błędne hasła.
- `npm run build` — poprawny build produkcyjny standalone.
- `npm run test:integration` — prawdziwy PostgreSQL 18 na osobnym porcie 55432 i aplikacja produkcyjna na 3100: migracje, powtórny import, renderowanie stron HTTP, uprawnienia, CSRF, sesje, limity logowania, upload i Range, quiz, wyścig dwóch zapisów, blacklist i eksport.
- `npm audit --omit=dev` — 0 podatności zależności produkcyjnych.
- Zaimportowano rzeczywiste dane lokalnie i na zatwierdzony VPS: 4 wpisy osób, 11 pytań, 2 konta z zachowaniem haseł i ról. Oryginalne pliki pozostają jako kopia.
- Pierwszą kontrolę wykonywano bez przeglądarki; później przetestowano w Chrome panel kont na komputerze i telefonie. Pełne odtwarzanie rzeczywistego filmu nadal wymaga dodania materiałów.
- Na Debianie 13.7 zbudowano i uruchomiono obraz `bhp-app:20261012T124345Z`; aplikacja, PostgreSQL i Nginx są healthy. Zweryfikowano UID 1001 aplikacji oraz brak uprawnień superużytkownika dla roli bazy `bhp`.
- Testy przez tunel SSH: strony i health 200, rejestr bez sesji 401, logowanie obu ról 200, odczyt rejestru przez ochronę 200, jej dostęp do administracji 403, obcy Origin 403, wylogowanie unieważnia sesję. Brak filmu prawidłowo blokuje quiz (503).
- Po restarcie wszystkich kontenerów zachowano dane. Kopię `20261012T124853Z` odtworzono od zera w osobnym projekcie Compose: health 200 i zgodność liczby wpisów/pytań/kont/filmów `4/11/2/0`. Tymczasowe kontenery i wolumeny usunięto. Brak rzeczywistych filmów ogranicza ten test do pustego wolumenu; zapis i odczyt próbnego pliku sprawdzono wcześniej w testach integracyjnych.
- Podczas testów Linuksa poprawiono dołączenie sterownika PostgreSQL dla skryptów w obrazie, prawa plików po kopiowaniu oraz kontrolę gotowości bazy (rzeczywiste połączenie rolą aplikacji przez TCP).
- Początkowe wdrożenie korzystało wyłącznie z tunelu SSH. Następnie na prośbę użytkownika włączono publiczny adres `https://185.193.113.216`, z przekierowaniem HTTP, `COOKIE_SECURE=true` i kontrolą Origin dla nowego adresu. Baza i Next.js nadal nie publikują portów.
- Przez publiczny HTTPS sprawdzono zaufanie do certyfikatu IP, strony, logowanie administratora i ochrony, ich uprawnienia, blokadę CSRF i wylogowanie. HTTP zwraca 308 do HTTPS. Let's Encrypt wydał certyfikat, test jego odnowienia przeszedł; włączono sprawdzanie odnowienia co sześć godzin przez systemd.
- Za zgodą użytkownika zapisano kopię poza VPS: `D:/js/bhp/backups/20261012T124853Z`.
- Następnie na żądanie właściciela wyczyszczono dane aplikacji poza kontami. Kopię `20261012T134431Z-before-clear` odtworzono w osobnej bazie i najpierw na niej sprawdzono czyszczenie. Transakcja produkcyjna usunęła 4 wpisy gości i 11 pytań, wyczyściła również próby quizu, metadane filmów, sesje i liczniki limitów. Porównanie wszystkich pól kont w transakcji potwierdziło zachowanie 2 użytkowników bez zmian. Historia migracji i znacznik importu pozostały; baza testowego odtworzenia została usunięta. Bieżący stan danych biznesowych: 0 gości, 0 pytań, 0 filmów, 2 konta.

## Pozostałe sprawy przed udostępnieniem

1. Dodać rzeczywiste filmy dla gości i podwykonawców. Obydwa dotychczasowe wpisy odwoływały się do nieistniejącego pliku `szkolenie-bhp.mp4`. Każdy aktywny język musi mieć właściwy film i minimum 5 pytań.
2. Dodać domenę, gdy użytkownik ją wskaże. Publiczny dostęp z HTTPS działa już dla samego IP.
3. Po dodaniu filmów przejść pełne szkolenie w przeglądarce. Dotychczasowy test przeglądarkowy obejmuje zarządzanie kontami.
4. Ustalić częstotliwość, retencję i miejsce regularnych kopii. Skrypt i pierwsza sprawdzona kopia są przygotowane; automatyczny harmonogram nie został włączony.
5. `npm audit` nadal wskazuje podatność `braces` w narzędziach ESLint (5 zależnych pakietów deweloperskich, brak kompatybilnej poprawki w zgłaszanym łańcuchu). Nie obniżamy ESLint/Next do starej, niezgodnej wersji. Narzędzia te nie są potrzebne w obrazie wykonawczym. Wynik dla zależności produkcyjnych jest sprawdzany oddzielnie.

Przejście filmu jest sygnałem z przeglądarki. Aplikacja nie potwierdza tożsamości osoby ani faktycznej uwagi podczas oglądania; walidacja quizu nie stanowi takiego potwierdzenia. Dotychczasowe łączenie blacklist po telefonie **lub** imieniu i nazwisku zachowano — przy osobach o tych samych danych wymaga ono ostrożności operatora.
