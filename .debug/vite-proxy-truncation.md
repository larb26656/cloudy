# Vite Proxy Truncates Chunked Response

## ปัญหา (Problem)

Vite proxy (port 3001) ตัด response ของ `/message` endpoint (pagination) ให้สั้นลง ~143KB (18%)

- **Direct API** `http://127.0.0.1:4122` → 789KB ✅
- **Proxy** `http://localhost:3001/service/api/message?limit=20&before=` → 646KB ❌

## เบาะแส (Clues)

### 1. ปัญหาเกิดเฉพาะกับ Large Response
- Small response (limit=1) → ทำงานปกติ
- Large response ที่มี `before` cursor สำหรับ pagination → ถูกตัด

### 2. Headers ที่แตกต่างกัน

| Header | Direct (4122) | Proxy (3001) |
|--------|---------------|--------------|
| Connection | `keep-alive` | `close` |
| Keep-Alive | `timeout=5` | *(หายไป)* |
| Transfer-Encoding | `chunked` | `chunked` |

### 3. สมมติฐาน

Vite proxy เปลี่ยน `Connection: keep-alive` → `Connection: close`

- `Connection: close` บอกว่า connection จะถูกปิดทันทีหลัง response เสร็จ
- แต่ `Transfer-Encoding: chunked` หมายความว่า data มาเป็น chunk ไม่รู้ขนาดล่วงหน้า
- ถ้า proxy buffer มี limit หรือมี bug → response ถูกตัดก่อนเวลา

### 4. การทดสอบ

```bash
# Direct
curl -s "http://127.0.0.1:4122/api/message?limit=20&before=" -o /tmp/direct.bin
wc -c /tmp/direct.bin  # 789KB

# Via Proxy
curl -s "http://localhost:3001/service/api/message?limit=20&before=" -o /tmp/proxy.bin
wc -c /tmp/proxy.bin   # 646KB
```

## Files ที่เกี่ยวข้อง

- `apps/web-app/vite.config.ts` → proxy config บรรทัด 19-25
- `apps/web-app/src/config/env.ts` → API URL configuration
- `apps/web-app/src/lib/opencode/client.ts` → OpenCode client setup

## แนวทางแก้ (Next Steps)

1. **ใช้ Middleware แทน Proxy** — สร้าง proxy middleware เองเพื่อควบคุม headers ได้
2. **Bypass Proxy ตอน Dev** — ใช้ env variable ให้ API client เรียก `http://127.0.0.1:4122` ตรง
3. **Debug เพิ่มเติม** — ดู Vite proxy source เพื่อยืนยันว่า `Connection: close` เป็นต้นเหตุ

## References

- Vite Discussion #20570: https://github.com/vitejs/vite/discussions/20570
