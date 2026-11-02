# 02: โหลดและ merge ACP history กับ live chat

**What to build:** ให้ผู้ใช้เปิด history จาก ACP agent และเห็น conversation ที่ประกอบด้วย Cloudy messages/parts ตามกติกาเดียวกับ live stream โดยใช้ Cloudy merge เดิมและให้ agent เป็นเจ้าของ transcript ดูข้อตกลงและข้อจำกัดทั้งหมดใน spec ของ feature นี้

**Blocked by:** 01: แสดง live ACP conversation ให้ถูกต้อง

**Status:** ready-for-agent

- [ ] โหลด history ผ่านความสามารถของ agent ที่ negotiate จริง ไม่เก็บ ACP transcript ถาวรซ้ำ และไม่ส่ง transcript ทั้งก้อนเป็น prompt ใหม่
- [ ] live และ replay ประกอบเป็น Cloudy messages/parts ด้วยกติกาเดียวกัน; ไม่สร้าง user message ปลอมเมื่อ replay ไม่มีข้อมูลนั้น
- [ ] adapter สร้าง deterministic session-scoped message/part IDs จากโครงสร้างเพื่อใช้กับ merge เดิมเมื่อข้อมูลและลำดับเพียงพอ ไม่สมมติว่า native message ID คงที่ระหว่าง replay
- [ ] ตรวจหลาย turn, text chunk boundaries, tool activity และการโหลดซ้ำผ่าน session/chat seam กับ fake ACP agent รวมการจับคู่ live/replay เมื่อข้อมูลเพียงพอ
- [ ] ระบุและไม่ปกปิดความเสี่ยงที่ยอมรับ: replay ที่ขาดหรือเปลี่ยนลำดับอาจทำให้ซ้ำหรือ merge ผิด; ไม่เพิ่มระบบตรวจจับ alignment หรือ reconciliation ใหม่
- [ ] smoke กับ ACP agent จริง: initialize, prompt, reconnect และ load รวมหลาย turn และ tool activity เมื่อทำได้; รายงานข้อจำกัด environment หากทำไม่ได้
