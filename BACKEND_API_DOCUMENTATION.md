# Backend API Dokumentacija - Stanar Plus

## Pregled

- **Upravljanje strukturom zgrada** (Gradovi → Ulice → Ulazi → Stanovi)
- **Upravljanje stanarima** i njihovim podacima
- **Financijsko upravljanje** (dugovanja, pričuve, transakcije)
- **Radni nalozi** (work orders)
- **Dobavljači i predstavnici**
- **Dokumenti** (odluke, ugovori, e-računi)
- **Uplatnice** (payment slips)
- **Dashboard statistike**

---

## Struktura projekta

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection pool
│   │   └── env.js               # Environment variables
│   ├── controllers/
│   │   ├── citiesController.js
│   │   ├── streetsController.js
│   │   ├── buildingsController.js
│   │   ├── apartmentsController.js
│   │   ├── tenantsController.js
│   │   ├── debtorsController.js
│   │   ├── workOrdersController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling middleware
│   │   └── validator.js         # Request validation
│   ├── models/
│   │   ├── City.js
│   │   ├── Street.js
│   │   ├── Building.js
│   │   └── ...
│   ├── routes/
│   │   ├── cities.js
│   │   ├── streets.js
│   │   ├── buildings.js
│   │   └── index.js
│   ├── services/
│   │   ├── cityService.js
│   │   ├── transactionService.js
│   │   └── ...
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   ├── app.js                   # Express app setup
│   └── server.js               # Server entry point
├── migrations/
│   ├── 001_create_cities.sql
│   ├── 002_create_streets.sql
│   └── ...
├── .env
├── package.json
└── README.md
```

---

## Struktura baze podataka

**Napomena:** Sve tablice koriste MySQL InnoDB engine za podršku foreign key constraintima i transakcijama.

### 1. Cities (Gradovi)

```sql
CREATE TABLE cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cities_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `name` - Naziv grada (obavezno, max 100 znakova, unique)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

**Napomena:** Koristi se `utf8mb4` charset za podršku emoji i svih Unicode znakova.

---

### 2. Streets (Ulice)

```sql
CREATE TABLE streets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_city_street (city_id, name),
  INDEX idx_streets_city (city_id),
  INDEX idx_streets_name (name),
  CONSTRAINT fk_streets_city FOREIGN KEY (city_id) 
    REFERENCES cities(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `city_id` - Referenca na grad (obavezno, CASCADE delete)
- `name` - Naziv ulice (obavezno, max 100 znakova)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

**Constraint:** Unique kombinacija `city_id` + `name` (unique_city_street)

---

### 3. Buildings (Ulazi/Zgrade)

```sql
CREATE TABLE buildings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  street_id INT NOT NULL,
  name VARCHAR(20) NOT NULL,
  number VARCHAR(20) NOT NULL,
  iban VARCHAR(34),
  oib VARCHAR(11),
  representative VARCHAR(200),
  representative_phone VARCHAR(50),
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  loan_fee DECIMAL(10, 2) DEFAULT 0,
  reserve_per_sqm DECIMAL(10, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_street_building (street_id, number),
  INDEX idx_buildings_street (street_id),
  INDEX idx_buildings_number (number),
  CONSTRAINT fk_buildings_street FOREIGN KEY (street_id) 
    REFERENCES streets(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `street_id` - Referenca na ulicu (obavezno, CASCADE delete)
- `name` - Naziv ulaza (obavezno, max 20 znakova)
- `number` - Broj ulaza (obavezno, max 20 znakova)
- `iban` - IBAN račun zgrade (opcionalno, max 34 znaka)
- `oib` - OIB zgrade (opcionalno, max 11 znakova)
- `representative` - Ime predstavnika (opcionalno, max 200 znakova)
- `representative_phone` - Telefon predstavnika (opcionalno, max 50 znakova)
- `cleaning_fee` - Mjesečna naknada za čišćenje (DECIMAL, default 0)
- `loan_fee` - Mjesečna naknada za kredit (DECIMAL, default 0)
- `reserve_per_sqm` - Pričuva po kvadratu (DECIMAL, default 0)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

**Constraint:** Unique kombinacija `street_id` + `number` (unique_street_building)

**Izračunate vrijednosti (ne spremaju se u bazu):**
- `debt` - Ukupno dugovanje (suma svih transakcija tipa "charge" minus "payment" za sve stanove)
- `reserve` - Ukupna pričuva (suma svih transakcija tipa "payment" za sve stanove)
- `apartments` - Lista stanova (relacija)

---

### 4. Apartments (Stanovi)

```sql
CREATE TABLE apartments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT NOT NULL,
  number VARCHAR(20) NOT NULL,
  area DECIMAL(10, 2),
  floor INT DEFAULT 0,
  rooms INT,
  owner VARCHAR(200),
  tenant VARCHAR(200),
  contact VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_building_apartment (building_id, number),
  INDEX idx_apartments_building (building_id),
  INDEX idx_apartments_number (number),
  INDEX idx_apartments_tenant (tenant),
  CONSTRAINT fk_apartments_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `building_id` - Referenca na zgradu (obavezno, CASCADE delete)
- `number` - Broj stana (obavezno, max 20 znakova)
- `area` - Površina u m² (opcionalno, DECIMAL)
- `floor` - Kat (opcionalno, INT, default 0)
- `rooms` - Broj soba (opcionalno, INT)
- `owner` - Ime vlasnika (opcionalno, max 200 znakova)
- `tenant` - Ime stanara (opcionalno, max 200 znakova)
- `contact` - Dodatni kontakt (opcionalno, max 100 znakova)
- `email` - Email adresa (opcionalno, max 255 znakova, validacija email formata)
- `phone` - Telefon (opcionalno, max 50 znakova)
- `notes` - Bilješke (opcionalno, TEXT)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

**Constraint:** Unique kombinacija `building_id` + `number` (unique_building_apartment)

**Izračunate vrijednosti (ne spremaju se u bazu):**
- `debt` - Dugovanje stana (suma transakcija tipa "charge" minus "payment")
- `reserve` - Pričuva stana (suma transakcija tipa "payment")
- `transactions` - Lista transakcija (relacija)

---

### 5. Transactions (Transakcije)

```sql
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apartment_id INT NOT NULL,
  type ENUM('charge', 'payment') NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  period VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_transactions_apartment (apartment_id),
  INDEX idx_transactions_date (date),
  INDEX idx_transactions_type (type),
  CONSTRAINT fk_transactions_apartment FOREIGN KEY (apartment_id) 
    REFERENCES apartments(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `apartment_id` - Referenca na stan (obavezno, CASCADE delete)
- `type` - Tip transakcije: `'charge'` (zaduženje) ili `'payment'` (uplata) (obavezno, ENUM)
- `date` - Datum transakcije (obavezno, DATE)
- `amount` - Iznos (obavezno, DECIMAL, pozitivan broj)
- `description` - Opis transakcije (obavezno, TEXT)
- `period` - Razdoblje (opcionalno, npr. "Listopad 2025", max 50 znakova)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

**Napomena:** 
- MySQL ENUM se koristi umjesto CHECK constraint (CHECK nije podržan u starijim verzijama MySQL-a)
- Za izračun salda, `charge` se oduzima od salda, a `payment` se dodaje

---

### 6. Tenants (Stanari)

```sql
CREATE TABLE tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apartment_id INT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address VARCHAR(500),
  city VARCHAR(100),
  area VARCHAR(50),
  monthly_rate DECIMAL(10, 2),
  delivery_method ENUM('email', 'pošta'),
  status ENUM('paid', 'overdue', 'pending') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenants_apartment (apartment_id),
  INDEX idx_tenants_name (name),
  INDEX idx_tenants_email (email),
  INDEX idx_tenants_status (status),
  CONSTRAINT fk_tenants_apartment FOREIGN KEY (apartment_id) 
    REFERENCES apartments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `apartment_id` - Referenca na stan (opcionalno, SET NULL on delete)
- `name` - Ime i prezime stanara (obavezno, max 200 znakova)
- `email` - Email adresa (opcionalno, max 255 znakova)
- `phone` - Telefon (opcionalno, max 50 znakova)
- `address` - Adresa (opcionalno, max 500 znakova)
- `city` - Grad (opcionalno, max 100 znakova)
- `area` - Površina stana (opcionalno, max 50 znakova, npr. "65 m²")
- `monthly_rate` - Mjesečna rata (opcionalno, DECIMAL)
- `delivery_method` - Način dostave: `'email'` ili `'pošta'` (opcionalno)
- `status` - Status: `'paid'`, `'overdue'`, `'pending'` (default 'pending')
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

**Izračunate vrijednosti:**
- `balance` - Saldo (izračunava se iz transakcija povezanog stana)
- `balanceNum` - Numerička vrijednost salda (za sortiranje)

---

### 7. Debtors (Dužnici)

```sql
CREATE TABLE debtors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT,
  apartment_id INT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  months INT DEFAULT 0,
  last_reminder DATE,
  warnings_sent INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_debtors_tenant (tenant_id),
  INDEX idx_debtors_amount (amount),
  INDEX idx_debtors_city (city),
  CONSTRAINT fk_debtors_tenant FOREIGN KEY (tenant_id) 
    REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_debtors_apartment FOREIGN KEY (apartment_id) 
    REFERENCES apartments(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `tenant_id` - Referenca na stanara (opcionalno)
- `apartment_id` - Referenca na stan (opcionalno)
- `name` - Ime dužnika (obavezno, max 200 znakova)
- `email` - Email (opcionalno, max 255 znakova)
- `address` - Adresa (opcionalno, max 500 znakova)
- `city` - Grad (opcionalno, max 100 znakova)
- `amount` - Iznos duga (obavezno, DECIMAL, default 0)
- `months` - Broj mjeseci duga (INTEGER, default 0)
- `last_reminder` - Datum posljednje opomene (opcionalno, DATE)
- `warnings_sent` - Broj poslanih opomena (INTEGER, default 0)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

**Napomena:** Dužnici se mogu generirati automatski iz stanara koji imaju negativan saldo ili se mogu kreirati ručno.

---

### 8. Reminder Archive (Arhiva opomena)

```sql
CREATE TABLE reminder_archive (
  id INT AUTO_INCREMENT PRIMARY KEY,
  debtor_id INT,
  user_name VARCHAR(200) NOT NULL,
  status ENUM('Poslano', 'Neuspješno', 'U tijeku') NOT NULL DEFAULT 'Poslano',
  sent_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reminder_archive_debtor (debtor_id),
  INDEX idx_reminder_archive_date (sent_date),
  CONSTRAINT fk_reminder_archive_debtor FOREIGN KEY (debtor_id) 
    REFERENCES debtors(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `debtor_id` - Referenca na dužnika (opcionalno)
- `user_name` - Ime korisnika kojem je poslana opomena (obavezno, max 200 znakova)
- `status` - Status: `'Poslano'`, `'Neuspješno'`, `'U tijeku'` (default 'Poslano')
- `sent_date` - Datum slanja (obavezno, DATE)
- `created_at` - Datum kreiranja

---

### 9. Work Orders (Radni nalozi)

```sql
CREATE TABLE work_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  building_address VARCHAR(500),
  unit VARCHAR(100),
  date_reported DATE NOT NULL,
  status ENUM('open', 'in-progress', 'completed', 'cancelled') NOT NULL DEFAULT 'open',
  priority ENUM('urgent', 'high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  assigned_to VARCHAR(200),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_work_orders_building (building_id),
  INDEX idx_work_orders_status (status),
  INDEX idx_work_orders_priority (priority),
  INDEX idx_work_orders_date (date_reported),
  CONSTRAINT fk_work_orders_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `building_id` - Referenca na zgradu (opcionalno)
- `title` - Naslov radnog naloga (obavezno, max 200 znakova)
- `description` - Opis problema/rada (opcionalno, TEXT)
- `building_address` - Adresa zgrade (opcionalno, max 500 znakova)
- `unit` - Jedinica (opcionalno, npr. "Stan 5" ili "Zajedničko", max 100 znakova)
- `date_reported` - Datum prijave (obavezno, DATE)
- `status` - Status: `'open'`, `'in-progress'`, `'completed'`, `'cancelled'` (default 'open')
- `priority` - Prioritet: `'urgent'`, `'high'`, `'medium'`, `'low'` (default 'medium')
- `assigned_to` - Dodijeljeno (opcionalno, max 200 znakova)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

---

### 10. Representatives (Predstavnici)

```sql
CREATE TABLE representatives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  oib VARCHAR(11),
  iban VARCHAR(34),
  monthly_income DECIMAL(10, 2) DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_representatives_building (building_id),
  INDEX idx_representatives_status (status),
  CONSTRAINT fk_representatives_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `building_id` - Referenca na zgradu (opcionalno)
- `name` - Ime i prezime (obavezno, max 200 znakova)
- `email` - Email (opcionalno, max 255 znakova)
- `phone` - Telefon (opcionalno, max 50 znakova)
- `oib` - OIB (opcionalno, max 11 znakova)
- `iban` - IBAN (opcionalno, max 34 znaka)
- `monthly_income` - Mjesečni prihod (DECIMAL, default 0)
- `status` - Status: `'active'` ili `'inactive'` (default 'active')
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

---

### 11. Suppliers (Dobavljači)

```sql
CREATE TABLE suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  iban VARCHAR(34),
  oib VARCHAR(11),
  contact VARCHAR(100),
  email VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suppliers_name (name),
  INDEX idx_suppliers_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `name` - Naziv dobavljača (obavezno, max 200 znakova)
- `category` - Kategorija (opcionalno, npr. "Energija", "Komunalije", "Čišćenje", "Održavanje", max 100 znakova)
- `iban` - IBAN (opcionalno, max 34 znaka)
- `oib` - OIB (opcionalno, max 11 znakova)
- `contact` - Kontakt (opcionalno, max 100 znakova)
- `email` - Email (opcionalno, max 255 znakova)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

**Izračunate vrijednosti (iz invoices tablice):**
- `monthlyAverage` - Prosječna mjesečna vrijednost računa
- `yearlyTotal` - Ukupna godišnja vrijednost računa
- `lastInvoice` - Datum posljednjeg računa

---

### 12. Invoices (Računi)

```sql
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  building_id INT,
  invoice_number VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'booked', 'paid', 'cancelled') DEFAULT 'pending',
  category VARCHAR(100),
  accounting_group VARCHAR(200),
  payment_date DATE,
  type ENUM('xml', 'manual', 'scan') DEFAULT 'manual',
  xml_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoices_supplier (supplier_id),
  INDEX idx_invoices_building (building_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_date (date),
  CONSTRAINT fk_invoices_supplier FOREIGN KEY (supplier_id) 
    REFERENCES suppliers(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `supplier_id` - Referenca na dobavljača (opcionalno)
- `building_id` - Referenca na zgradu (opcionalno)
- `invoice_number` - Broj računa (obavezno, max 100 znakova)
- `date` - Datum računa (obavezno, DATE)
- `due_date` - Datum dospijeća (opcionalno, DATE)
- `amount` - Iznos (obavezno, DECIMAL)
- `status` - Status: `'pending'`, `'booked'`, `'paid'`, `'cancelled'` (default 'pending', ENUM)
- `category` - Kategorija (opcionalno, max 100 znakova)
- `accounting_group` - Računovodstvena grupa (opcionalno, max 200 znakova)
- `payment_date` - Datum plaćanja (opcionalno, DATE)
- `type` - Tip: `'xml'`, `'manual'`, `'scan'` (default 'manual', ENUM)
- `xml_data` - XML podaci (opcionalno, JSON - MySQL 5.7+ podrška za JSON tip)
- `created_at` - Datum kreiranja (automatski)
- `updated_at` - Datum ažuriranja (automatski se ažurira)

---

### 13. Decisions (Odluke)

```sql
CREATE TABLE decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  date DATE NOT NULL,
  building_address VARCHAR(500),
  status ENUM('active', 'archived') DEFAULT 'active',
  pdf_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_decisions_building (building_id),
  INDEX idx_decisions_status (status),
  INDEX idx_decisions_date (date),
  CONSTRAINT fk_decisions_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `building_id` - Referenca na zgradu (opcionalno)
- `number` - Broj odluke (obavezno, max 50 znakova, npr. "01/2025")
- `title` - Naslov odluke (obavezno, max 500 znakova)
- `date` - Datum odluke (obavezno, DATE)
- `building_address` - Adresa zgrade (opcionalno, max 500 znakova)
- `status` - Status: `'active'` ili `'archived'` (default 'active')
- `pdf_url` - URL PDF dokumenta (opcionalno, max 500 znakova)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

---

### 14. Contracts (Ugovori)

```sql
CREATE TABLE contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building_id INT,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  contractor VARCHAR(200) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE,
  building_address VARCHAR(500),
  amount DECIMAL(10, 2),
  status ENUM('active', 'archived') DEFAULT 'active',
  pdf_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contracts_building (building_id),
  INDEX idx_contracts_status (status),
  INDEX idx_contracts_date_from (date_from),
  CONSTRAINT fk_contracts_building FOREIGN KEY (building_id) 
    REFERENCES buildings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `building_id` - Referenca na zgradu (opcionalno)
- `number` - Broj ugovora (obavezno, max 50 znakova, npr. "UG-01/2025")
- `title` - Naslov ugovora (obavezno, max 500 znakova)
- `contractor` - Ime izvođača (obavezno, max 200 znakova)
- `date_from` - Datum početka (obavezno, DATE)
- `date_to` - Datum završetka (opcionalno, DATE)
- `building_address` - Adresa zgrade (opcionalno, max 500 znakova)
- `amount` - Iznos ugovora (opcionalno, DECIMAL)
- `status` - Status: `'active'` ili `'archived'` (default 'active')
- `pdf_url` - URL PDF dokumenta (opcionalno, max 500 znakova)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

---

### 15. Payment Slips (Uplatnice)

```sql
CREATE TABLE payment_slips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period VARCHAR(50) NOT NULL UNIQUE,
  date DATE NOT NULL,
  count INT NOT NULL DEFAULT 0,
  email_count INT DEFAULT 0,
  print_count INT DEFAULT 0,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payment_slips_period (period),
  INDEX idx_payment_slips_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Polja:**
- `id` - INT AUTO_INCREMENT primarni ključ
- `period` - Razdoblje (obavezno, npr. "Listopad 2025", max 50 znakova, unique)
- `date` - Datum kreiranja (obavezno, DATE)
- `count` - Ukupan broj uplatnica (INTEGER, default 0)
- `email_count` - Broj poslanih emailom (INTEGER, default 0)
- `print_count` - Broj poslanih poštom (INTEGER, default 0)
- `amount` - Ukupan iznos (DECIMAL, default 0)
- `created_at` - Datum kreiranja
- `updated_at` - Datum ažuriranja

**Constraint:** Unique `period`

---

## API Endpointi

### Base URL
```
/api/v1
```

### Autentifikacija
Svi endpointi zahtijevaju Bearer token u Authorization headeru:
```
Authorization: Bearer <token>
```

---

### 1. Cities (Gradovi)

#### GET /cities
Dohvaća sve gradove s ugniježdenim podacima (ulice, zgrade, stanovi).

**Query parametri:** Nema

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Vinkovci",
    "totalApartments": 45,
    "totalDebt": 1234.56,
    "streets": [
      {
        "id": 1,
        "name": "Antuna Starčevića",
        "buildings": [
          {
            "id": 1,
            "name": "15",
            "number": "15",
            "iban": "HR9242485293857229485",
            "oib": "12345678901",
            "representative": "Alerić Mato",
            "representativePhone": "+385 91 123 4567",
            "fees": {
              "cleaning": 95.5,
              "loan": 180,
              "reservePerSqm": 1.85
            },
            "debt": 0,
            "reserve": 2086.95,
            "apartments": [
              {
                "id": 1,
                "number": "1",
                "area": 60,
                "floor": 0,
                "rooms": 2,
                "owner": "Mato Galić",
                "tenant": "Mato Galić",
                "contact": "+385 91 123 4567",
                "email": "gali.mato@gmail.com",
                "phone": "+385 91 123 4567",
                "debt": 0,
                "reserve": 650.50,
                "transactions": []
              }
            ]
          }
        ]
      }
    ]
  }
]
```

**Napomena:** `totalApartments` i `totalDebt` se izračunavaju iz ugniježdenih podataka.

---

#### POST /cities
Kreira novi grad.

**Request Body:**
```json
{
  "name": "Zagreb"
}
```

**Validacija:**
- `name`: obavezno, string, min 1 znak, max 100 znakova, unique

**Response 201:**
```json
{
      "id": 1,
  "name": "Zagreb",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

#### PUT /cities/:id
Ažurira grad.

**Request Body:**
```json
{
  "name": "Zagreb"
}
```

**Response 200:**
```json
{
      "id": 1,
  "name": "Zagreb",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

---

#### DELETE /cities/:id
Briše grad (CASCADE briše sve povezane ulice, zgrade i stanove).

**Response 204:** No Content

---

### 2. Streets (Ulice)

#### POST /streets
Kreira novu ulicu.

**Request Body:**
```json
{
  "cityId": 1,
  "name": "Ilica"
}
```

**Validacija:**
- `cityId`: obavezno, INT, mora postojati u bazi
- `name`: obavezno, string, min 1 znak, max 100 znakova
- Unique constraint: `cityId` + `name`

**Response 201:**
```json
{
      "id": 1,
      "city_id": 1,
  "name": "Ilica",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

#### PUT /streets/:id
Ažurira ulicu.

**Request Body:**
```json
{
  "name": "Nova Ilica"
}
```

**Response 200:** (kao POST)

---

#### DELETE /streets/:id
Briše ulicu (CASCADE briše sve povezane zgrade i stanove).

**Response 204:** No Content

---

### 3. Buildings (Ulazi/Zgrade)

#### POST /buildings
Kreira novu zgradu.

**Request Body:**
```json
{
  "streetId": 1,
  "number": "15",
  "name": "15",
  "iban": "HR9242485293857229485",
  "oib": "12345678901",
  "representative": "Alerić Mato",
  "representativePhone": "+385 91 123 4567",
  "cleaningFee": 95.5,
  "loanFee": 180,
  "reservePerSqm": 1.85
}
```

**Validacija:**
- `streetId`: obavezno, INT
- `number`: obavezno, string, min 1 znak, max 20 znakova
- `name`: obavezno, string, max 20 znakova
- `iban`: opcionalno, string, max 34 znaka
- `oib`: opcionalno, string, max 11 znakova
- `representative`: opcionalno, string, max 200 znakova
- `representativePhone`: opcionalno, string, max 50 znakova
- `cleaningFee`: opcionalno, decimal >= 0
- `loanFee`: opcionalno, decimal >= 0
- `reservePerSqm`: opcionalno, decimal >= 0
- Unique constraint: `streetId` + `number`

**Response 201:**
```json
{
      "id": 1,
      "street_id": 1,
  "name": "15",
  "number": "15",
  "iban": "HR9242485293857229485",
  "oib": "12345678901",
  "representative": "Alerić Mato",
  "representative_phone": "+385 91 123 4567",
  "cleaning_fee": 95.5,
  "loan_fee": 180,
  "reserve_per_sqm": 1.85,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

#### PUT /buildings/:id
Ažurira zgradu.

**Request Body:** (kao POST, sve polja opcionalno osim `id`)

**Response 200:** (kao POST)

---

#### DELETE /buildings/:id
Briše zgradu (CASCADE briše sve povezane stanove i transakcije).

**Response 204:** No Content

---

### 4. Apartments (Stanovi)

#### POST /apartments
Kreira novi stan.

**Request Body:**
```json
{
  "buildingId": 1,
  "number": "1",
  "area": 60,
  "floor": 0,
  "rooms": 2,
  "owner": "Mato Galić",
  "tenant": "Mato Galić",
  "contact": "+385 91 123 4567",
  "email": "gali.mato@gmail.com",
  "phone": "+385 91 123 4567",
  "notes": "Bilješke o stanu"
}
```

**Validacija:**
- `buildingId`: obavezno, INT
- `number`: obavezno, string, min 1 znak, max 20 znakova
- `area`: opcionalno, decimal > 0, max 10000
- `floor`: opcionalno, integer, min -1, max 50
- `rooms`: opcionalno, integer, min 0, max 50
- `owner`: opcionalno, string, max 200 znakova
- `tenant`: opcionalno, string, max 200 znakova
- `contact`: opcionalno, string, max 100 znakova
- `email`: opcionalno, validan email format, max 255 znakova
- `phone`: opcionalno, string, max 50 znakova
- `notes`: opcionalno, string, max 1000 znakova
- Unique constraint: `buildingId` + `number`

**Response 201:**
```json
{
      "id": 1,
  "building_id": "uuid",
  "number": "1",
  "area": 60,
  "floor": 0,
  "rooms": 2,
  "owner": "Mato Galić",
  "tenant": "Mato Galić",
  "contact": "+385 91 123 4567",
  "email": "gali.mato@gmail.com",
  "phone": "+385 91 123 4567",
  "notes": "Bilješke o stanu",
  "debt": 0,
  "reserve": 0,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

**Napomena:** `debt` i `reserve` se izračunavaju iz transakcija.

---

#### PUT /apartments/:id
Ažurira stan.

**Request Body:** (kao POST, sve polja opcionalno)

**Response 200:** (kao POST)

---

#### DELETE /apartments/:id
Briše stan (CASCADE briše sve povezane transakcije).

**Response 204:** No Content

---

### 5. Transactions (Transakcije)

#### GET /apartments/:apartmentId/transactions
Dohvaća sve transakcije za stan.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 100)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "apartment_id": 1,
      "type": "charge",
      "date": "2025-01-15",
      "amount": 65.55,
      "description": "Mjesečna naknada - Listopad 2025",
      "period": "Listopad 2025",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "totalCount": 10,
  "page": 1,
  "pageSize": 100
}
```

---

#### POST /apartments/:apartmentId/transactions
Kreira novu transakciju.

**Request Body:**
```json
{
  "type": "charge",
  "date": "2025-01-15",
  "amount": 65.55,
  "description": "Mjesečna naknada - Listopad 2025",
  "period": "Listopad 2025"
}
```

**Validacija:**
- `type`: obavezno, `'charge'` ili `'payment'`
- `date`: obavezno, validan datum
- `amount`: obavezno, decimal > 0
- `description`: obavezno, string, min 1 znak
- `period`: opcionalno, string, max 50 znakova

**Response 201:**
```json
{
      "id": 1,
  "apartment_id": "uuid",
  "type": "charge",
  "date": "2025-01-15",
  "amount": 65.55,
  "description": "Mjesečna naknada - Listopad 2025",
  "period": "Listopad 2025",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

#### PUT /transactions/:id
Ažurira transakciju.

**Request Body:** (kao POST)

**Response 200:** (kao POST)

---

#### DELETE /transactions/:id
Briše transakciju.

**Response 204:** No Content

---

### 6. Tenants (Stanari)

#### GET /tenants
Dohvaća sve stanare s paginacijom i pretraživanjem.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)
- `search` (opcionalno, pretražuje po imenu, emailu, adresi, telefonu)
- `city` (opcionalno, filter po gradu)
- `status` (opcionalno, `'paid'`, `'overdue'`, `'pending'`)
- `deliveryMethod` (opcionalno, `'email'`, `'pošta'`)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "apartment_id": 1,
      "name": "Mato Galić",
      "email": "gali.mato@gmail.com",
      "phone": "+385 91 123 4567",
      "address": "Antuna Starčevića 15, Stan 3",
      "city": "Vinkovci",
      "area": "65 m²",
      "monthlyRate": 65.55,
      "balance": "0.00 €",
      "balanceNum": 0,
      "status": "paid",
      "deliveryMethod": "email"
    }
  ],
  "totalCount": 20,
  "page": 1,
  "pageSize": 25
}
```

**Napomena:** `balance` i `balanceNum` se izračunavaju iz transakcija povezanog stana.

---

#### POST /tenants
Kreira novog stanara.

**Request Body:**
```json
{
  "apartmentId": 1,
  "name": "Mato Galić",
  "email": "gali.mato@gmail.com",
  "phone": "+385 91 123 4567",
  "address": "Antuna Starčevića 15, Stan 3",
  "city": "Vinkovci",
  "area": "65 m²",
  "monthlyRate": 65.55,
  "deliveryMethod": "email"
}
```

**Response 201:** (kao GET, bez `balance` i `balanceNum`)

---

#### PUT /tenants/:id
Ažurira stanara.

**Response 200:** (kao GET)

---

#### DELETE /tenants/:id
Briše stanara.

**Response 204:** No Content

---

### 7. Debtors (Dužnici)

#### GET /debtors
Dohvaća sve dužnike s paginacijom i pretraživanjem.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)
- `search` (opcionalno, pretražuje po imenu, emailu, adresi, gradu)
- `city` (opcionalno, filter po gradu)
- `amountMin` (opcionalno, minimalni iznos duga)
- `amountMax` (opcionalno, maksimalni iznos duga)
- `months` (opcionalno, filter po broju mjeseci duga)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Ivana Kovač",
      "email": "kovac.ivana@gmail.com",
      "address": "Trg bana J. Jelačića 3, Stan 1",
      "city": "Split",
      "amount": "234.50 €",
      "amountNum": 234.50,
      "months": 3,
      "lastReminder": "2025-10-10",
      "warningsSent": 2
    }
  ],
  "totalCount": 8,
  "page": 1,
  "pageSize": 25
}
```

---

#### POST /debtors
Kreira novog dužnika.

**Request Body:**
```json
{
  "tenantId": 1,
  "apartmentId": 1,
  "name": "Ivana Kovač",
  "email": "kovac.ivana@gmail.com",
  "address": "Trg bana J. Jelačića 3, Stan 1",
  "city": "Split",
  "amount": 234.50,
  "months": 3
}
```

**Response 201:** (kao GET)

---

#### PUT /debtors/:id
Ažurira dužnika.

**Response 200:** (kao GET)

---

#### DELETE /debtors/:id
Briše dužnika.

**Response 204:** No Content

---

### 8. Reminder Archive (Arhiva opomena)

#### GET /reminder-archive
Dohvaća arhivu opomena.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "debtor_id": 1,
      "user_name": "ALERIĆ MATO",
      "status": "Poslano",
      "sent_date": "2025-01-17"
    }
  ],
  "totalCount": 12,
  "page": 1,
  "pageSize": 25
}
```

---

#### POST /reminder-archive
Kreira zapis u arhivi opomena.

**Request Body:**
```json
{
  "debtorId": 1,
  "userName": "ALERIĆ MATO",
  "status": "Poslano",
  "sentDate": "2025-01-17"
}
```

**Response 201:** (kao GET)

---

### 9. Work Orders (Radni nalozi)

#### GET /work-orders
Dohvaća sve radne naloge s paginacijom i filtriranjem.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)
- `search` (opcionalno, pretražuje po naslovu, opisu, adresi)
- `status` (opcionalno, `'all'`, `'open'`, `'in-progress'`, `'completed'`, `'cancelled'`)
- `priority` (opcionalno, `'all'`, `'urgent'`, `'high'`, `'medium'`, `'low'`)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "building_id": 1,
      "title": "Popravak lifta",
      "description": "Lift zapeo između katova",
      "building_address": "Antuna Starčevića 15",
      "unit": "Zajedničko",
      "date_reported": "2025-10-15",
      "status": "open",
      "priority": "urgent",
      "assigned_to": "Mate Instalater"
    }
  ],
  "totalCount": 8,
  "page": 1,
  "pageSize": 25
}
```

---

#### POST /work-orders
Kreira novi radni nalog.

**Request Body:**
```json
{
  "buildingId": 1,
  "title": "Popravak lifta",
  "description": "Lift zapeo između katova",
  "buildingAddress": "Antuna Starčevića 15",
  "unit": "Zajedničko",
  "dateReported": "2025-10-15",
  "status": "open",
  "priority": "urgent",
  "assignedTo": "Mate Instalater"
}
```

**Validacija:**
- `title`: obavezno, string, min 1 znak, max 200 znakova
- `dateReported`: obavezno, validan datum
- `status`: opcionalno, default `'open'`
- `priority`: opcionalno, default `'medium'`

**Response 201:** (kao GET)

---

#### PUT /work-orders/:id
Ažurira radni nalog.

**Response 200:** (kao GET)

---

#### DELETE /work-orders/:id
Briše radni nalog.

**Response 204:** No Content

---

### 10. Representatives (Predstavnici)

#### GET /representatives
Dohvaća sve predstavnike s pretraživanjem.

**Query parametri:**
- `search` (opcionalno, pretražuje po imenu, zgradi, emailu)

**Response 200:**
```json
[
  {
    "id": 1,
    "building_id": "uuid",
    "name": "Alerić Mato",
    "email": "aleric.mato@example.com",
    "phone": "+385 91 123 4567",
    "oib": "12345678901",
    "iban": "HR9242485293857229485",
    "monthlyIncome": 150.00,
    "status": "active"
  }
]
```

---

#### POST /representatives
Kreira novog predstavnika.

**Request Body:**
```json
{
  "buildingId": 1,
  "name": "Alerić Mato",
  "email": "aleric.mato@example.com",
  "phone": "+385 91 123 4567",
  "oib": "12345678901",
  "iban": "HR9242485293857229485",
  "monthlyIncome": 150.00,
  "status": "active"
}
```

**Response 201:** (kao GET)

---

#### PUT /representatives/:id
Ažurira predstavnika.

**Response 200:** (kao GET)

---

#### DELETE /representatives/:id
Briše predstavnika.

**Response 204:** No Content

---

### 11. Suppliers (Dobavljači)

#### GET /suppliers
Dohvaća sve dobavljače s filtriranjem.

**Query parametri:**
- `category` (opcionalno, filter po kategoriji)
- `buildingId` (opcionalno, filter po zgradi - preko računa)

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "HEP - Elektra Zagreb d.o.o.",
    "category": "Energija",
    "iban": "HR1210010051863000160",
    "oib": "45678901234",
    "contact": "+385 1 6301 111",
    "email": "info@hep.hr",
    "monthlyAverage": 2450.00,
    "yearlyTotal": 29400.00,
    "lastInvoice": "2025-02-15"
  }
]
```

**Napomena:** `monthlyAverage`, `yearlyTotal`, `lastInvoice` se izračunavaju iz invoices tablice.

---

#### POST /suppliers
Kreira novog dobavljača.

**Request Body:**
```json
{
  "name": "HEP - Elektra Zagreb d.o.o.",
  "category": "Energija",
  "iban": "HR1210010051863000160",
  "oib": "45678901234",
  "contact": "+385 1 6301 111",
  "email": "info@hep.hr"
}
```

**Response 201:** (kao GET, bez izračunatih vrijednosti)

---

#### PUT /suppliers/:id
Ažurira dobavljača.

**Response 200:** (kao GET)

---

#### DELETE /suppliers/:id
Briše dobavljača (SET NULL na invoices).

**Response 204:** No Content

---

### 12. Invoices (Računi)

#### GET /invoices
Dohvaća sve račune s filtriranjem.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)
- `status` (opcionalno, `'pending'`, `'booked'`, `'paid'`, `'cancelled'`)
- `supplierId` (opcionalno)
- `buildingId` (opcionalno)
- `dateFrom` (opcionalno, format: YYYY-MM-DD)
- `dateTo` (opcionalno, format: YYYY-MM-DD)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "supplier_id": 1,
      "building_id": 1,
      "invoice_number": "2025-001-HEP",
      "date": "2025-02-15",
      "due_date": "2025-03-01",
      "amount": 2450.00,
      "status": "booked",
      "category": "Energija",
      "accounting_group": "25 - Materijalni troškovi",
      "payment_date": "2025-02-20",
      "type": "xml"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 25
}
```

---

#### POST /invoices
Kreira novi račun.

**Request Body:**
```json
{
  "supplierId": 1,
  "buildingId": 1,
  "invoiceNumber": "2025-001-HEP",
  "date": "2025-02-15",
  "dueDate": "2025-03-01",
  "amount": 2450.00,
  "status": "pending",
  "category": "Energija",
  "accountingGroup": "25 - Materijalni troškovi",
  "type": "xml",
  "xmlData": {}
}
```

**Response 201:** (kao GET)

---

#### PUT /invoices/:id
Ažurira račun.

**Response 200:** (kao GET)

---

#### DELETE /invoices/:id
Briše račun.

**Response 204:** No Content

---

### 13. Decisions (Odluke)

#### GET /decisions
Dohvaća sve odluke s filtriranjem.

**Query parametri:**
- `status` (opcionalno, `'all'`, `'active'`, `'archived'`)
- `buildingId` (opcionalno)
- `search` (opcionalno, pretražuje po broju, naslovu)

**Response 200:**
```json
[
  {
    "id": 1,
    "building_id": "uuid",
    "number": "01/2025",
    "title": "Odluka o godišnjem izvještaju",
    "date": "2025-01-15",
    "building_address": "Split, Marmontova 12",
    "status": "active",
    "pdf_url": "https://example.com/decisions/01-2025.pdf"
  }
]
```

---

#### POST /decisions
Kreira novu odluku.

**Request Body:**
```json
{
  "buildingId": 1,
  "number": "01/2025",
  "title": "Odluka o godišnjem izvještaju",
  "date": "2025-01-15",
  "buildingAddress": "Split, Marmontova 12",
  "status": "active",
  "pdfUrl": "https://example.com/decisions/01-2025.pdf"
}
```

**Response 201:** (kao GET)

---

#### PUT /decisions/:id
Ažurira odluku.

**Response 200:** (kao GET)

---

#### DELETE /decisions/:id
Briše odluku.

**Response 204:** No Content

---

### 14. Contracts (Ugovori)

#### GET /contracts
Dohvaća sve ugovore s filtriranjem.

**Query parametri:**
- `status` (opcionalno, `'all'`, `'active'`, `'archived'`)
- `buildingId` (opcionalno)
- `search` (opcionalno, pretražuje po broju, naslovu, izvođaču)

**Response 200:**
```json
[
  {
    "id": 1,
    "building_id": "uuid",
    "number": "UG-01/2025",
    "title": "Ugovor o održavanju lifta",
    "contractor": "Lift Servis d.o.o.",
    "date_from": "2025-01-01",
    "date_to": "2025-12-31",
    "building_address": "Split, Marmontova 12",
    "amount": 2400.00,
    "status": "active",
    "pdf_url": "https://example.com/contracts/ug-01-2025.pdf"
  }
]
```

---

#### POST /contracts
Kreira novi ugovor.

**Request Body:**
```json
{
  "buildingId": 1,
  "number": "UG-01/2025",
  "title": "Ugovor o održavanju lifta",
  "contractor": "Lift Servis d.o.o.",
  "dateFrom": "2025-01-01",
  "dateTo": "2025-12-31",
  "buildingAddress": "Split, Marmontova 12",
  "amount": 2400.00,
  "status": "active",
  "pdfUrl": "https://example.com/contracts/ug-01-2025.pdf"
}
```

**Response 201:** (kao GET)

---

#### PUT /contracts/:id
Ažurira ugovor.

**Response 200:** (kao GET)

---

#### DELETE /contracts/:id
Briše ugovor.

**Response 204:** No Content

---

### 15. Payment Slips (Uplatnice)

#### GET /payment-slips
Dohvaća sve uplatnice s paginacijom.

**Query parametri:**
- `page` (opcionalno, default 1)
- `pageSize` (opcionalno, default 25)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "period": "Listopad 2025",
      "date": "2025-10-15",
      "count": 45,
      "email_count": 38,
      "print_count": 7,
      "amount": 4567.89
    }
  ],
  "totalCount": 6,
  "page": 1,
  "pageSize": 25
}
```

---

#### POST /payment-slips
Kreira novu uplatnicu.

**Request Body:**
```json
{
  "period": "Listopad 2025",
  "date": "2025-10-15",
  "count": 45,
  "emailCount": 38,
  "printCount": 7,
  "amount": 4567.89
}
```

**Validacija:**
- `period`: obavezno, string, unique
- `date`: obavezno, validan datum

**Response 201:** (kao GET)

---

#### PUT /payment-slips/:id
Ažurira uplatnicu.

**Response 200:** (kao GET)

---

#### DELETE /payment-slips/:id
Briše uplatnicu.

**Response 204:** No Content

---

### 16. Dashboard

#### GET /dashboard/stats
Dohvaća statistike za dashboard.

**Response 200:**
```json
{
  "totalCharged": 234567.89,
  "totalPaid": 198234.50,
  "collectionRate": 84.5,
  "debtorsOver50": 12,
  "openWorkOrders": 8,
  "urgentWorkOrders": 3,
  "outstandingBalance": 36245.4,
  "averageDaysOverdue": 18,
  "upcomingCharges": 15230.75,
  "bankImportsPending": 1,
  "invoicesDueThisWeek": 9,
  "inspectionsThisWeek": 2,
  "buildingCount": 28,
  "cityCount": 6,
  "apartmentCount": 412,
  "tenantCount": 367,
  "occupancyRate": 91,
  "emptyUnits": 12
}
```

**Napomena:** Sve vrijednosti se izračunavaju iz podataka u bazi.

---

#### GET /dashboard/activities
Dohvaća nedavne aktivnosti.

**Query parametri:**
- `limit` (opcionalno, default 6)

**Response 200:**
```json
[
  {
    "type": "reminder",
    "text": "Poslana 2. opomena za Starčevića 23",
    "time": "15.10.2025. 15:40",
    "status": "warning"
  },
  {
    "type": "payment",
    "text": "Mato Galić - uplata 65.55 €",
    "time": "15.10.2025. 14:23",
    "status": "success"
  }
]
```

**Tipovi aktivnosti:**
- `reminder` - Opomena
- `payment` - Uplata
- `work` - Radni nalog
- `inspection` - Inspekcija

**Statusi:**
- `success` - Uspješno
- `warning` - Upozorenje
- `info` - Informacija

---

#### GET /dashboard/debtors
Dohvaća top 5 dužnika za dashboard.

**Response 200:**
```json
[
  {
    "name": "Ivana Kovač",
    "amount": "234.50 €",
    "months": "3 mjeseca",
    "location": "Starčevića 15 · Zagreb"
  }
]
```

---

## Autentifikacija

### POST /auth/login
Prijava korisnika.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Ime Prezime"
  }
}
```

---

### POST /auth/logout
Odjava korisnika.

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me
Dohvaća trenutnog korisnika.

**Response 200:**
```json
{
      "id": 1,
  "email": "user@example.com",
  "name": "Ime Prezime"
}
```

---

## Validacije i Business Logika

### Validacije

#### Gradovi
- Naziv grada mora biti unique u cijeloj bazi
- Ne može se obrisati grad ako ima povezane ulice (ili CASCADE delete)

#### Ulice
- Naziv ulice mora biti unique unutar grada
- Ne može se obrisati ulica ako ima povezane zgrade (ili CASCADE delete)

#### Zgrade
- Broj zgrade mora biti unique unutar ulice
- IBAN format validacija (HR + 19 znamenki)
- OIB format validacija (11 znamenki)
- Naknade moraju biti >= 0

#### Stanovi
- Broj stana mora biti unique unutar zgrade
- Email mora biti validan format ako je unesen
- Površina mora biti > 0 ako je unesena
- Kat mora biti između -1 i 50
- Broj soba mora biti >= 0

#### Transakcije
- Tip mora biti `'charge'` ili `'payment'`
- Iznos mora biti > 0
- Datum ne smije biti u budućnosti (opcionalno, ovisno o business logici)

#### Stanari
- Email mora biti validan format ako je unesen
- Status mora biti `'paid'`, `'overdue'`, ili `'pending'`
- Delivery method mora biti `'email'` ili `'pošta'`

#### Dužnici
- Iznos duga mora biti > 0
- Broj mjeseci mora biti >= 0

#### Radni nalozi
- Status mora biti `'open'`, `'in-progress'`, `'completed'`, ili `'cancelled'`
- Prioritet mora biti `'urgent'`, `'high'`, `'medium'`, ili `'low'`

---

### Business Logika

#### Izračun salda stana
```sql
SELECT 
  COALESCE(SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END), 0) as balance
FROM transactions
WHERE apartment_id = ?
```

#### Izračun dugovanja zgrade
```sql
SELECT 
  COALESCE(SUM(apartment_debt), 0) as total_debt
FROM (
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END), 0) as apartment_debt
  FROM transactions
  WHERE apartment_id IN (SELECT id FROM apartments WHERE building_id = ?)
  GROUP BY apartment_id
) subquery
```

#### Izračun pričuve zgrade
```sql
SELECT 
  COALESCE(SUM(apartment_reserve), 0) as total_reserve
FROM (
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as apartment_reserve
  FROM transactions
  WHERE apartment_id IN (SELECT id FROM apartments WHERE building_id = ?)
  GROUP BY apartment_id
) subquery
```

#### Automatsko generiranje dužnika
Dužnici se mogu automatski generirati iz stanara koji imaju negativan saldo:
```sql
INSERT INTO debtors (tenant_id, apartment_id, name, email, address, city, amount, months)
SELECT 
  t.id,
  t.apartment_id,
  t.name,
  t.email,
  t.address,
  t.city,
  ABS(COALESCE((
    SELECT SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END)
    FROM transactions
    WHERE apartment_id = t.apartment_id
  ), 0)) as amount,
  FLOOR(ABS(COALESCE((
    SELECT SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END)
    FROM transactions
    WHERE apartment_id = t.apartment_id
  ), 0)) / t.monthly_rate) as months
FROM tenants t
WHERE COALESCE((
  SELECT SUM(CASE WHEN type = 'charge' THEN -amount ELSE amount END)
  FROM transactions
  WHERE apartment_id = t.apartment_id
), 0) < 0
AND NOT EXISTS (
  SELECT 1 FROM debtors d WHERE d.tenant_id = t.id
)
```

#### Mjesečna rata stana
Mjesečna rata se izračunava na temelju naknada zgrade:
```javascript
const monthlyRate = building.cleaningFee + building.loanFee + (apartment.area * building.reservePerSqm);
```

---

## Primjeri odgovora

### Error Response (400 Bad Request)
```json
{
  "error": "Validation failed",
  "message": "Name is required",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Error Response (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing token"
}
```

### Error Response (404 Not Found)
```json
{
  "error": "Not found",
  "message": "City with id '1' not found"
}
```

### Error Response (409 Conflict)
```json
{
  "error": "Conflict",
  "message": "City with name 'Zagreb' already exists"
}
```

### Error Response (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
---

## Node.js/Express implementacija

### Setup projekta

#### package.json
```json
{
  "name": "stanar-plus-backend",
  "version": "1.0.0",
  "description": "Backend API za Stanar Plus aplikaciju",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "node src/migrations/runMigrations.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### .env
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stanar_plus

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

### Database Connection (MySQL)

#### src/config/database.js
```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  });

module.exports = pool;
```

---

### Express App Setup

#### src/app.js
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const citiesRoutes = require('./routes/cities');
const streetsRoutes = require('./routes/streets');
const buildingsRoutes = require('./routes/buildings');
// ... ostale rute

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/streets', streetsRoutes);
app.use('/api/buildings', buildingsRoutes);
// ... ostale rute

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: `Route ${req.path} not found` });
});

// Error handler (mora biti na kraju)
app.use(errorHandler);

module.exports = app;
```

#### src/server.js
```javascript
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
```

---

### Middleware

#### src/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Provjeri da li korisnik postoji u bazi
    const [users] = await pool.execute(
      'SELECT id, email, name FROM users WHERE id = ? AND active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
    }
    next(error);
  }
};

module.exports = { authenticate };
```

#### src/middleware/errorHandler.js
```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Duplicate entry',
      details: err.message
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Referenced record does not exist',
      details: err.message
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Cannot delete record, it is referenced by other records',
      details: err.message
    });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

#### src/middleware/validator.js
```javascript
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Validation schemas
const citySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
});

const streetSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required()
});

const buildingSchema = Joi.object({
  number: Joi.string().trim().min(1).max(20).required(),
  name: Joi.string().trim().max(20).optional(),
  iban: Joi.string().max(34).optional(),
  oib: Joi.string().length(11).pattern(/^[0-9]+$/).optional(),
  representative: Joi.string().max(200).optional(),
  representativePhone: Joi.string().max(50).optional(),
  cleaningFee: Joi.number().min(0).optional(),
  loanFee: Joi.number().min(0).optional(),
  reservePerSqm: Joi.number().min(0).optional()
});

// ... ostale sheme

module.exports = {
  validate,
  citySchema,
  streetSchema,
  buildingSchema
};
```

---

### Controller Example

#### src/controllers/citiesController.js
```javascript
const pool = require('../config/database');

const getAllCities = async (req, res, next) => {
  try {
    // Dohvati sve gradove s ugniježdenim podacima
    const [cities] = await pool.execute('SELECT * FROM cities ORDER BY name');
    
    for (const city of cities) {
      // Dohvati ulice za grad
      const [streets] = await pool.execute(
        'SELECT * FROM streets WHERE city_id = ? ORDER BY name',
        [city.id]
      );
      
      for (const street of streets) {
        // Dohvati zgrade za ulicu
        const [buildings] = await pool.execute(
          'SELECT * FROM buildings WHERE street_id = ? ORDER BY number',
          [street.id]
        );
        
        for (const building of buildings) {
          // Dohvati stanove za zgradu
          const [apartments] = await pool.execute(
            'SELECT * FROM apartments WHERE building_id = ? ORDER BY number',
            [building.id]
          );
          
          // Izračunaj dugovanje i pričuvu za svaki stan
          for (const apartment of apartments) {
            const [transactions] = await pool.execute(
              'SELECT type, amount FROM transactions WHERE apartment_id = ?',
              [apartment.id]
            );
            
            apartment.debt = transactions.reduce((sum, t) => 
              sum + (t.type === 'charge' ? -t.amount : t.amount), 0
            );
            apartment.reserve = transactions
              .filter(t => t.type === 'payment')
              .reduce((sum, t) => sum + t.amount, 0);
            apartment.transactions = transactions;
          }
          
          // Izračunaj ukupno dugovanje i pričuvu za zgradu
          building.debt = apartments.reduce((sum, apt) => sum + (apt.debt || 0), 0);
          building.reserve = apartments.reduce((sum, apt) => sum + (apt.reserve || 0), 0);
          building.apartments = apartments;
          building.fees = {
            cleaning: building.cleaning_fee,
            loan: building.loan_fee,
            reservePerSqm: building.reserve_per_sqm
          };
        }
        
        street.buildings = buildings;
      }
      
      city.streets = streets;
      city.totalApartments = streets.reduce((sum, s) => 
        sum + s.buildings.reduce((sum2, b) => sum2 + b.apartments.length, 0), 0
      );
      city.totalDebt = streets.reduce((sum, s) => 
        sum + s.buildings.reduce((sum2, b) => sum2 + (b.debt || 0), 0), 0
      );
    }
    
    res.json(cities);
  } catch (error) {
    next(error);
  }
};

const createCity = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO cities (name) VALUES (?)',
      [name]
    );
    
    const [city] = await pool.execute(
      'SELECT * FROM cities WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(city[0]);
  } catch (error) {
    next(error);
  }
};

const updateCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    await pool.execute(
      'UPDATE cities SET name = ? WHERE id = ?',
      [name, id]
    );
    
    const [city] = await pool.execute(
      'SELECT * FROM cities WHERE id = ?',
      [id]
    );
    
    if (city.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'City not found' });
    }
    
    res.json(city[0]);
  } catch (error) {
    next(error);
  }
};

const deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM cities WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found', message: 'City not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCities,
  createCity,
  updateCity,
  deleteCity
};
```

---

### Routes Example

#### src/routes/cities.js
```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate, citySchema } = require('../middleware/validator');
const {
  getAllCities,
  createCity,
  updateCity,
  deleteCity
} = require('../controllers/citiesController');

// Svi endpointi zahtijevaju autentifikaciju
router.use(authenticate);

router.get('/', getAllCities);
router.post('/', validate(citySchema), createCity);
router.put('/:id', validate(citySchema), updateCity);
router.delete('/:id', deleteCity);

module.exports = router;
```

---

### MySQL Best Practices

1. **Connection Pooling:** Uvijek koristite connection pool umjesto direktnih konekcija
2. **Prepared Statements:** Uvijek koristite `execute()` umjesto `query()` za sigurnost (SQL injection zaštita)
3. **Transactions:** Za kompleksne operacije koristite transakcije:
```javascript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  await connection.execute('INSERT INTO cities (name) VALUES (?)', [name]);
  await connection.execute('INSERT INTO streets (city_id, name) VALUES (?, ?)', [cityId, streetName]);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

4. **Error Handling:** Uvijek hvatajte MySQL greške i vraćajte prikladne HTTP status kodove
5. **Indexes:** Koristite indekse za često korištene query-je
6. **Query Optimization:** Izbjegavajte N+1 query problem koristeći JOIN-ove gdje je moguće

