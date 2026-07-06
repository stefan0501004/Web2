# Migracije — objašnjenje

## Definicija

Migracija je verzionisana skripta koja opisuje promenu strukture baze podataka. Svaka migracija predstavlja jedan korak u evoluciji baze — kreiranje tabele, dodavanje kolone, izmena constrainta i sl. Skup svih migracija, izvršenih redom, uvek rezultuje istom strukturom baze bez obzira na kom računaru se pokreću.

---

## Gde koristimo migracije

Migracije su 4 SQL skripte u `backend/Database/Migrations/`. Svaka skripta kreira tabele za jedan mikroservis. Pokreću se **ručno jednom** — pri prvom podešavanju baze. Nakon toga ih više ne diramo.

| Skripta | Šema | Tabele |
|---|---|---|
| 001 | `auth` | Users |
| 002 | `planning` | TravelPlans, Destinations, Activities, ChecklistItems |
| 003 | `expense` | Expenses |
| 004 | `sharing` | ShareTokens |

---

## Šta su migracije i zašto ih koristimo?

Migracije su skripte koje definišu strukturu baze podataka — koje tabele postoje, koje kolone imaju, koji su tipovi podataka, koji su constrainti. Umjesto da ručno klikaš po SSMS-u i praviš tabele, imaš fajl koji to radi automatski i koji možeš podijeliti sa nekim drugim. To je posebno važno u timskom radu — svako ko klonuje projekat zna tačno kako treba da izgleda baza.

---

## Zašto 4 skripte, a ne jedna?

Zato što imamo 4 mikroservisa i svaki ima svoju šemu. Razdvajanje skripti prati razdvajanje servisa — `AuthService` ima svoju šemu `auth`, `TravelPlanService` ima `planning`, itd. To je konzistentno sa mikroservisnom arhitekturom gdje svaki servis "posjeduje" svoje podatke.

---

## Zašto je redoslijed bitan?

Skripta 002 kreira tabele koje referenciraju jedne druge (npr. `Destinations` ima foreign key na `TravelPlans`). Ako bi pokušao da kreiraš `Destinations` prije `TravelPlans`, SQL Server bi vratio grešku jer referencirani objekat ne postoji. Unutar jedne skripte redoslijed je već ispravan. Između skripti, 001 mora biti prva jer ostale logički zavise od koncepta da korisnik postoji, a 002 mora biti prije 003 i 004 jer oni referenciraju `TravelPlanId`.

---

## Šta znači `IF NOT EXISTS` na početku svake skripte?

Znači da se skripta može pokrenuti više puta bez greške. Ako tabela već postoji, SQL Server je preskače. Ovo je dobra praksa — skripta je **idempotentna**, tj. rezultat je isti bez obzira koliko puta je pokreneš.

---

## Šta su šeme (`auth`, `planning`, `expense`, `sharing`)?

Šema je kao folder unutar baze podataka. Omogućava grupisanje tabela po logičkim cjelinama. Umjesto da sve tabele budu u defaultnom `dbo` prostoru, svaki servis ima svoju šemu. To vizualno i organizaciono odvaja podatke svakog servisa unutar iste fizičke baze `TravelApp`.

---

## Zašto nema foreign key-eva između šema?

Npr. `expense.Expenses` ima kolonu `TravelPlanId` koja logički pokazuje na `planning.TravelPlans`, ali nema SQL foreign key constraint između njih. Razlog je mikroservisna arhitektura — svaki servis treba da bude što nezavisniji. Ako bi postojao foreign key između šema, brisanje plana bi moralo biti koordinisano na nivou baze, što ruši nezavisnost servisa. Umjesto toga, integritet se čuva na aplikativnom nivou — kad se briše plan, `TravelPlanService` šalje HTTP DELETE zahtjeve ostalim servisima da obrišu svoje podatke.

---

## Šta je `ON DELETE CASCADE`?

Unutar `planning` šeme postoje foreign key-evi između tabela. Na primjer, `Destinations` ima `FK_Destinations_TravelPlans ... ON DELETE CASCADE`. To znači: kad se obriše `TravelPlan`, SQL Server automatski briše sve `Destinations` koje mu pripadaju, pa sve `Activities` koje su vezane za taj plan — bez dodatnog koda. Ovo važi samo unutar iste šeme.

---

## Zašto `UNIQUEIDENTIFIER` (GUID) za ID, a ne `INT`?

Sa `INT` auto-increment ID-jevima, ako imaš više servisa koji upisuju podatke, postoji rizik od kolizije ili potrebe za centralnim generatorom ID-jeva. `GUID` generiše svaki servis samostalno (`NEWID()`) i garantuje jedinstvenost globalno — bez koordinacije između servisa. Ovo je standardna praksa u mikroservisnoj arhitekturi.

---

## Šta su CHECK constrainti i gdje ih koristimo?

`CHECK` constraint je pravilo na nivou baze koje odbija podatke koji ga ne zadovoljavaju. Npr:
- `CK_TravelPlans_Dates` — `EndDate >= StartDate` (krajnji datum ne može biti prije početnog)
- `CK_TravelPlans_Budget` — `Budget >= 0` (budžet ne može biti negativan)
- `CK_Activities_Status` — status mora biti jedan od: `Planned`, `Reserved`, `Completed`, `Cancelled`
- `CK_Users_Role` — uloga mora biti `User` ili `Admin`

Validacija postoji i na backendu (u DTO klasama), ali CHECK constrainti su zadnja linija odbrane — čak i ako neko direktno pristupi bazi, nevaljani podaci ne mogu ući.

---

## Da li koristite EF Core migracije?

Ne, koristimo ručno pisane SQL skripte. EF Core migracije su automatski generisane iz C# modela pomoću `dotnet ef migrations add` komande i čuvaju se kao C# kod. Naš pristup je čistiji za mikroservisnu arhitekturu jer svaka skripta tačno odgovara jednom servisu i ne postoji zavisnost od EF Core alata pri deploymentu.
