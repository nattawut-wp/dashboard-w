-- รันครั้งเดียวต่อฐานข้อมูล หลัง migrate ครั้งแรก:
--   npx prisma db execute --file prisma/sql/enable-rls-migrations-table.sql
-- ปิดไม่ให้ตารางประวัติ migration ถูกอ่านผ่าน API อัตโนมัติของ Supabase
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
