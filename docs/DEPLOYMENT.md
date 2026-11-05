# การติดตั้งและ Deploy

เอกสารนี้อธิบาย 3 สภาพแวดล้อม (environment) ของโปรเจกต์

| | Local dev | Staging | Production |
|---|---|---|---|
| ใช้ทำอะไร | พัฒนา/ทดลองบนเครื่องตัวเอง | ทดสอบก่อนขึ้นจริง | ร้านใช้งานจริง |
| Git branch | `feature/*`, `develop` | `develop` | `main` |
| ที่รัน | `npm run dev` บนเครื่อง | Vercel (Preview) | Vercel (Production) |
| ฐานข้อมูล | Supabase โปรเจกต์ dev | Supabase โปรเจกต์ staging | Supabase โปรเจกต์ prod |
| ข้อมูลตัวอย่าง (seed) | ใช้ได้ | ใช้ได้ | **ห้ามใช้** |

> แยกฐานข้อมูลคนละโปรเจกต์ Supabase เสมอ — ทดสอบลบข้อมูลใน dev/staging จะได้ไม่กระทบร้านจริง

## สถานะปัจจุบัน

- [x] หน้าตาพื้นฐาน + เมนู (ขั้น 1)
- [x] ฐานข้อมูล Supabase + Prisma (ขั้น 2) — ตัวแปร `DATABASE_URL`, `DIRECT_URL`
- [ ] Login ด้วย Better Auth (ขั้น 3) — ตัวแปร `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] หน้าออร์เดอร์และ Dashboard (ขั้น 4–5)

ตัวแปรที่ยังไม่ติ๊กยังไม่ต้องตั้งค่า จะใช้เมื่อทำขั้นนั้นเสร็จ

## ตัวแปรสภาพแวดล้อม (Environment Variables)

| ชื่อ | ความหมาย | ตัวอย่าง |
|---|---|---|
| `DATABASE_URL` | connection string แบบ **Transaction pooler** (port 6543) ให้แอปใช้ตอนทำงาน (`lib/prisma.ts`) | `postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | connection string แบบ **Session pooler** (port 5432) ให้คำสั่ง `prisma migrate` / `db seed` / `studio` ใช้ (`prisma.config.ts`) | `postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres` |
| `BETTER_AUTH_SECRET` | รหัสลับสำหรับเข้ารหัส session (สุ่มใหม่ทุก environment) | สร้างด้วย `npx @better-auth/cli secret` |
| `BETTER_AUTH_URL` | URL ของเว็บใน environment นั้น | `http://localhost:3000` |

หา connection string ได้ที่ Supabase → ปุ่ม **Connect** ด้านบนของโปรเจกต์

**ห้าม commit ไฟล์ `.env`** (`.gitignore` กันไว้แล้ว)

---

## 1. Local dev

ต้องมี: Node.js 20 ขึ้นไป, Git

```bash
npm install
```

1. สร้างโปรเจกต์ Supabase สำหรับ dev (แนะนำ region ใกล้ไทย เช่น Singapore — โปรเจกต์ dev ตอนนี้อยู่ Mumbai `ap-south-1` ใช้ได้แต่ช้ากว่าเล็กน้อย)
2. สร้างไฟล์ `.env` ที่โฟลเดอร์โปรเจกต์ ใส่ตัวแปรตามตารางด้านบน (`BETTER_AUTH_URL=http://localhost:3000`)
3. สร้างตารางในฐานข้อมูล และใส่ข้อมูลตัวอย่าง
   ```bash
   npx prisma migrate dev
   npx prisma db execute --file prisma/sql/enable-rls-migrations-table.sql
   npx prisma db seed
   ```
   - บรรทัดที่ 2 รันครั้งเดียวต่อฐานข้อมูล (ปิดไม่ให้ตารางประวัติ migration ถูกอ่านผ่าน API ของ Supabase — ตาราง `orders` เปิด RLS ใน migration ให้แล้ว)
   - seed จะใส่ข้อมูลเฉพาะตอนตารางว่าง ถ้าอยากล้างแล้วใส่ใหม่: `npx prisma db seed -- --reset`
   - ดู/แก้ข้อมูลผ่านหน้าเว็บ: `npx prisma studio`
   - แก้ `prisma/schema.prisma` แล้ว → `npx prisma migrate dev --name <ชื่อการเปลี่ยนแปลง>`
4. สร้างบัญชีผู้ดูแล *(ใช้ได้หลังขั้น 3)*
   ```bash
   npm run create-admin -- you@example.com รหัสผ่าน
   ```
5. รัน
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000

ตรวจก่อน push ทุกครั้ง:
```bash
npm run lint
npm run build
```

## 2. Staging

ใช้ **Preview Deployment** ของ Vercel ผูกกับ branch `develop`

ตั้งค่าครั้งแรก:
1. สร้างโปรเจกต์ Supabase แยกสำหรับ staging
2. Vercel → Project → Settings → Environment Variables ใส่ตัวแปรทั้งหมด โดยเลือก environment **Preview** และจำกัด branch เป็น `develop`
   - `BETTER_AUTH_URL` = URL ของ branch develop เช่น `https://<project>-git-develop-<team>.vercel.app`
3. Vercel → Settings → Build and Deployment → Build Command:
   ```bash
   prisma migrate deploy && next build
   ```
   (`prisma generate` รันเองตอน `npm install` ผ่านสคริปต์ `postinstall`)
4. หลัง deploy ครั้งแรก เปิด RLS ให้ตาราง `_prisma_migrations` (รันจากเครื่อง โดยชี้ `DIRECT_URL` ไปที่ staging ชั่วคราว) — คำสั่งเดียวกับ Local dev ข้อ 3 บรรทัดที่ 2
5. สร้างบัญชีผู้ดูแลกับฐานข้อมูล staging (รันจากเครื่อง โดยชี้ `.env` ไปที่ staging ชั่วคราว)

Deploy: merge งานเข้า `develop` แล้ว push → Vercel deploy ให้อัตโนมัติ

## 3. Production

ใช้ **Production Deployment** ของ Vercel ผูกกับ branch `main`

ตั้งค่าครั้งแรก:
1. สร้างโปรเจกต์ Supabase แยกสำหรับ prod (ตั้งรหัสผ่านฐานข้อมูลยาวและเก็บให้ดี)
2. Vercel → Environment Variables ใส่ตัวแปรทั้งหมด เลือก environment **Production**
   - `BETTER_AUTH_URL` = โดเมนจริง เช่น `https://<project>.vercel.app`
   - `BETTER_AUTH_SECRET` ต้อง**ไม่ซ้ำ**กับ staging
3. Build Command เหมือน staging (Vercel ใช้ค่าเดียวกันทุก environment)
4. หลัง deploy ครั้งแรก เปิด RLS ให้ `_prisma_migrations` เหมือน staging ข้อ 4
5. สร้างบัญชีผู้ดูแลจริงครั้งเดียว — **ไม่รัน seed**

Deploy (ตาม git flow):
```bash
git checkout develop && git pull
git checkout -b release/x.y.z
# ทดสอบบน staging ให้ผ่าน แล้ว
git checkout main && git merge --no-ff release/x.y.z
git tag x.y.z
git checkout develop && git merge --no-ff release/x.y.z
git push origin main develop --tags
```

### ถ้าขึ้นจริงแล้วพัง
- Vercel → Deployments → เลือกเวอร์ชันก่อนหน้า → **Promote to Production** (ย้อนเว็บกลับทันที)
- ถ้ามี migration ฐานข้อมูลที่ทำให้พัง ต้องเขียน migration ใหม่แก้ (Prisma ไม่ย้อน migration ให้อัตโนมัติ)
