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
- [x] Login ด้วย Better Auth (ขั้น 3) — ตัวแปร `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [x] หน้าจัดการออร์เดอร์ เพิ่ม/แก้ไข/ลบ ค้นหา กรอง แบ่งหน้า (ขั้น 4) — ไม่มีตัวแปรหรือ migration ใหม่
- [x] ฐานข้อมูลสินค้า / รายการในออร์เดอร์ / ข้อมูลจัดส่ง (ขั้น 4.1) — migration `add_products_items_shipping` (ไม่มีตัวแปรใหม่)
- [ ] หน้าคลังสินค้า (ขั้น 4.2)
- [ ] ออร์เดอร์มีรายการสินค้า + ตัดสต็อกอัตโนมัติ (ขั้น 4.3)
- [ ] หน้าจัดส่งสินค้า (ขั้น 4.4)
- [ ] หน้า Dashboard การ์ดสรุป + กราฟ (ขั้น 5)

ตัวแปรที่ยังไม่ติ๊กยังไม่ต้องตั้งค่า จะใช้เมื่อทำขั้นนั้นเสร็จ

## ตัวแปรสภาพแวดล้อม (Environment Variables)

| ชื่อ | ความหมาย | ตัวอย่าง |
|---|---|---|
| `DATABASE_URL` | connection string แบบ **Transaction pooler** (port 6543) ให้แอปใช้ตอนทำงาน (`lib/prisma.ts`) | `postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | connection string แบบ **Session pooler** (port 5432) ให้คำสั่ง `prisma migrate` / `db seed` / `studio` ใช้ (`prisma.config.ts`) | `postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` |
| `BETTER_AUTH_SECRET` | รหัสลับสำหรับเข้ารหัส session (สุ่มใหม่ทุก environment ห้ามใช้ซ้ำ) | สร้างด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `BETTER_AUTH_URL` | URL ของเว็บใน environment นั้น — ต้องตรงกับ URL ที่เปิดใช้จริง ไม่งั้น login ไม่ได้ (ระบบปฏิเสธคำขอจากเว็บอื่น: `INVALID_ORIGIN`) | `http://localhost:3000` |

หา connection string ได้ที่ Supabase → ปุ่ม **Connect** ด้านบนของโปรเจกต์

**ห้าม commit ไฟล์ `.env`** (`.gitignore` กันไว้แล้ว)

---

## 1. Local dev

ต้องมี: Node.js 20 ขึ้นไป, Git

```bash
npm install
```

1. สร้างโปรเจกต์ Supabase สำหรับ dev (region: Southeast Asia (Singapore) `ap-southeast-1` — ใกล้ไทยที่สุด ใช้ region เดียวกันทุก environment)
2. สร้างไฟล์ `.env` ที่โฟลเดอร์โปรเจกต์ ใส่ตัวแปรตามตารางด้านบน (`BETTER_AUTH_URL=http://localhost:3000`)
3. สร้างตารางในฐานข้อมูล และใส่ข้อมูลตัวอย่าง
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db execute --file prisma/sql/enable-rls-migrations-table.sql
   npx prisma db seed
   ```
   - **Prisma 7 ไม่สร้าง client ให้เองหลัง `migrate dev`** — ต้องรัน `npx prisma generate` ทุกครั้งที่ schema เปลี่ยน (ไม่งั้น Better Auth จะฟ้อง `Prisma schema mismatch`)
   - คำสั่ง `db execute` รันครั้งเดียวต่อฐานข้อมูล (ปิดไม่ให้ตารางประวัติ migration ถูกอ่านผ่าน API ของ Supabase — ตารางอื่นทั้งหมดเปิด RLS ใน migration ให้แล้ว)
   - seed ใส่สินค้า 15 รายการ + ออร์เดอร์ย้อนหลัง 30 วัน (มีรายการสินค้า ที่อยู่ เลขพัสดุ) เฉพาะตอนยังไม่มีสินค้าและออร์เดอร์
     ถ้าอยากล้างแล้วใส่ใหม่: `npx prisma db seed -- --reset` (ลบสินค้า+ออร์เดอร์ทั้งหมด บัญชีแอดมินไม่ถูกแตะ ใช้เวลา ~40 วินาที)
   - ตาราง `products` / `order_items` มี CHECK ในฐานข้อมูลกันสต็อกติดลบ ราคาติดลบ และจำนวน ≤ 0 (เขียนเองใน migration — Prisma ไม่สร้างให้)
   - ดู/แก้ข้อมูลผ่านหน้าเว็บ: `npx prisma studio`
   - แก้ `prisma/schema.prisma` แล้ว → `npx prisma migrate dev --name <ชื่อการเปลี่ยนแปลง>`
4. สร้างบัญชีผู้ดูแล (เว็บไม่มีหน้าสมัคร)
   ```bash
   npm run create-admin -- you@example.com รหัสผ่านอย่างน้อย8ตัว "ชื่อที่แสดง"
   ```
   - ชื่อไม่บังคับ (ไม่ใส่ = ใช้ส่วนหน้า @ ของอีเมล) ถ้าชื่อมีช่องว่างต้องครอบด้วย `"..."`
   - สคริปต์ใช้ฐานข้อมูลตาม `DATABASE_URL` ใน `.env`
   - ลบ/ดูบัญชี: `npx prisma studio` → ตาราง `User` (ลบ user แล้ว session/account ลบตามอัตโนมัติ)
   - จำกัดการลอง login ผิด: 3 ครั้ง / 10 วินาที ต่อ IP (เก็บในตาราง `rateLimit`)
5. รัน
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000

ตรวจก่อน push ทุกครั้ง:
```bash
npm test
npm run lint
npm run build
```

## 2. Staging

ใช้ **Preview Deployment** ของ Vercel ผูกกับ branch `develop`

> หลัง merge ขั้น 4.1: `prisma migrate deploy` ใน Build Command สร้างตารางสินค้า/รายการในออร์เดอร์ให้เอง
> ฐานข้อมูล staging ที่มีออร์เดอร์เก่าอยู่ก่อน ออร์เดอร์เหล่านั้นจะไม่มีรายการสินค้า (ยอดรวมเดิมยังอยู่) — ถ้าเป็นข้อมูลทดสอบ ใช้ seed `--reset` ได้

ตั้งค่าครั้งแรก:
1. สร้างโปรเจกต์ Supabase แยกสำหรับ staging
2. Vercel → Project → Settings → Environment Variables ใส่ตัวแปรทั้งหมด โดยเลือก environment **Preview** และจำกัด branch เป็น `develop`
   - `BETTER_AUTH_URL` = URL ของ branch develop เช่น `https://<project>-git-develop-<team>.vercel.app`
     (ให้ทดสอบผ่าน URL นี้เท่านั้น — URL แบบสุ่มต่อ commit จะ login ไม่ได้เพราะไม่ตรงกับ `BETTER_AUTH_URL`)
3. Vercel → Settings → Build and Deployment → Build Command:
   ```bash
   prisma migrate deploy && next build
   ```
   (`prisma generate` รันเองตอน `npm install` ผ่านสคริปต์ `postinstall`)
4. หลัง deploy ครั้งแรก เปิด RLS ให้ตาราง `_prisma_migrations` (รันจากเครื่อง โดยชี้ `DIRECT_URL` ไปที่ staging ชั่วคราว) — คำสั่งเดียวกับ Local dev ข้อ 3 บรรทัดที่ 2
5. สร้างบัญชีผู้ดูแลกับฐานข้อมูล staging: เปลี่ยน `DATABASE_URL` ใน `.env` ไปที่ staging ชั่วคราว → `npm run create-admin -- ...` → เปลี่ยนกลับ

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
5. สร้างบัญชีผู้ดูแลจริงแบบเดียวกับ staging ข้อ 5 (ใช้รหัสผ่านยาวและไม่ซ้ำกับที่อื่น) — **ไม่รัน seed**
6. เพิ่มสินค้าจริงผ่านหน้าคลังสินค้า (ขั้น 4.2) ก่อนเริ่มรับออร์เดอร์

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

### ตรวจหลัง deploy (staging และ prod)
1. เปิดเว็บโดยยังไม่ login → ต้องถูกพาไปหน้า `/login`
2. login → หน้า `/orders` แสดงรายการ, ค้นหาชื่อ/เบอร์โทร และกรองสถานะได้
3. เพิ่มออร์เดอร์ทดสอบ → แก้ไข → ลบ (บน prod ให้ลบออร์เดอร์ทดสอบทิ้งทุกครั้ง)
4. ลองบนมือถือจริง: รายการเป็นการ์ด, ฟอร์มกรอกได้, ปุ่มกดง่าย

### ถ้าขึ้นจริงแล้วพัง
- Vercel → Deployments → เลือกเวอร์ชันก่อนหน้า → **Promote to Production** (ย้อนเว็บกลับทันที)
- ถ้ามี migration ฐานข้อมูลที่ทำให้พัง ต้องเขียน migration ใหม่แก้ (Prisma ไม่ย้อน migration ให้อัตโนมัติ)
