# Postal lookup experiment — 2026-10-22

English translation of the historical report, recording the conclusion before clipboard integration. Original inputs and source URLs are preserved. The Polish report remains in Git history.

## Conclusion

Do not enable automatic postcode completion in the main route based on this experiment. The model can find correct data, but two trials did not consistently follow ambiguity rules. At that stage the experiment remained a separate settings page and did not apply results to the route.

## Method

Two real calls to Groq `openai/gpt-oss-20b` used `tools: [{type: "browser_search"}]`, `tool_choice: "required"` and low reasoning effort. Each included the same four public examples. The key was used through existing Arc settings, not copied into reports or files. Neither custom prompts nor order data were sent. JSON Schema was omitted because Groq did not support it with browser_search. JSON was validated locally.

## First trial — 6.6 seconds

| Input | Model result | Assessment |
| --- | --- | --- |
| DE 57 Siegen | No postcode added; multiple postcodes identified | Appropriate caution: the city has several postcodes. |
| Urząd Miejski w Ropczycach, ul. Krisego 1, Poland | PL 39-100 Ropczyce | Matches the independently checked municipal website. The model cited polishdata.eu, whose content could not be independently retrieved; its claimed official-register status was unconfirmed. |
| Stadtverwaltung Siegen, Markt 2, Siegen | DE 57072 Siegen | Country and postcode match the official municipal address. |
| Nowa Wieś | No country/postcode; ambiguous name | Appropriate caution. |

Independent comparison sources:
- https://ropczyce.eu/kontakt/ — Krisego 1, 39-100 Ropczyce.
- https://www.siegen.de/jetzt-stadt-siegen-kontaktieren — Rathaus/Markt 2, 57072 Siegen. The same page lists another postcode for a PO box, which must be distinguished.
- https://www.dastelefonbuch.de/Postleitzahlen/Siegen — multiple postcodes for Siegen.

## Second trial — identical inputs and instruction

Local validation rejected the response because the model supplied a postcode despite an ambiguous result: status ambiguous/not_found with a non-null postcode. Nothing was applied. The full response was not stored, so this report cannot attribute the error to a specific locality.

## Confidence limits

This was a small exploratory test, not an accuracy measurement. Two correct postcodes in the first trial do not demonstrate reliability. Model-generated links alone do not prove source retrieval or correct interpretation. Deployment would require independent address-database validation and a larger set covering conflicts and multiple countries.

## Historical rollback

Recorded full version 1.4.5 backup: `../Trasa-do-Maps-backup-1.4.5-20261022-224052.zip`. ZIP integrity and unchanged parser, clipboard, primary AI-analysis and settings files were verified at the time. Historical restoration instructions are in `INSTALACJA.md`; current Git rollback is in `../RELEASING.md`.
