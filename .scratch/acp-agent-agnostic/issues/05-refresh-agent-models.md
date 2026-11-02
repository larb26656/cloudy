# 05: Refresh รายการ models จาก ACP agent

**What to build:** ให้ผู้ใช้เลือก model ก่อนเริ่ม conversation ได้ตาม flow เดิม และ refresh รายการเมื่อ agent configuration เปลี่ยน โดยไม่สูญเสียรายการเดิมเมื่อ refresh ล้มเหลว ดู spec ของ feature นี้ประกอบ

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] คง temporary-session discovery และพยายาม cleanup probe session; cache ผล discovery ที่สำเร็จตลอดอายุ adapter instance
- [x] discovery ที่ล้มเหลวไม่ติด cache เป็นผลถาวร และการเรียกครั้งถัดไปสามารถลองใหม่
- [x] มี manual refresh ในจุดเลือก model; เมื่อสำเร็จแทนรายการ cached ด้วยผลล่าสุด
- [x] หาก refresh ล้มเหลว คงรายการสำเร็จล่าสุดพร้อมแจ้ง error และความเป็นไปได้ว่ารายการเก่า
- [x] ตรวจ end-to-end ผ่าน fake agent และ model selector ทั้ง cache, retry, refresh สำเร็จและ refresh ล้มเหลว รวมตรวจ UI จริง
