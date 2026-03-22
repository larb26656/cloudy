# Memory Content

วันนี้พบปัญหาว่าเว็บโหลดช้ามาก โดยเฉพาะหน้า dashboard ที่มี widget หลายตัวพร้อมกัน

## Observations

- หน้า dashboard ใช้เวลา load ~5 วินาที
- Network tab พบว่า API หลายตัว respond ช้า
- มี image assets ขนาดใหญ่หลายไฟล์
- Bundle ของ JavaScript ขนาด ~3MB

## Hypotheses

1. API response ช้า → ต้องตรวจสอบ query และ indexing
2. Image assets ขนาดใหญ่ → ต้อง optimize หรือใช้ lazy loading
3. JS bundle ใหญ่ → แยก chunk / code splitting

## Next Steps

- รวบรวม metrics ของทุก API
- ใช้ Chrome Lighthouse วิเคราะห์ performance
- ลอง implement lazy loading image widget
- พิจารณา caching widget data
