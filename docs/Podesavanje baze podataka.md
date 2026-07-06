# Podešavanje baze podataka

## 1. Instalacija SQL Servera

Preuzmi i instaliraj **SQL Server 2022 Developer** (besplatno):
https://www.microsoft.com/en-us/sql-server/sql-server-downloads

## 2. Instalacija SSMS

Preuzmi i instaliraj **SQL Server Management Studio**:
https://aka.ms/ssmsfullsetup

## 3. Povezivanje na SQL Server

Otvori SSMS:
- **Server name:** `localhost`
- **Authentication:** `Windows Authentication`
- Klikni **Connect**

## 4. Kreiranje baze podataka

Klikni **New Query** u toolbaru, upiši sledeće i klikni **Execute**:
```sql
CREATE DATABASE TravelApp;
```

## 5. Pokretanje migracijskih skripti

U Object Exploreru proširi **Databases** → desni klik na **TravelApp** → **New Query**

Idi na **File → Open → File** i otvori skripte iz foldera `backend\Database\Migrations\` ovim redosledom:

| Redosled | Fajl |
|---|---|
| 1 | `001_CreateAuthSchema.sql` |
| 2 | `002_CreatePlanningSchema.sql` |
| 3 | `003_CreateExpenseSchema.sql` |
| 4 | `004_CreateSharingSchema.sql` |

Za svaku skriptu klikni **Execute**. Trebalo bi da se pojavi poruka: `Commands completed successfully.`

## 6. Provjera

U Object Exploreru proširi **TravelApp → Tables** — trebalo bi da vidiš 7 tabela:
`auth.Users`, `planning.TravelPlans`, `planning.Destinations`, `planning.Activities`, `planning.ChecklistItems`, `expense.Expenses`, `sharing.ShareTokens`

## 7. Connection string

U `appsettings.json` svakog backend servisa provjeri:
```json
"DefaultConnection": "Server=localhost;Database=TravelApp;Trusted_Connection=True;TrustServerCertificate=True;"
```

## 8. Postavljanje admin korisnika

Prvo se registruj u aplikaciji sa emailom koji želiš da bude admin (npr. `admin@travelapp.com`).

Zatim u SSMS-u desni klik na **TravelApp** → **New Query**, upiši sledeće i klikni **Execute**:
```sql
UPDATE auth.Users SET Role = 'Admin' WHERE Email = 'admin@travelapp.com';
```

Nakon toga se odjavi iz aplikacije i ponovo uloguj sa tim nalogom — u navigaciji će se pojaviti **Admin** link.
