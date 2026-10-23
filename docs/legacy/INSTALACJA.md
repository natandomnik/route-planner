# Trasa do Maps — instalacja i obsługa (1.5.0)

## Instalacja i aktualizacja

1. Umieść folder rozszerzenia w stałym miejscu.
2. Wpisz `chrome://extensions` w pasku adresu Chrome. To adres strony zarządzania rozszerzeniami, nie opcja w szczegółach wtyczki.
3. Włącz **Tryb dewelopera**, kliknij **Załaduj rozpakowane** i wybierz folder zawierający `manifest.json`.
4. Przypnij **Trasa do Maps — dla spedytora** w menu rozszerzeń.

Przy aktualizacji kliknij **przeładuj ⟳** na kafelku rozszerzenia, zamknij stare okna i karty podglądu, a następnie otwórz wtyczkę ponownie. Wersja powinna wynosić **1.5.0**. Jeśli widzisz starszą wersję, upewnij się, że aktualizujesz ten sam folder, który Chrome załadował. Nowe integracje wymagają dostępu do domen API; zaakceptuj uprawnienia, jeśli Chrome o nie poprosi.

Nie potrzeba Node.js, kompilacji ani klucza API do trybu lokalnego.

## Przygotowanie trasy

- Kliknij ikonę wtyczki, wklej zlecenie — po krótkiej przerwie w pisaniu punkty są automatycznie rozpoznawane lokalnie. **Przelicz lokalnie** pozwala powtórzyć ten krok. Jeśli czegoś brakuje, kliknij **Rozpoznaj przez AI**. Skrót Ctrl+Enter lub ⌘+Enter również uruchamia AI.
- Alternatywnie zaznacz tekst na stronie, kliknij prawym przyciskiem i wybierz **Przygotuj trasę w Google Maps**. Podgląd w osobnej karcie automatycznie analizuje zaznaczenie lokalnie, również gdy skonfigurowano AI.
- Popraw adresy, jeśli potrzeba. Przeciągaj uchwyt z kropkami, aby zmieniać kolejność. Klawiaturą: ustaw fokus na uchwycie i użyj strzałek góra/dół.
- Kliknij linię z plusem między punktami, aby wstawić adres. **⊕ Dodaj punkt** dopisuje adres na końcu. **×** usuwa punkt.
- Po zmianie tekstu źródłowego lokalne rozpoznanie uruchamia się ponownie automatycznie. Ręczne poprawki adresów nie wymagają ponownej analizy.
- **Otwórz trasę w Google Maps** zastępuje bieżącą kartę: aktywną stronę przy użyciu małego okna rozszerzenia albo kartę podglądu przy pracy w osobnej karcie.

Minimum to dwa niepuste adresy, maksimum 11 punktów. A to początek, B to koniec, pozostałe są przystankami. Zbyt długi link jest blokowany. Aby tworzyć trasę ręcznie, kliknij **Przelicz lokalnie** przy pustym tekście i dodaj punkty.

## Ustawienia i dostawcy AI

Kliknij **Ustawienia ⚙** w oknie wtyczki. Link otwiera panel bezpośrednio w nowej karcie.

Dostępne są dwa tryby:

- **Tylko lokalnie** — wbudowany kod, bez wysyłania zlecenia do API i bez opłat za API.
- **Lokalnie + AI na kliknięcie** — wybierz dostawcę, model i wpisz jego klucz API. Pierwsze rozpoznanie nadal odbywa się lokalnie; AI uruchamia dopiero przycisk lub skrót klawiaturowy.

| Dostawca | Modele na liście | Koszt i uwagi |
| --- | --- | --- |
| Google Gemini | Gemini 3.1 Flash-Lite | Limity i opłaty zależą od planu Google. |
| OpenAI | GPT-6 Luna, GPT-5.4 mini | Płatne API, dostęp zależny od konta API. |
| Groq | GPT-OSS 20B, GPT-OSS 120B | Darmowy plan z limitami; wyższe limity w planie płatnym. Użyj klucza **Groq**, mimo że nazwa modelu zawiera `openai/`. |
| OpenRouter | Free Router (`openrouter/free`) | Dobiera dostępny darmowy model. Obowiązują limity; szybkość i jakość mogą się zmieniać. |

Każdy dostawca ma osobno zapamiętywany klucz i model. Dotychczasowy klucz Gemini jest zachowywany przy przejściu na wersję 1.2.0. Zmiany zapisz przyciskiem **Zapisz ustawienia**. Wybór **Inny model…** pozwala wpisać identyfikator modelu tekstowego obsługującego odpowiedzi JSON ze schematem. Inny model może być płatny.

Przełączanie jest ręczne. Jeśli Gemini jest niedostępne, wybierz np. Groq, wpisz klucz Groq, sprawdź połączenie i zapisz ustawienia. Rozszerzenie nie wysyła automatycznie zlecenia do innego dostawcy po błędzie. Sam OpenRouter Free Router wybiera model i dostawcę w ramach swojej usługi.

Klucze:
- Gemini: https://aistudio.google.com/apikey
- OpenAI: https://platform.openai.com/api-keys
- Groq: https://console.groq.com/keys
- OpenRouter: https://openrouter.ai/settings/keys

## Sprawdź połączenie

Przycisk testuje aktualnie wybranego dostawcę, wpisany klucz i model, bez zapisywania ustawień. Wysyła przykładową trasę Warszawa–Berlin przez ten sam mechanizm co analiza zleceń i sprawdza format odpowiedzi oraz obecność dwóch punktów. Nie wysyła Twoich zleceń. Test zużywa tokeny API.

Zielony komunikat potwierdza wynik konkretnego żądania, wskazując model, czas odpowiedzi i godzinę sprawdzenia. Nie jest to stały monitoring. Zmiana dostawcy, modelu lub klucza usuwa poprzedni wynik. Po teście zapisz ustawienia, jeśli je zmieniono.

Błędy 500, 502, 503 i 504 są ponawiane maksymalnie dwukrotnie z rosnącą przerwą; cała analiza ma limit 45 sekund. Błędy klucza, rozliczeń i limitów nie są automatycznie ponawiane. Kod 503 oznacza niedostępność usługi i sam w sobie nie potwierdza ani nie wyklucza poprawności klucza.

## Dane i ograniczenia

Parser lokalny działa na urządzeniu. W trybie AI **cały analizowany tekst** trafia do wybranego dostawcy. OpenRouter przekazuje go także do dostawcy obsługującego wybrany model. Opłaty, limity i przetwarzanie danych zależą od usługi oraz konta.

Klucze i ustawienia są przechowywane w `chrome.storage.local`, bez synchronizacji. Nie jest to szyfrowany sejf. Nie umieszczaj kluczy w plikach rozszerzenia. **Usuń klucz tego dostawcy** usuwa wyłącznie klucz wybranej usługi, zachowując pozostałe; jeśli usługa jest aktywna w zapisanych ustawieniach, włączany jest tryb lokalny.

Szkice są w pamięci sesji przeglądarki i mogą zniknąć po jej zamknięciu lub przeładowaniu rozszerzenia. Ponowne otwarcie szkicu nie wysyła go ponownie do API. Podczas analizy w małym oknie wtyczki pozostaw je otwarte — zamknięcie może przerwać żądanie, które dostawca mógł już naliczyć.

Wyniki AI i parsera wymagają sprawdzenia. Rozszerzenie nie geokoduje adresów, nie potwierdza zgodności miasta z kodem i nie optymalizuje kolejności. Uwagi odnoszą się do pierwotnego rozpoznania i mogą pozostać po ręcznej korekcie. Google Maps korzysta z trybu samochodowego, bez ograniczeń ciężarówek. Po otwarciu trasy adresy są w URL i mogą znaleźć się w historii Chrome.

Uprawnienia: menu kontekstowe, pamięć rozszerzenia oraz dostęp do `generativelanguage.googleapis.com`, `api.openai.com`, `api.groq.com` i `openrouter.ai`. Brak analityki i zewnętrznych bibliotek wykonawczych.

## Weryfikacja

`node --test tests/*.test.cjs` — testy walidacji odpowiedzi, migracji ustawień, izolacji kluczy, żądań do dostawców, ponowień i błędów. Testy są lokalne, z symulowanymi odpowiedziami. Prawdziwe połączenie sprawdzisz w panelu własnym kluczem.

Dokumentacja dostawców sprawdzona 22.10.2026:
- https://developers.openai.com/api/docs/models/gpt-6-luna
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/structured-outputs
- https://openrouter.ai/openrouter/free
- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite

## Instrukcja AI (1.3.0)

W **Ustawienia → Lokalnie + AI na kliknięcie → Instrukcja dla AI — edytuj prompt** znajdziesz dokładną instrukcję systemową wysyłaną do każdego dostawcy oraz wymagany schemat JSON. Instrukcję można edytować. Po kliknięciu **Zapisz ustawienia** własny prompt jest przechowywany lokalnie i używany przy kolejnych analizach przez wszystkich dostawców.

Model dostaje pełny tekst źródłowy bez wstępnego czyszczenia jako osobną wiadomość użytkownika. Instrukcja określa usuwanie metadanych, zachowanie kolejności i powtórzeń oraz uznawanie kraju z samym kodem za punkt. Dla `de 02826 do pl 05 870` oczekiwane punkty to `02826, Germany` i `05-870, Poland`. Parser lokalny również obsługuje polski kod zapisany ze spacją.

Główny widok nie pokazuje szczegółów zapytania ani odpowiedzi JSON. Szczegóły analizy nie są już zapisywane w szkicach. Pozostają adresy do edycji i uwagi dotyczące rozpoznania.

Walidacja sprawdza strukturę JSON i typy danych, a nie to, czy model odnalazł wszystkie punkty lub czy kod istnieje.

## Najpierw lokalnie, potem AI na żądanie (1.3.0)

Wklejenie, wpisanie lub przekazanie zaznaczonego tekstu uruchamia parser lokalny. Nie wywołuje API. Przycisk **Rozpoznaj przez AI** i skrót Ctrl/⌘+Enter wysyłają oryginalny tekst do skonfigurowanego modelu. Nad listą punktów zobaczysz **Rozpoznano lokalnie** albo **Rozpoznano przez AI** z nazwą dostawcy.

Jeśli analiza AI zawiedzie, wcześniejsze punkty i poprawki pozostają dostępne. Po udanej analizie przycisk **Cofnij analizę AI** przywraca listę sprzed ostatniej analizy wraz z ręcznymi poprawkami. Cofanie jest dostępne do zmiany źródła, ponownego rozpoznania lokalnego lub zamknięcia widoku.

Trasa nie jest ograniczona do dwóch punktów. Model ma wyodrębnić wszystkie miejsca załadunku, doładunku, rozładunku i przystanki po drodze. Zdanie „de 02826 do pl 05 870, po drodze rozładunek pl 59 900” powinno dać kolejność DE 02826 → PL 59-900 → PL 05-870. Określenia kolejności przejazdu mają pierwszeństwo przed kolejnością wymienienia adresów w zdaniu. To instrukcja dla modelu, nie gwarancja bezbłędnego rozpoznania — sprawdź wynik. Google Maps otrzymuje każdy punkt pośredni w parametrze `waypoints`.

## Własna instrukcja AI (1.4.0)

Otwórz **Ustawienia → Lokalnie + AI na kliknięcie → Instrukcja dla AI — edytuj prompt**. Zmień tekst i kliknij **Zapisz ustawienia**. Własna instrukcja zastępuje domyślną w całości i pozostaje zapamiętana po zamknięciu przeglądarki oraz przeładowaniu rozszerzenia. Zmiana dostawcy, modelu lub usunięcie klucza nie usuwa zapisanej instrukcji. Usunięcie rozszerzenia lub jego danych usuwa też te ustawienia.

**Przywróć instrukcję domyślną** wypełnia edytor domyślnym tekstem. Zapisz ustawienia, aby zatwierdzić przywrócenie. Nie zapisuj pustego promptu; limit wynosi 20 000 znaków. Schemat odpowiedzi pozostaje stały: JSON z tablicami tekstów `points` i `warnings`. Tekst trasy jest nadal wysyłany osobno jako wiadomość użytkownika.

**Sprawdź połączenie** używa aktualnej zawartości edytora, również przed zapisem. Analiza w oknie trasy używa ostatnio zapisanej instrukcji. Aktualizacje domyślnego promptu nie nadpisują zapisanej własnej instrukcji.

W wersji 1.4.2 pod nagłówkiem wyświetlana jest nazwa dostawcy i pełny identyfikator modelu wybranego w ustawieniach. Dopisek „wyłączony” oznacza, że wybrano tryb tylko lokalny.

## Zmiany w 1.4.2

Pod przyciskiem Google Maps są małe odnośniki do Mapy.com, OSM i HERE. Otwierają stronę danego serwisu w bieżącej karcie, bez przenoszenia punktów trasy.

Domyślna instrukcja AI zachowuje miejscowość przy skróconym kodzie: `DE 57 Siegen ➞ PL 39 Ropczyce` → `Siegen, Germany` → `Ropczyce, Poland`. Nie zgaduje pełnych kodów. Walidacja odrzuca samotne prefiksy kodów DE/PL, pozostawiając poprzednie punkty. Własna zapisana instrukcja nie jest nadpisywana: aby użyć nowej domyślnej, przywróć ją w ustawieniach i zapisz.

## Zmiany w 1.4.3

Usunięto odnośniki do innych map. Ikona kopiowania po prawej stronie przycisku „Dodaj punkt” kopiuje aktualnie przygotowane adresy, każdy w osobnej linii, bez numeracji i strzałek. Zachowuje kolejność, powtórzenia i ręczne poprawki. Przy pustym punkcie, oczekiwaniu na lokalne rozpoznanie lub trwającej analizie kopiowanie jest niedostępne.

## Zmiany w 1.4.4

Kopiowanie oznacza pierwszy punkt `A >`, ostatni `B •`, a pośrednie `+1`, `+2` itd. Adres znajduje się w tej samej linii. Nazwa kraju jest zamieniana na dwuliterowy kod i przenoszona na początek: `A > DE 57072 Siegen`. Zachowywane są dostępne kody, nazwy i szczegóły adresu; brakujące dane nie są zgadywane. Samo kopiowanie nie wywołuje AI ani usług adresowych.

## Zmiany w 1.4.5

Kopiowanie bez liter A/B i numeracji: pierwszy adres kończy się `>`, ostatni `•`, a przystanki pośrednie mają prefiks `+ `.

## Eksperyment w 1.4.6 — wyszukiwanie kodów

W ustawieniach jest link „Eksperyment: sprawdzanie kodów w sieci”. Osobna strona `postal-lab.html` uruchamia na kliknięcie jeden test czterech publicznych przykładów przez Groq GPT-OSS 20B z `browser_search`. Wykorzystuje zapisany klucz profilu Groq niezależnie od aktualnie wybranego dostawcy. Nie zapisuje ustawień ani wyników, nie zmienia punktów, schowka lub własnej instrukcji AI. Limit czasu: 120 s; dostępne anulowanie.

Wynik testów na żywym API: patrz `TEST-KODOW.md`. Funkcja NIE została podłączona do zwykłego rozpoznawania ani kopiowania, ponieważ powtórzenie testu dało sprzeczną odpowiedź.

### Powrót do 1.4.5

Kopia sprzed eksperymentu leży obok folderu wtyczki: `../Trasa-do-Maps-backup-1.4.5-20261022-224052.zip`. Archiwum zawiera folder `Trasa-do-Maps`. Wypakuj je w osobnym miejscu, następnie zastąp pliki w obecnym katalogu rozszerzenia plikami z kopii i przeładuj rozszerzenie. Zachowaj obecną ścieżkę folderu. Dodatkowe pliki `postal-lab.html`, `postal-lab.js`, `postal-lab-ui.js`, `TEST-KODOW.md` oraz testy `tests/postal-lab.*.cjs` można usunąć; stara wersja i tak ich nie wczytuje. Klucz i własny prompt pozostają w pamięci rozszerzenia przeglądarki; archiwum nie zawiera tych ustawień.

## Kopiowanie z kodami w 1.4.7

Kliknięcie ikony kopiowania sprawdza aktualne punkty przez Groq `openai/gpt-oss-20b` z wyszukiwaniem w sieci. Wymaga trybu „Lokalnie + AI na kliknięcie” i zapisanego klucza profilu Groq. Wysyłane są wyłącznie aktualne punkty, bez całej wiadomości zlecenia. Wyszukiwanie może zużywać płatny limit API. Model do sprawdzania kodów jest stały, niezależnie od dostawcy wybranego do czyszczenia tekstu. Używa osobnej instrukcji adresowej, bez zmiany własnego promptu.

Schowek zawiera jeden adres na wiersz, bez A/B, strzałek, plusów i numeracji, np.:

```text
DE Siegen
PL 39-100 Ropczyce
```

Model może zaproponować brakujący kraj i kod, wyłącznie z jednoznacznym statusem i źródłem. Lokalna kontrola sprawdza format kodu, konflikt z podanym krajem i nie nadpisuje istniejących kodów ani nazw/adresów. Nie jest to niezależne potwierdzenie bazy pocztowej — model nadal może się pomylić. Niepewne lub nieobsługiwane uzupełnienia są pomijane. Przy błędzie API, braku klucza, trybie lokalnym lub przekroczeniu 60 s kopiowane są oryginalne punkty, a komunikat informuje o braku uzupełnienia.

Pola trasy pozostają bez zmian. Zmiana trasy w trakcie wyszukiwania zapobiega skopiowaniu starego wyniku. Nie zamykaj małego okna rozszerzenia przed zakończeniem kopiowania. Uprawnienie `clipboardWrite` pozwala zapisać wynik do schowka po oczekiwaniu na API; Chrome może wymagać ponownego włączenia rozszerzenia przy aktualizacji.

Kopia wersji sprzed tej zmiany: `../Trasa-do-Maps-backup-1.4.6-20261022-224621.zip`. Przywracaj pliki do tej samej ścieżki i przeładuj rozszerzenie. Wcześniejszy raport `TEST-KODOW.md` opisuje eksperyment przed włączeniem tej funkcji.

## Wskaźnik kopiowania w 1.4.8

Podczas wyszukiwania kodów i zapisu do schowka ikonę kopiowania zastępuje obracające się kółko. Po sukcesie, błędzie lub anulowaniu wraca ikona kopiowania. Przy systemowym ograniczeniu animacji kółko jest nieruchome.

## Sugestie obszarów A/B w 1.5.0

Przy pierwszym i ostatnim punkcie jest ikona kompasu, po lewej od ×. Kliknięcie wysyła do Groq aktualne punkty trasy, wybrany punkt bazowy i jego rolę. A szuka wokół załadunku, B wokół końcowego rozładunku; cała trasa pozostaje kontekstem. Wyniki to propozycje miejsc poszukiwania przewoźników, a nie potwierdzone oferty ani dostępność aut. Nie zmieniają trasy.

Pod polem adresu pojawia się zawijany rząd etykiet: L/N/S/E/W/HUB 1/HUB 2 oraz KRAJ KOD MIEJSCOWOŚĆ. Ponowne kliknięcie zwija/rozwija wyniki, a podczas wyszukiwania anuluje zapytanie. Edycja dowolnego punktu, zmiana kolejności, analiza lub zmiana ustawień usuwa stare sugestie. Limit oczekiwania: 90 s. Brak klucza, limit API lub brak potwierdzonych wyników daje krótki komunikat pod polem.

Zasady wyodrębniono z pliku użytkownika `06_sugerowanie_punktow_zaladunku.md`: preferencja istotnych ośrodków przemysłowych i drogowych, sąsiad od 10 km, cztery kierunki, dwa najbliższe huby do 115 km. Odrzucono niepoparte danymi procenty i gwarancje dostępności kierowców oraz rozbudowany format nagłówka/tabeli. Źródłowy dokument pozostał niezmieniony.

Model ma sprawdzać kody, rolę logistyczną i dojazd w sieci. Walidacja usuwa duplikaty miejscowości/etykiet, niepełne kody głównych obsługiwanych krajów, brak źródeł oraz zadeklarowane odległości poza 10–115 km. Nie jest to niezależny silnik geokodowania ani routingu: źródła, kierunki i odległości nadal wymagają oceny użytkownika. Lepiej pokazać mniej pozycji niż sztucznie wypełniać siedem kategorii.

W ustawieniach jest osobny wybór modelu sugestii: domyślny `openai/gpt-oss-120b` albo szybszy `openai/gpt-oss-20b`. Oba korzystają z klucza Groq i browser_search; wymagany tryb AI. Limity/koszty zależą od konta Groq. Własny prompt czyszczenia tekstu pozostaje bez zmian. Instrukcję sugestii można podejrzeć w ustawieniach.

Kopia przed zmianą: `../Trasa-do-Maps-backup-1.4.8-20261022-230110.zip`. Przywracaj do tej samej ścieżki i przeładuj rozszerzenie.
