# Test wyszukiwania kodów — 22.10.2026

## Wniosek

Nie włączać automatycznego uzupełniania kodów w głównej trasie. Model potrafi znaleźć prawidłowe dane, lecz w dwóch próbach nie zachował konsekwentnie reguł dotyczących niejednoznaczności. Eksperyment pozostaje osobną stroną w ustawieniach; nie stosuje wyników do trasy.

## Sposób testowania

Dwa rzeczywiste wywołania Groq `openai/gpt-oss-20b` z `tools: [{type: "browser_search"}]`, `tool_choice: "required"`, reasoning low. Każde obejmowało te same cztery publiczne przykłady. Klucz wykorzystano przez istniejące ustawienia w Arc; nie odczytywano go do raportu ani plików. Własny prompt i dane zlecenia nie były wysyłane. Nie użyto JSON Schema, którego Groq nie obsługuje razem z browser_search. JSON walidowano lokalnie.

## Pierwsza próba — 6,6 s

| Wejście | Wynik modelu | Ocena |
|---|---|---|
| DE 57 Siegen | Brak uzupełnienia kodu; wskazana wielość kodów | Prawidłowa ostrożność; miasto ma kilka kodów. |
| Urząd Miejski w Ropczycach, ul. Krisego 1, Poland | PL 39-100 Ropczyce | Kod zgadza się ze stroną urzędu, sprawdzoną niezależnie. Model podał inne źródło polishdata.eu, którego treści nie udało się niezależnie odczytać; nazwał je oficjalnym rejestrem bez potwierdzenia. |
| Stadtverwaltung Siegen, Markt 2, Siegen | DE 57072 Siegen | Kraj i kod zgodne z oficjalnym adresem urzędu. |
| Nowa Wieś | Brak kraju/kodu, nazwa niejednoznaczna | Prawidłowa ostrożność. |

Źródła do niezależnego porównania:
- https://ropczyce.eu/kontakt/ — Krisego 1, 39-100 Ropczyce.
- https://www.siegen.de/jetzt-stadt-siegen-kontaktieren — Rathaus/Markt 2, 57072 Siegen. Na tej samej stronie jest też inny kod dla skrytki pocztowej, co wymaga rozróżnienia.
- https://www.dastelefonbuch.de/Postleitzahlen/Siegen — kilka kodów dla Siegen.

## Druga próba — ten sam zestaw i instrukcja

Lokalna walidacja odrzuciła odpowiedź: „Model dopisał kod mimo niejednoznacznego wyniku”. Oznacza to status ambiguous/not_found z jednocześnie niepustym postcode. Wynik nie został zastosowany. Pełna odpowiedź nie była zapisywana, więc raport nie przypisuje tego błędu do konkretnej miejscowości.

## Zakres pewności

To mały test eksploracyjny, nie pomiar skuteczności. Dwa poprawne kody w pierwszej próbie nie dowodzą niezawodności. Same linki zwrócone przez model nie są dowodem odczytania i poprawnej interpretacji źródła. Przed wdrożeniem potrzebna byłaby niezależna walidacja w bazie adresowej oraz większy zestaw przypadków, także konfliktów i różnych krajów.

## Cofnięcie

Kopia całej wersji 1.4.5: `../Trasa-do-Maps-backup-1.4.5-20261022-224052.zip`. Sprawdzono integralność ZIP i zgodność niezmienionych plików parsera, kopiowania, głównej analizy AI i ustawień. Instrukcja przywrócenia jest w INSTALACJA.md.
