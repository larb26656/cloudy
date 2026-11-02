# 03: แสดงสถานะ session ที่กู้คืนไม่ได้

**What to build:** ให้ผู้ใช้เปิด session ที่ agent ไม่สามารถโหลด history หรือกลับไปสนทนาต่อได้ โดยเข้าใจข้อจำกัดและไม่สูญเสียข้อความที่กำลังพิมพ์ ดู spec ของ feature นี้ประกอบ

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] เก็บ session binding เดิมและแสดง chat ว่างพร้อม indicator เมื่อโหลด history ไม่ได้ โดยไม่ลบ session อัตโนมัติ
- [ ] แยกความสามารถในการโหลด history และส่งต่อ session เดิมตามผล capability และการทำงานจริง ไม่สมมติว่าการมีอย่างหนึ่งรับประกันอีกอย่าง
- [ ] input ยังคงเปิดให้พิมพ์; หากส่งเข้า session เดิมไม่ได้ แสดง error และเก็บ draft โดยไม่สร้าง session ใหม่เงียบ ๆ
- [ ] ตรวจสถานะและการส่งผ่านเส้นทาง session/chat พร้อมตรวจ UI จริงด้วย agent ที่ไม่รองรับ restoration
