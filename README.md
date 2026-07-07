# TravelApp — Web aplikacija za planiranje putovanja

TravelApp je web aplikacija za organizaciju putovanja. Korisnik može da kreira plan putovanja, doda destinacije, aktivnosti po danima, troškove, checklist stavke i da podeli plan drugim osobama preko share linka ili QR koda.

Projekat je rađen za predmet **Primena veb programiranja u infrastrukturnim sistemima**.

> Napomena: README opisuje osnovni projekat. Dodatna nadogradnja iz poslednje strane specifikacije, kao što su LDAP SSO ili prikaz rute na mapi, nije deo ove implementacije.

---

## Funkcionalnosti

### Autentikacija i korisničke uloge

- registracija korisnika
- logovanje korisnika
- čuvanje JWT tokena na frontend strani
- heširanje lozinki na backend strani pomoću BCrypt-a
- dve korisničke uloge:
  - `User` — običan korisnik
  - `Admin` — administrator
- admin panel za pregled korisnika i planova

### Planovi putovanja

Korisnik može da:

- kreira novi plan putovanja
- pregleda sve svoje planove
- otvori detalje plana
- izmeni plan
- obriše plan

Plan putovanja sadrži:

- naziv
- opis
- početni datum
- krajnji datum
- budžet
- napomene

### Destinacije

U okviru jednog plana korisnik može da doda više destinacija. Destinacija sadrži:

- naziv
- lokaciju
- datum dolaska
- datum odlaska
- opis ili napomenu

Podržano je dodavanje, prikaz, izmena i brisanje destinacija.

### Aktivnosti

Korisnik može da organizuje aktivnosti po danima. Aktivnost sadrži:

- naziv
- datum
- vreme
- lokaciju
- opis
- procenjeni trošak
- status
- opcionu vezu sa destinacijom

Status aktivnosti može biti:

- `Planned`
- `Reserved`
- `Completed`
- `Cancelled`

Aktivnosti se mogu prikazati i kroz calendar/day prikaz.

### Troškovi i budžet

Aplikacija omogućava evidenciju troškova za svaki plan putovanja.

Trošak sadrži:

- naziv
- kategoriju
- iznos
- datum
- opis

Podržane kategorije su:

- `Transport`
- `Accommodation`
- `Food`
- `Tickets`
- `Shopping`
- `Other`

Sistem automatski računa:

- planirani budžet
- ukupno potrošeno
- preostali budžet
- potrošnju po kategorijama

### Checklist / packing lista

Za svaki plan korisnik može da napravi checklistu, na primer:

- pasoš
- punjač
- karta
- rezervacija smeštaja
- kišobran

Checklist stavke se mogu dodavati, čekirati, menjati i brisati.

### Deljenje plana

Korisnik može da generiše share link za plan putovanja.

Postoje dva nivoa pristupa:

- `VIEW` — osoba sa linkom može samo da pregleda plan
- `EDIT` — osoba sa linkom može da izmeni dozvoljene podatke plana

Sistem generiše i QR kod za deljenje. Share token se validira na backend strani, a link može da se poništi opcijom `Revoke`.

---

## Tehnologije

### Frontend

- React
- Vite
- React Router
- Axios
- Bootstrap
- React Bootstrap
- Context API

### Backend

- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- JWT Authentication
- BCrypt.Net
- Microsoft Service Fabric biblioteke
- QRCoder

### Baza podataka

- Microsoft SQL Server
- baza: `TravelApp`
- SQL migracije kroz `.sql` fajlove

---

## Arhitektura sistema

Backend je podeljen na 4 logički odvojena servisa:

| Servis | Port | Odgovornost |
|---|---:|---|
| `AuthService` | 5001 | registracija, login, JWT tokeni, korisnici, admin rola |
| `TravelPlanService` | 5002 | planovi putovanja, destinacije, aktivnosti, checklist |
| `ExpenseService` | 5003 | troškovi i budget summary |
| `SharingService` | 5004 | share tokeni, javni linkovi i QR kodovi |

Frontend aplikacija se pokreće na:

```text
http://localhost:5173
```

Servisi koriste istu SQL Server bazu `TravelApp`, ali odvojene šeme:

| Šema | Tabele |
|---|---|
| `auth` | `Users` |
| `planning` | `TravelPlans`, `Destinations`, `Activities`, `ChecklistItems` |
| `expense` | `Expenses` |
| `sharing` | `ShareTokens` |

---

## Struktura projekta

```text
Web2-main/
├── backend/
│   ├── AuthService/
│   ├── TravelPlanService/
│   ├── ExpenseService/
│   ├── SharingService/
│   ├── Database/
│   │   └── Migrations/
│   │       ├── 001_CreateAuthSchema.sql
│   │       ├── 002_CreatePlanningSchema.sql
│   │       ├── 003_CreateExpenseSchema.sql
│   │       └── 004_CreateSharingSchema.sql
│   └── TravelApp.sln
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── models/
│   │   ├── pages/
│   │   └── services/
│   ├── .env
│   └── package.json
│
└── docs/
    ├── architecture-diagram.md
    └── usecase-diagram.md
```

---

## Preduslovi

Potrebno je instalirati:

- .NET SDK 8.0 ili noviji
- SQL Server 2022 Developer
- SQL Server Management Studio
- Node.js 18+ ili noviji
- npm
- Git
- Visual Studio 2022, opciono, ali korisno za backend

Provera verzija:

```bash
dotnet --version
node --version
npm --version
git --version
```

---

## Podešavanje baze podataka

### 1. Konektovanje na SQL Server

Otvoriti SQL Server Management Studio i povezati se sa:

```text
Server name: localhost
Authentication: Windows Authentication
Trust Server Certificate: checked
```

Ako se pojavi greška za sertifikat, čekirati opciju **Trust Server Certificate**.

### 2. Kreiranje baze

U SSMS-u otvoriti **New Query** i izvršiti:

```sql
CREATE DATABASE TravelApp;
```

### 3. Pokretanje migracija

U bazi `TravelApp` pokrenuti SQL skripte iz foldera:

```text
backend/Database/Migrations/
```

Redosled je bitan:

```text
001_CreateAuthSchema.sql
002_CreatePlanningSchema.sql
003_CreateExpenseSchema.sql
004_CreateSharingSchema.sql
```

Svaku skriptu otvoriti u SSMS-u i kliknuti **Execute**.

Posle uspešnog izvršavanja, u bazi treba da postoje sledeće tabele:

```text
auth.Users
planning.TravelPlans
planning.Destinations
planning.Activities
planning.ChecklistItems
expense.Expenses
sharing.ShareTokens
```

---

## Connection string

Sva 4 backend servisa koriste isti connection string u `appsettings.json` fajlovima:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Ako SQL Server nije na `localhost`, potrebno je izmeniti `Server=` deo u ova 4 fajla:

```text
backend/AuthService/appsettings.json
backend/TravelPlanService/appsettings.json
backend/ExpenseService/appsettings.json
backend/SharingService/appsettings.json
```

Primer za SQL Express:

```json
"DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
```

---

## Pokretanje backend-a

Backend se sastoji od 4 odvojena servisa. Najjednostavnije je pokrenuti ih iz 4 odvojena terminala.

### Terminal 1 — AuthService

```bash
cd backend/AuthService
dotnet run --urls "http://localhost:5001"
```

### Terminal 2 — TravelPlanService

```bash
cd backend/TravelPlanService
dotnet run --urls "http://localhost:5002"
```

### Terminal 3 — ExpenseService

```bash
cd backend/ExpenseService
dotnet run --urls "http://localhost:5003"
```

### Terminal 4 — SharingService

```bash
cd backend/SharingService
dotnet run --urls "http://localhost:5004"
```

Svaki servis treba da ispiše poruku sličnu ovoj:

```text
Now listening on: http://localhost:500X
Application started.
```

---

## Pokretanje frontend-a

U novom terminalu pokrenuti:

```bash
cd frontend
npm install
npm run dev
```

Frontend se zatim otvara na:

```text
http://localhost:5173
```

Ako su paketi već instalirani, dovoljno je samo:

```bash
npm run dev
```

---

## Frontend `.env` fajl

Frontend koristi `.env` fajl za URL-ove backend servisa:

```env
VITE_AUTH_SERVICE_URL=http://localhost:5001
VITE_TRAVEL_PLAN_SERVICE_URL=http://localhost:5002
VITE_EXPENSE_SERVICE_URL=http://localhost:5003
VITE_SHARING_SERVICE_URL=http://localhost:5004
```

Ako se menjaju portovi backend servisa, potrebno je promeniti i ovaj fajl.

---

## Admin korisnik

Prilikom registracije svaki novi korisnik automatski dobija ulogu:

```text
User
```

Admin rola se dodeljuje ručno u bazi.

Primer:

```sql
UPDATE auth.Users
SET Role = 'Admin'
WHERE Email = 'stefan.demo@test.com';
```

Provera korisnika:

```sql
SELECT FirstName, LastName, Email, Role
FROM auth.Users;
```

Nakon promene role potrebno je uraditi **Logout**, pa ponovo **Login**, zato što se rola nalazi u JWT tokenu.

---

## Testiranje aplikacije

Najkraći demo scenario:

1. Registracija novog korisnika
2. Login
3. Kreiranje plana putovanja
4. Dodavanje destinacija
5. Dodavanje aktivnosti
6. Dodavanje troškova
7. Provera budget summary prikaza
8. Dodavanje checklist stavki
9. Generisanje share linka
10. Otvaranje share linka u drugom tabu ili incognito prozoru
11. Dodela admin role kroz bazu
12. Logout/Login
13. Provera Admin panela

Primer podataka za demo:

### Plan

```text
Name: England Weekend Trip
Start date: 2026-08-10
End date: 2026-08-12
Budget: 500
Description: Short trip to London and Oxford.
```

### Destinacije

```text
Name: London
Location: England
Arrival date: 2026-08-10
Departure date: 2026-08-11
Description: Main city for sightseeing.
```

```text
Name: Oxford
Location: England
Arrival date: 2026-08-12
Departure date: 2026-08-12
Description: University city.
```

### Aktivnosti

```text
Name: Visit British Museum
Date: 2026-08-10
Time: 12:00
Location: London
Status: Planned
Estimated cost: 0
```

```text
Name: Oxford walking tour
Date: 2026-08-12
Time: 11:00
Location: Oxford
Status: Planned
Estimated cost: 20
```

### Troškovi

```text
Name: Hotel
Category: Accommodation
Amount: 250
Date: 2026-08-10
```

```text
Name: Train tickets
Category: Transport
Amount: 80
Date: 2026-08-12
```

Ako je budžet 500, a troškovi su 330, aplikacija treba da prikaže da je preostalo 170.

### Checklist

```text
Passport
Phone charger
Train tickets
Umbrella
```

---

## API pregled

### AuthService

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/users              [Admin]
DELETE /api/users/{id}       [Admin]
```

### TravelPlanService

```text
GET    /api/travel-plans
GET    /api/travel-plans/{id}
POST   /api/travel-plans
PUT    /api/travel-plans/{id}
DELETE /api/travel-plans/{id}

GET    /api/travel-plans/{planId}/destinations
POST   /api/travel-plans/{planId}/destinations
PUT    /api/destinations/{id}
DELETE /api/destinations/{id}

GET    /api/travel-plans/{planId}/activities
POST   /api/travel-plans/{planId}/activities
PUT    /api/activities/{id}
DELETE /api/activities/{id}

GET    /api/travel-plans/{planId}/checklist
POST   /api/travel-plans/{planId}/checklist
PUT    /api/checklist/{id}
PATCH  /api/checklist/{id}/toggle
DELETE /api/checklist/{id}

GET    /api/travel-plans/admin/all       [Admin]
DELETE /api/travel-plans/admin/{id}      [Admin]
```

### ExpenseService

```text
GET    /api/travel-plans/{planId}/expenses
POST   /api/travel-plans/{planId}/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
GET    /api/travel-plans/{planId}/budget-summary
```

### SharingService

```text
GET    /api/travel-plans/{planId}/share
POST   /api/travel-plans/{planId}/share
GET    /api/shared/{token}
PUT    /api/shared/{token}
DELETE /api/sharing/{id}
```

---

## Dokumentacija

U folderu `docs/` nalaze se dodatni fajlovi:

```text
docs/architecture-diagram.md
docs/usecase-diagram.md
```

Ovi fajlovi sadrže Mermaid dijagrame arhitekture i use case dijagram.

---

## Najčešći problemi

### Frontend se ne otvara na `localhost:5173`

Proveriti da li je pokrenuto:

```bash
npm run dev
```

Terminal mora ostati otvoren dok aplikacija radi.

### Login/Register vraća grešku

Proveriti:

- da li je SQL Server pokrenut
- da li postoji baza `TravelApp`
- da li su pokrenute sve migracije
- da li radi `AuthService` na portu 5001

### API pozivi ne rade

Proveriti da li rade sva 4 backend servisa:

```text
AuthService        http://localhost:5001
TravelPlanService  http://localhost:5002
ExpenseService     http://localhost:5003
SharingService     http://localhost:5004
```

### Admin link se ne vidi

Posle promene role u bazi potrebno je uraditi:

```text
Logout → Login
```

### Port je zauzet

Ako se pojavi greška `address already in use`, neki proces već koristi taj port. Ugasiti stare terminale ili promeniti port.

---

## Kratak opis za prezentaciju

TravelApp je aplikacija za planiranje putovanja. Korisnik može da kreira plan puta, doda destinacije, organizuje aktivnosti po danima, evidentira troškove i prati preostali budžet. Aplikacija ima checklistu za pripremu puta i mogućnost deljenja plana putem linka ili QR koda. Sistem koristi React frontend, .NET backend podeljen na četiri servisa i SQL Server bazu. Postoje dve role korisnika: običan korisnik i admin.
