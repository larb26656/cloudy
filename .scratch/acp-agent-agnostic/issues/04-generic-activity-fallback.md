# 04: แสดง activity ที่ไม่รู้จักด้วย generic fallback

**What to build:** ให้ผู้ใช้เห็น ACP activity ที่ shared chat model ยังแทนความหมายไม่ได้ พร้อมตรวจข้อมูลต้นทางได้โดยไม่ทิ้ง event เงียบ ๆ ดู spec ของ feature นี้ประกอบ

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] map ข้อมูลที่มีความหมายร่วมลง Cloudy type ตามความเหมาะสม และแสดง activity ที่ map ไม่ได้เป็น generic card ใน chat
- [ ] เก็บ raw payload เท่าที่จำเป็นต่อการแสดงผลใน transient state; ไม่เพิ่ม ACP transcript ถาวรหรือ provider-specific feature interface
- [ ] แสดง raw ที่ provider ส่งจริงแบบขยายดูได้และปิดไว้เป็นค่าเริ่มต้น; ไม่สร้าง input/output ปลอมเมื่อไม่มีข้อมูลดังกล่าว
- [ ] ตรวจเส้นทางจาก fake ACP agent ถึง UI จริง รวม payload ที่ไม่มี input/output แยก
