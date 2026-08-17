# Instalacija i pokretanje — TravelApp

Detaljno, korak-po-korak uputstvo za podizanje kompletnog sistema na novoj mašini: baza, backend (u oba režima — brzi `dotnet run` i pravi Service Fabric deployment) i frontend.

---

## 1. Preduslovi

Instalirati:

| Alat | Verzija | Napomena |
|---|---|---|
| .NET SDK | 8.0+ | za backend servise |
| SQL Server | 2022 Developer/Express | lokalna instanca, `localhost` |
| SQL Server Management Studio (SSMS) | najnovija | za migracije i SQL komande |
| Node.js | 18+ | za frontend |
| npm | dolazi uz Node.js | |
| Git | najnovija | |

**Samo ako planiraš i pravi Service Fabric deployment** (opciono, `dotnet run` režim radi bez ovoga):

| Alat | Napomena |
|---|---|
| Visual Studio 2022 | sa komponentom **Azure Service Fabric Tools** (Visual Studio Installer → Modify → Individual Components → "Service Fabric") |
| Service Fabric SDK | instalira se odvojeno, [aka.ms/servicefabricsdk](https://aka.ms/servicefabricsdk) |

Provera instaliranih verzija:

```bash
dotnet --version
node --version
npm --version
git --version
```

---

## 2. Priprema baze podataka

1. Otvoriti SSMS, konektovati se na `localhost` sa Windows Authentication (čekirati **Trust Server Certificate** ako SSMS traži).
2. Kreirati bazu:
   ```sql
   CREATE DATABASE TravelApp;
   ```
3. Pokrenuti migracije iz `backend/Database/Migrations/` **tačno ovim redosledom** (svaku otvoriti u SSMS-u i Execute):
   ```text
   001_CreateAuthSchema.sql
   002_CreatePlanningSchema.sql
   003_CreateExpenseSchema.sql
   004_CreateSharingSchema.sql
   ```
4. Provera — u bazi treba da postoji 7 tabela:
   ```sql
   SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY 1,2;
   -- auth.Users, planning.TravelPlans, planning.Destinations,
   -- planning.Activities, planning.ChecklistItems, expense.Expenses, sharing.ShareTokens
   ```

Podrazumevani connection string (već podešen u sva 4 `appsettings.json`) je:
```text
Server=localhost;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;
```
Ako SQL Server nije na `localhost` (npr. SQL Express named instance), izmeniti `Server=` u sva 4 fajla:
```text
backend/AuthService/appsettings.json
backend/TravelPlanService/appsettings.json
backend/ExpenseService/appsettings.json
backend/SharingService/appsettings.json
```

---

## 3. Režim A — brzo pokretanje (`dotnet run`, preporučeno za svakodnevni rad)

Backend se sastoji od 4 nezavisna servisa. Pokrenuti svaki u svom terminalu:

```bash
# Terminal 1
cd backend/AuthService
dotnet run --urls "http://localhost:5001"

# Terminal 2
cd backend/TravelPlanService
dotnet run --urls "http://localhost:5002"

# Terminal 3
cd backend/ExpenseService
dotnet run --urls "http://localhost:5003"

# Terminal 4
cd backend/SharingService
dotnet run --urls "http://localhost:5004"
```

Svaki servis treba da ispiše `Now listening on: http://localhost:500X` i `Application started.`

Zatim frontend, u novom terminalu:

```bash
cd frontend
npm install
npm run dev
```

Otvoriti `http://localhost:5173`.

Ovaj režim koristi Windows Authentication ka bazi (tvoj lični Windows nalog) i ne zahteva ništa od Service Fabric infrastrukture — najbrži put da se aplikacija proveri.

---

## 4. Režim B — pravi Service Fabric deployment

Backend je organizovan kao prava Service Fabric aplikacija (`backend/TravelApp.Application`): 3 stateless servisa (`AuthService`, `ExpenseService`, `SharingService`) + 1 stateful servis (`TravelPlanService`, koristi Reliable Collections). Svaki servis prepoznaje automatski da li ga pokreće SF host ili obično `dotnet run` i ponaša se u skladu s tim — nema potrebe da se kod menja između režima.

### 4.1 Podešavanje SQL pristupa za SF servise (jednom po mašini)

Kada Service Fabric host pokrene servis, proces radi pod **drugim Windows identitetom** nego kad ga pokreneš sam sa `dotnet run` (obično Network Service, ne tvoj interaktivni nalog) — `Trusted_Connection=True` tu ne prolazi (dobija se `Login failed for user 'RAČUNAR\IME-MAŠINE$'`). Zato SF deployment koristi poseban SQL login.

**Korak 1 — uključi Mixed Mode Authentication.** Najlakše kroz SSMS (isti alat i konekcija kao u sekciji 2 — `localhost`, Windows Authentication): desni klik na naziv servera u Object Explorer-u (na vrhu stabla, ne na bazu) → **Properties** → **Security** → izabrati **"SQL Server and Windows Authentication mode"** → OK.

Ili isto to kroz **New Query** prozor u SSMS-u (ili `sqlcmd`), izvršiti:
```sql
EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2
```

**Korak 2 — restartuj SQL Server servis** da se promena primeni (obavezno, GUI opcija iz Koraka 1 ovo ne radi sama). Otvoriti **elevated PowerShell** (Start → "PowerShell" → desni klik → "Run as Administrator") i pokrenuti:
```powershell
Restart-Service -Name MSSQLSERVER -Force
```
Alternativa bez PowerShell-a: `services.msc` → naći "SQL Server (MSSQLSERVER)" → desni klik → Restart.

Posle restarta, ako je SSMS otvoren i pokazuje da je konekcija prekinuta — to je očekivano, samo se ponovo konektuj (isto kao i do sada, Windows Authentication).

**Korak 3 — napravi SQL login** i daj mu pristup bazi. Vrati se u SSMS **New Query** prozor (na `TravelApp` bazi) i izvrši:
```sql
CREATE LOGIN [travelapp_sf] WITH PASSWORD = N'TravelApp_SF_2026!', CHECK_POLICY = OFF;
USE TravelApp;
CREATE USER [travelapp_sf] FOR LOGIN [travelapp_sf];
ALTER ROLE db_owner ADD MEMBER [travelapp_sf];
```

Ovi kredencijali su već upisani u `backend/TravelApp.Application/ApplicationParameters/Local.1Node.xml` (parametar `SqlConnectionString`) — ne treba ih ponovo unositi ručno nigde. Ako ih promeniš ovde (drugo korisničko ime/lozinka), ažuriraj i taj fajl da se poklapaju. **Ovaj korak ne utiče na Režim A** — `appsettings.json` i dalje koristi Windows auth kao i do sada, ništa se tu ne menja.

### 4.2 Podizanje lokalnog Service Fabric klastera

1. Pokrenuti **Service Fabric Local Cluster Manager** (traži u Start meniju, ili direktno: `C:\Program Files\Microsoft SDKs\Service Fabric\Tools\ServiceFabricLocalClusterManager\ServiceFabricLocalClusterManager.exe`) — pojavljuje se ikonica u system tray-u (proveri i sakrivene ikonice pored sata).
2. Desni klik na ikonicu → **Setup Local Cluster (1 Node)**. Traje 1-3 minuta.
3. Alternativa direktno kroz elevated PowerShell (radi i bez tray ikonice):
   ```powershell
   & "C:\Program Files\Microsoft SDKs\Service Fabric\ClusterSetup\DevClusterSetup.ps1" -CreateOneNodeCluster -Auto
   ```
4. Provera: otvoriti `http://localhost:19080` (Service Fabric Explorer) — treba da pokaže 1 zdrav node, "Applications: 0" (dok ništa nije deploy-ovano).

Ako je klaster ranije već postojao pa je uklonjen (opcija "Remove Local Cluster"), samo ponovi korak 2 — ništa se ne gubi trajno, `ServiceFabricLocalClusterManager.exe` ostaje instaliran.

### 4.3 Deploy aplikacije kroz Visual Studio

1. Otvoriti `backend/TravelApp.sln` u Visual Studio 2022.
2. Sačekati da se NuGet paketi restore-uju.
3. **Ako se pri prvom build-u pojavi dijalog** "The project 'TravelApp.Application' has incompatible NuGet package installed. Would you like to install the compatible NuGet package?" → kliknuti **Yes** (VS instalira `Microsoft.VisualStudio.Azure.Fabric.MSBuild` koji rešava referenciranje .NET 8 servisa iz `.sfproj`-a). Posle toga uraditi Rebuild Solution.
4. U Solution Explorer-u desni klik na `TravelApp.Application` → **Publish...**
5. U dijalogu:
   - **Target profile**: `PublishProfiles\Local.1Node.xml`
   - **Connection Endpoint**: "Local Cluster" (zeleni check — ne treba nikakav sign-in, "Sign in..." je samo za Azure)
   - **Application parameters file**: automatski se namesti na `ApplicationParameters\Local.1Node.xml`
6. Klikni **Publish**. Prati Output prozor (dropdown → "Service Fabric Tools").

### 4.4 Provera deploy-a

- Service Fabric Explorer (`http://localhost:19080`, refresuj) → `Applications: 1`, `fabric:/TravelApp` sa 4 servisa. `TravelPlanService` označen kao **Stateful** (1 particija, 1 replika), ostala tri kao **Stateless**, svi **Ready/Green**.
- Servisi slušaju na istim portovima kao u Režimu A (5001-5004, definisano u `PackageRoot/ServiceManifest.xml` svakog servisa) — frontend `.env` se ne menja, ne treba mu ništa posebno da zna da su servisi sada pod SF-om umesto pod `dotnet run`.
- Funkcionalna provera (PowerShell ili terminal), pre nego što se uključi frontend:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method Post -ContentType "application/json" -Body '{"firstName":"Test","lastName":"User","email":"test@test.com","password":"Test1234!"}'
  ```
  Treba da vrati JSON sa `token` i `user` poljima.

### 4.5 Pokretanje frontend-a (isto kao u Režimu A)

Deploy iz 4.3 podiže **samo backend**. Frontend se pokreće identično kao u Režimu A — SF deploy ne menja ništa na frontend strani jer servisi i dalje slušaju na istim portovima (5001-5004):

```bash
cd frontend
npm install
npm run dev
```

Otvoriti `http://localhost:5173` — aplikacija sada gađa backend koji radi pod Service Fabric klasterom umesto pod `dotnet run`. Ako su `npm` paketi već instalirani od ranije (npr. iz Režima A), dovoljno je samo `npm run dev`.

### 4.6 Gašenje / povratak na Režim A

- Skidanje aplikacije sa klastera: Service Fabric Explorer → `fabric:/TravelApp` → **Delete**.
- Gašenje celog klastera: tray ikonica → **Stop Local Cluster** (zadržava podešavanje) ili **Remove Local Cluster** (briše ga u potpunosti, ponovo se pravi po koraku 4.2).
- Nema konflikta između režima — možeš slobodno da se vraćaš na `dotnet run` za svakodnevni rad kad god želiš.

---

## 5. Kreiranje admin korisnika

Svaki novoregistrovan korisnik dobija ulogu `User`. Admin rola se dodeljuje ručno u bazi — **korisnik mora prvo da postoji**, znači prvo se registruj kroz aplikaciju (Register forma na frontend-u, ili `POST /api/auth/register`) sa email-om koji planiraš da promoviše, pa tek onda pokreni:

```sql
UPDATE auth.Users
SET Role = 'Admin'
WHERE Email = 'admin@test.com';
```

Provera:

```sql
SELECT FirstName, LastName, Email, Role FROM auth.Users;
```

**Važno:** rola je upisana u JWT token u trenutku login-a. Posle promene role u bazi, korisnik mora da uradi **Logout → Login** (postojeći token u browseru i dalje nosi staru rolu dok se ne uloguje ponovo) da bi mu se u frontend-u pojavio Admin panel.

---

## 6. Test scenario (demo checklist)

1. Registracija novog korisnika
2. Login
3. Kreiranje plana putovanja (naziv, opis, datumi, budžet)
4. Dodavanje 1-2 destinacije
5. Dodavanje aktivnosti (proveriti i calendar prikaz)
6. Dodavanje troškova u različitim kategorijama — proveriti da se budžet/preostalo automatski računa
7. Dodavanje checklist stavki, čekiranje
8. Generisanje share linka (VIEW i EDIT) + QR kod, otvaranje linka u incognito prozoru
9. Dodela Admin role kroz bazu (sekcija 5) → Logout → Login → provera Admin panela (lista svih korisnika i planova)
10. Brisanje plana koji ima trošak i share link → provera da su i povezani zapisi nestali (cascade delete)

---

## 7. Najčešći problemi

### Login/Register vraća grešku (Režim A)

Proveriti: da li SQL Server radi, da li baza `TravelApp` postoji, da li su sve 4 migracije pokrenute, da li `AuthService` radi na 5001.

### Port je zauzet (`address already in use`)

Neki proces već koristi taj port. Naći ga i ugasiti:
```powershell
netstat -ano | findstr ":5001"
taskkill /PID <pid> /F
```

### Frontend se ne otvara na `localhost:5173`

Proveriti da je `npm run dev` i dalje pokrenut u svom terminalu (terminal mora ostati otvoren).

### VS javlja "incompatible NuGet package" pri otvaranju `TravelApp.Application`

Očekivano za `.sfproj` koji referencira .NET 8 servise — klikni **Yes** kad VS ponudi instalaciju kompatibilnog paketa, pa Rebuild Solution (detalji u sekciji 4.3).

### Publish baca `EnvironmentVariable ... is not valid` grešku

Svaka promenljiva koju `ApplicationManifest.xml` override-uje (`EnvironmentOverrides`) mora prvo biti deklarisana u `<EnvironmentVariables>` unutar `<CodePackage>` odgovarajućeg `ServiceManifest.xml`-a. Ako dodaješ novi konfiguracioni parametar, mora se dodati na oba mesta.

### Publish uspe, ali API poziv vraća 500 sa `Login failed for user 'RAČUNAR\IME-MAŠINE$'`

Znak da SQL pristup za SF servise (sekcija 4.1) nije odrađen ili `travelapp_sf` login/user ne postoji u bazi. Ponovi korake iz 4.1, pa Publish ponovo (VS automatski ukloni staru instancu iste verzije i deploy-uje novu sa ažuriranim parametrima).

### Local Cluster Manager ikonica se ne vidi u tray-u

`.exe` ostaje instaliran čak i posle "Remove Local Cluster". Pokreni ga ponovo direktno:
```text
C:\Program Files\Microsoft SDKs\Service Fabric\Tools\ServiceFabricLocalClusterManager\ServiceFabricLocalClusterManager.exe
```

### Admin link se ne vidi u frontend-u posle dodele role

Uraditi Logout → Login (rola je upisana u JWT token pri login-u, ne čita se iz baze uživo na svakom zahtevu frontenda).

---

## 8. Dodatna dokumentacija

- `README.md` (koren projekta) — pregled funkcionalnosti, tehnologija i API ruta
- `docs/architecture-diagram.md` — dijagram arhitekture sistema
- `docs/usecase-diagram.md` — use case dijagram
