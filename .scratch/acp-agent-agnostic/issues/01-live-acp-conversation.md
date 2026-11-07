# 01: แสดง live ACP conversation ให้ถูกต้อง

**What to build:** ให้ผู้ใช้เห็นข้อความและ tool activity จาก ACP agent ใน Cloudy chat ตามลำดับ โดย stream ไม่แสดงข้อความซ้ำและ tool updates กลับไปแก้ part ที่เป็นเจ้าของจริง ใช้ร่วมกับ provider contract และ chat ที่มีอยู่ ดูบริบทและข้อตกลงทั้งหมดใน spec ของ feature นี้

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] ข้อความจากแต่ละ chunk ปรากฏครั้งเดียว แม้ consumer รองรับทั้ง full part update และ delta
- [x] text chunks ที่ต่อเนื่องรวมเป็น part เดียว และเริ่ม part ใหม่เมื่อมี part ชนิดอื่นคั่น โดย assistant message เดียวเป็นเจ้าของ parts ของ turn ตามกติกาใน spec
- [x] tool call และ update จับคู่ด้วย tool-call identity ภายใน session แม้หลาย tool ส่ง update สลับกันหรือ update มาหลังเริ่ม turn ถัดไป
- [x] update ที่มาก่อน call สร้าง partial tool part จากข้อมูลที่มีโดยไม่เติมข้อมูลปลอม; update ภายหลังไม่ย้ายตำแหน่ง part
- [x] ตรวจพฤติกรรมผ่านเส้นทาง session/chat และ fake ACP agent รวมหลาย turn, chunk boundaries และ interleaved tool updates; ตรวจ UI ที่ผู้ใช้เห็น
