# ENGSE207 Software Architecture  
## README — Final Lab Set 1: Microservices + HTTPS + Lightweight Logging

> เอกสารฉบับนี้ใช้เป็น `README.md` สำหรับ repository ของ **Final Lab Set 1**  
> นักศึกษาสามารถปรับแก้รายละเอียด เช่น ชื่อสมาชิก, ภาพ architecture, URL หรือคำอธิบายเพิ่มเติม ให้สอดคล้องกับงานจริงของกลุ่ม

---

## 1. ข้อมูลรายวิชาและสมาชิก

**รายวิชา:** ENGSE207 Software Architecture  
**ชื่องาน:** Final Lab — ชุดที่ 1: Microservices + HTTPS + Lightweight Logging  

**สมาชิกในกลุ่ม**
- นายเจษฎา  อินตา / รหัสนักศึกษา: 67543210006-2
- นายจักรภัทร  พรมทา / รหัสนักศึกษา: 67543210013-8

**Repository:** `https://github.com/ch4kkapatPR/final-lab.git`

---

## 2. ภาพรวมของระบบ

Final Lab ชุดที่ 1 เป็นการพัฒนาระบบ Task Board แบบ Microservices โดยเน้นหัวข้อสำคัญดังนี้

- การทำงานแบบแยก service
- การใช้ Nginx เป็น API Gateway
- การเปิดใช้งาน HTTPS ด้วย Self-Signed Certificate
- การยืนยันตัวตนด้วย JWT
- การจัดเก็บ log แบบ Lightweight Logging ผ่าน Log Service
- การเชื่อมต่อ Frontend กับ Backend ผ่าน HTTPS

งานชุดนี้ **ไม่มี Register** และใช้เฉพาะ **Seed Users** ที่กำหนดไว้ในฐานข้อมูล

---

## 3. วัตถุประสงค์ของงาน

งานนี้มีจุดมุ่งหมายเพื่อฝึกให้นักศึกษาสามารถ

- ออกแบบระบบแบบ Microservices ในระดับพื้นฐาน
- ใช้ Nginx เป็น reverse proxy และ TLS termination
- ใช้ JWT สำหรับ authentication ระหว่าง frontend และ backend
- ออกแบบ logging flow ผ่าน REST API และจัดเก็บ log ลงฐานข้อมูล
- ใช้ Docker Compose เพื่อรวมทุก service ให้ทำงานร่วมกันได้

---

## 4. Architecture Overview

```text
Browser / Postman
       │
       │ HTTPS :443
       ▼
Nginx (API Gateway)
   ├── /api/auth/*  → auth-service
   ├── /api/tasks/* → task-service
   ├── /api/logs/*  → log-service
   └── /            → frontend
            │
            ▼
     PostgreSQL (shared DB)
```

### Services ที่ใช้ในระบบ
- **nginx** — API Gateway, HTTPS, rate limiting
- **frontend** — หน้าเว็บ Task Board และ Log Dashboard
- **auth-service** — Login, Verify, Me
- **task-service** — CRUD Tasks
- **log-service** — รับและแสดง logs
- **postgres** — shared database

---

## 5. โครงสร้าง Repository

```text
final-lab-set1/
├── README.md
├── TEAM_SPLIT.md
├── INDIVIDUAL_REPORT_[studentid].md
├── docker-compose.yml
├── .env.example
├── nginx/
├── frontend/
├── auth-service/
├── task-service/
├── log-service/
├── db/
├── scripts/
└── screenshots/
```

---

## 6. เทคโนโลยีที่ใช้

- Node.js / Express.js
- PostgreSQL
- Nginx
- Docker / Docker Compose
- HTML / CSS / JavaScript
- JWT
- bcryptjs

---

## 7. การตั้งค่าและการรันระบบ

### 7.1 สร้าง Self-Signed Certificate

```bash
chmod +x scripts/gen-certs.sh
./scripts/gen-certs.sh
```

### 7.2 สร้างไฟล์ `.env`
คัดลอกจาก `.env.example` แล้วกำหนดค่าตามต้องการ เช่น

```env
POSTGRES_DB=taskboard
POSTGRES_USER=admin
POSTGRES_PASSWORD=secret123
JWT_SECRET=engse207-super-secret-change-me
JWT_EXPIRES=1h
```

### 7.3 สร้าง bcrypt hash สำหรับ Seed Users
ในงานชุดนี้ กลุ่มของเรากำหนดให้ **สร้าง bcrypt hash เอง** ก่อนรันระบบ

ตัวอย่างคำสั่ง:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('alice123',10))"
node -e "const b=require('bcryptjs'); console.log(b.hashSync('bob456',10))"
node -e "const b=require('bcryptjs'); console.log(b.hashSync('adminpass',10))"
```

จากนั้นนำค่าที่ได้ไปแทนในไฟล์ `db/init.sql`

### 7.4 รันระบบ

```bash
docker compose down -v
docker compose up --build
```

### 7.5 เปิดใช้งานผ่าน Browser
- Frontend: `https://localhost`
- Log Dashboard: `https://localhost/logs.html`

> หมายเหตุ: เนื่องจากใช้ self-signed certificate browser อาจขึ้นคำเตือนด้านความปลอดภัย ให้กดยอมรับเพื่อเข้าทดสอบ

---

## 8. Seed Users สำหรับทดสอบ

| Username | Email | Password | Role |
|---|---|---|---|
| alice | alice@lab.local | alice123 | member |
| bob | bob@lab.local | bob456 | member |
| admin | admin@lab.local | adminpass | admin |

> หมายเหตุ: ต้อง generate bcrypt hash จริงแล้วแทนค่าลงใน `db/init.sql` ก่อน login

---

## 9. API Summary

### Auth Service
- `POST /api/auth/login`
- `GET /api/auth/verify`
- `GET /api/auth/me`
- `GET /api/auth/health`

### Task Service
- `GET /api/tasks/health`
- `GET /api/tasks/`
- `POST /api/tasks/`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Log Service
- `POST /api/logs/internal`
- `GET /api/logs/`
- `GET /api/logs/stats`
- `GET /api/logs/health`

---

## 10. การทดสอบระบบ

### ตัวอย่างลำดับการทดสอบ
1. รัน `docker compose up --build`
2. เปิด `https://localhost`
3. Login ด้วย seed users
4. สร้าง task ใหม่
5. ดูรายการ task
6. แก้ไข task
7. ลบ task
8. ทดสอบกรณีไม่มี JWT → ต้องได้ `401`
9. ทดสอบ Log Dashboard
10. ทดสอบ rate limiting ของ login

### ตัวอย่าง curl
```bash
BASE="https://localhost"

TOKEN=$(curl -sk -X POST $BASE/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"alice@lab.local","password":"alice123"}' |   python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -sk $BASE/api/tasks/ -H "Authorization: Bearer $TOKEN"
```

---

## 11. Screenshots ที่แนบในงาน

โฟลเดอร์ `screenshots/` ของกลุ่มนี้ประกอบด้วยภาพดังต่อไปนี้

- `01_docker_running.png`
- `02_https_browser.png`
- `03_login_success.png`
- `04_login_fail.png`
- `05_create_task.png`
- `06_get_tasks.png`
- `07_update_task.png`
- `08_delete_task.png`
- `09_no_jwt_401.png`
- `10_logs_api_A.png`
- `10_logs_api_B.png`
- `11_rate_limit.png`
- `12A_frontend_screenshot_admin.png`
- `12B_frontend_screenshot_member.png`

---

## 12. การแบ่งงานของทีม

รายละเอียดการแบ่งงานของสมาชิกอยู่ในไฟล์:

- `TEAM_SPLIT.md`

และรายงานรายบุคคลของสมาชิกแต่ละคนอยู่ในไฟล์:

- `INDIVIDUAL_REPORT_[67543210006-2].md`
- `INDIVIDUAL_REPORT_[67543210013-8].md`

---

## 13. ปัญหาที่พบและแนวทางแก้ไข

- ปัญหา seed users login ไม่ได้เพราะยังไม่ได้ generate bcrypt hash เลยต้องทำการ Generate Hash ก่อนและนำไปแทนใน DataBase
- ปัญหา การเริ่ม Build ไม่ผ่านเพราะไม่ได้ติดตั้ง Node module บางตัวไว้ จึงต้องไล่ติดตั้งก่อนการ Build ครั้งถัดไป
- ปัญหา หน้าเว็บ Member ปกติเข้าได้ แต่ไม่มี Task ขึ้นมาเเสดง แต่ใน Database ยังมีครบหมด ได้ทำการ Debug code ในส่วนของการเชื่อมต่อ Frontend กับ Backend เพื่อให้ทำงานได้
- ปัญหา Docker volume เก็บข้อมูลเดิมทำให้ seed ใหม่ไม่ทำงาน เลยต้องทำการลบ Volume เก่าก่อนการ Build ใหม่

---

## 14. ข้อจำกัดของระบบ

- ใช้ self-signed certificate สำหรับการพัฒนา ไม่เหมาะสำหรับ production จริง
- ใช้ shared database เพียง 1 ก้อน
- ยังไม่มีระบบ register
- logging เป็นแบบ lightweight ไม่ใช่ centralized observability platform เต็มรูปแบบ
- เหมาะสำหรับการเรียนรู้ architecture ระดับพื้นฐานและการต่อยอดไป Set 2

---

## 15. การต่อยอดไปยัง Set 2

งาน Set 1 เป็นพื้นฐานสำคัญสำหรับ Set 2 โดยประเด็นที่จะต่อยอด ได้แก่

- เพิ่ม `Register API`
- เพิ่ม `User Service`
- เปลี่ยนจาก shared DB ไปเป็น database-per-service
- Deploy บน Railway Cloud
- ออกแบบ gateway strategy สำหรับหลาย service

---

## 16. ภาคผนวก

### ไฟล์สำคัญใน repository
- `docker-compose.yml`
- `nginx/nginx.conf`
- `db/init.sql`
- `auth-service/src/routes/auth.js`
- `task-service/src/routes/tasks.js`
- `log-service/src/index.js`
- `frontend/index.html`
- `frontend/logs.html`

---

> เอกสารฉบับนี้เป็น README สำหรับงาน Final Lab Set 1 ของกลุ่ม และจัดทำเพื่อประกอบการส่งงานในรายวิชา ENGSE207 Software Architecture