# Változásnapló – Petavira

Minden kiadás a `main` ágra kerül, és a Cloudflare automatikusan élesíti. A verziószám a `sw.js` `V` értéke (`petlife-vNN`), ugyanez az `index.html`-ben az `app.js?v=` paraméter.
A szerveroldali változások (Supabase Edge Functionök, SQL) nem ebben a tárolóban vannak; itt csak a dátumukkal szerepelnek.
A funkcióbővítéseket a nyilvános indulásig csak összefoglalóan soroljuk fel.

## 2026. november

### Tanácsadó – tartós jelzés (2026. nov. 13.)
- **11-13 – v58:** az „Emberek egészségéről nem adhatok tanácsot…” elutasítás a beszélgetésben marad (eddig eltűnt); az AI-nak nem megy el, és nem jelenthető.

### Adatvédelem – e-mail-lenyomat titkos kulccsal (B kör, 2026. nov. 13.)
- **11-13 – szerver (SQL) + tájékoztató:** a regisztrációs védelem e-mail-lenyomata sima SHA-256 helyett HMAC-SHA256, az adatbázisban generált, Vaultban tárolt kulccsal (J25); az élő fiókok lenyomata újraszámolva, a törölt fiókok régi lenyomatai törölve. Az adatvédelmi tájékoztató ennek megfelelően frissítve.

### Tanácsadó – javítások (A2–A3, 2026. nov. 13.)
- **11-13 – v57 + szerver:** ha a kimenet-ellenőrzés eldobja a választ, a semleges hiba helyett biztonsági útmutatás jelenik meg (sürgős tünetnél azonnal állatorvos/ügyelet). Szerver: a kimenet-ellenőrző indoklással dönt (eddig a chatválaszok nagy részét eldobta), pontosítva a mérgezéses és az emberre is átterjedő betegséges válaszokra; keret-visszaírás korláttal; a túl nagy kérés azonnali 413 (SZ22).

### Tanácsadó – adatminimalizálás (A kör, 2026. nov. 12.)
- **11-12 – v56 + szerver:** a Tanácsadó ember egészségéről szóló kérdést nem továbbít az AI-nak (semleges üzenet, tiltás nélkül); a naplóból az emberi egészségadatot tartalmazó sor kimarad, erről a válasz alatt jelzés jelenik meg; „nem állatorvos” jelölés; emberre is átterjedő betegségnél orvoshoz irányítás; a túl nagy kérés azonnali 413-at kap (SZ22).

### Biztonság (független szakértői átnézés feldolgozása, 2026. okt. 28. – nov. 7.)
- **11-07 – szerver:** az értesítés-időzítő jelszava a Supabase Vaultba és a függvény titkai közé került; a függvény minden adatbázishívás előtt, állandó idejű összevetéssel ellenőrzi (SZ16/17, 1. fázis).
- **11-07 – szerver:** sebességkorlát a csomaglekérdezés, a válaszjelentés és az értesítés be-/kikapcsolás útvonalán; a nyilvános értesítési kulcs gyorstárból (SZ4).
- **11-07:** biztonsági fejlécek ellenőrzése – securityheaders.com: A+.
- **11-05 – v54 (#93):** http-linkek: 6 https-re váltva, 6 jelölve („nem titkosított oldal”), védőháló-teszttel (F13).
- **11-05 – #92:** jelszó kétszeri megadása és „Mutasd” gomb a regisztrációnál és az új jelszónál.
- **11-05 – #91:** e-mail-linkek egyszer használatos kóddal (`token_hash` + `verifyOtp`), PKCE; a régi, URL-töredékes tokenek elutasítva (F12).
- **11-05 – #89 + szerver:** fióktörlésnél a jelszót a szerver ellenőrzi; az előzmény-aláírás külön kulccsal, verziózva (SZ6, SZ7).
- **11-05 – szerver:** a Tanácsadó kimenet-ellenőrzésének pontosítása (adagolás nélküli kiegészítő-típus megnevezése engedett).
- **11-03 – #86 + szerver:** adatbázis-jogok szigorítása (alapértelmezett jogosultságok), regisztrációs védelem párhuzamos kérések ellen, semleges hibaüzenet (SZ5, SZ8, SZ9–SZ11, SZ22, SZ23).
- **11-02 – #85:** kliens robusztusság: robotszűrő-állapotok, verziózott `app.js`, tárolt adat ellenőrzése, tizedesvessző (K3, K4, F7, F11, I5).
- **11-02 – #84 + szerver:** szinkronütközés kezelése: verziószám, feltételes írás, háromutas összefésülés (K1, SZ12, SZ13).
- **11-02 – #83:** felhőmentés hibakezelése, fiókváltás közös eszközön (K2, F5, F9, F10).
- **11-02 – szerver:** értesítések: eszközkorlát, adagolt kiküldés, időkeret, pótló futás (SZ1, SZ18, SZ19); napi mentés v2: hitelesített fejléc, 30 napos megőrzés, hibariasztás (SZ2, SZ25, SZ26).

### Jogi és adatvédelmi
- **11-05 – #88:** az ÁSZF és a hozzájárulások szétválasztása; a mentés megőrzése 30 nap a tájékoztatókban; ÁSZF-elfogadás előkészítve (kikapcsolva a jogászi jóváhagyásig).

### Javítások
- **11-05 – #90:** tévesen eltávolított források visszaállítása.
- **11-03 – #87:** a havi linkellenőrzés hibás linkjeinek javítása.

## 2026. október

### Biztonság és adatvédelem
- **10-29 – #82:** `.gitignore` a titkok és az aláírókulcs ellen.
- **10-26 – #64:** korhatár-kapu: a menü és a vezérlők a megerősítésig rejtve.
- **10-24 – #59–#62:** az egész app 18+; meg nem erősített regisztráció törlése 7 nap után; tárolt adat ellenőrzése betöltéskor; jelszócsere után kiléptetés a többi eszközön.
- **10-22 – #57:** CodeQL-lelet javítása.
- **10-21 – #52–#55:** szigorú CSP (`app.js` külön fájlban), értesítés-feliratkozás tulajdonvédelme, regisztrációs védelem.
- **10-17 – 10-18 – #41–#47:** személyes adat kitakarása a Tanácsadónál, válasz jelentése, nyilvános tájékoztató és fióktörlési oldal, impresszum, tájékoztató jelleg minden képernyőn.
- **10-14 – #31:** robotszűrő (Cloudflare Turnstile).
- **10-13 – #30:** biztonsági fejlécek, saját tárhelyről betöltött könyvtár SRI-vel, fotóellenőrzés, jelszószabály.
- **10-12 – #24, #27:** a Tanácsadó rétegzett AI-védelme és hozzájárulása; adatvédelmi funkciók (tájékoztató, adatletöltés, fióktörlés).

### Funkciók és tartalom (összefoglalva)
- **10-28 – 10-29 – #65–#81:** új funkciók és javítások.
- **10-15 – 10-21:** névcsere (PetVia → Petavira), új arculat, fajképek, Google Play-előkészítés.
- **10-10 – 10-12:** az első nyilvános változat: fajok és útmutatók forrásokkal, termékajánlások, örökbefogadási és fajtaklub-listák, naplók, értesítések, Tanácsadó.
