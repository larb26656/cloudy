---
title: มาตรฐานชื่อไฟล์ server
slug: standardize-server-file-names
id: 20261024-standardize-server-file-names
status: done
created: 2026-10-24
source: planning session 2026-10-24
---

# Plan: มาตรฐานชื่อไฟล์ server

## Why

ไฟล์ใน `packages/server/src/features` ใช้รูปแบบชื่อไม่สม่ำเสมอ บางส่วนระบุชื่อ feature ก่อน suffix เช่น `sessions.service.ts` แต่บางส่วนใช้ชื่อกว้าง ๆ เช่น `service.ts`, `controller.ts` หรือชื่อที่ไม่ได้ระบุบริบท ทำให้ค้นหาและย้ายไฟล์ยากเมื่อ feature มีโฟลเดอร์ย่อย ต้องกำหนด convention กลางและปรับชื่อไฟล์พร้อม imports ให้สอดคล้องกัน โดยไม่เปลี่ยน behavior หรือ public API

## Target file

| Path                               | Action      |
| ---------------------------------- | ----------- |
| `packages/server/AGENTS.md`        | edit        |
| `packages/server/src/features/**`  | rename/edit |
| `packages/server/src/container.ts` | edit        |
| `packages/server/src/server.ts`    | edit        |
| `packages/server/src/exports.ts`   | edit        |
| `packages/server/src/index.ts`     | edit        |
| `packages/server/src/**/*.test.ts` | edit        |

## Context the new session needs

- `packages/server/AGENTS.md:5-17` ระบุรูปแบบ feature ปัจจุบันเป็น `model.ts`, `repository.ts`, `service.ts`, `index.ts` แต่ไฟล์จริงหลาย feature ใช้ `<feature>.<role>.ts` อยู่แล้ว เช่น `packages/server/src/features/sessions/sessions.service.ts` และ `packages/server/src/features/notifications/notifications.repository.ts` จึงควรปรับคู่มือให้ตรงกับ convention ใหม่
- รูปแบบเป้าหมายสำหรับไฟล์ที่มีบทบาทชัดเจนคือ `<domain>.<role>.ts` และไฟล์ทดสอบเป็น `<domain>.<role>.test.ts` เช่น `llm-connections.service.ts`, `quick-cloudy.controller.ts`, `settings.agents.service.ts`, `sessions.cloudy-messages.repository.ts` และ `pty.in-memory.repository.ts` โดยพิจารณา domain จาก feature/subfeature ที่เป็นเจ้าของไฟล์ ไม่ใช่สร้างชื่อกว้าง ๆ ซ้ำกัน
- `index.ts` เป็น barrel entry ที่ตั้งใจใช้ใน `packages/server/src/features/*/index.ts` และ subfeature `index.ts`; คงชื่อไว้เพื่อให้ import จาก feature index ไม่เปลี่ยน ส่วนไฟล์ที่มีชื่อเฉพาะอยู่แล้ว เช่น `oauth-callback.ts`, `naming-session.ts`, `shell-resolver.ts`, `browser-workspace.templates.ts`, `pty.ws-adapter.ts` ให้เติม domain prefix เมื่อยังไม่มี โดยไม่เปลี่ยน suffix ที่บอกหน้าที่
- สำรวจความสม่ำเสมอทุกไฟล์ใน `packages/server/src/features/**` ก่อนลงมือ โดยรวม implementation, tests, และไฟล์เฉพาะทาง (เช่น websocket adapter, OAuth helpers, in-memory repository) แล้วค้นหา references ทั้ง repo เพราะ import อาจมาจาก container, server composition, exports และ apps ที่ใช้ `@repo/server`
- รักษา ESM imports, type-only imports, naming ของ exported symbols และ behavior ตาม `packages/server/AGENTS.md:65-72`; การเปลี่ยนครั้งนี้เป็น filename/import-only ยกเว้นการแก้คู่มือ
- การยืนยันผลควรใช้คำสั่งจาก root: `pnpm --filter @repo/server test`, `pnpm run lint` และ `pnpm run check-types` ตาม root `AGENTS.md` workflow checklist

## Tasks

- [x] 1. **กำหนดและบันทึกกติกา `<domain>.<role>.ts` สำหรับ feature source/test files พร้อมข้อยกเว้นของ barrel `index.ts`.**
  - verify: `rg -n 'Feature Structure|<domain>|index\.ts' packages/server/AGENTS.md`
  - files: `packages/server/AGENTS.md`
- [x] 2. **ทำ inventory รายชื่อไฟล์ในทุก feature/subfeature แล้วเปลี่ยนชื่อไฟล์ที่ยังไม่มี domain prefix ให้ตรง convention.**
  - verify: `rg --files packages/server/src/features | sort`
  - files: `packages/server/src/features/**`
- [x] 3. **อัปเดต relative imports, test imports และ package consumers ที่อ้าง path เดิม โดยคง exports และ runtime behavior เดิม.**
  - verify: `rg -n 'from .*features/|import\(.*features/' packages/server/src apps packages`
  - files: `packages/server/src/features/**`, `packages/server/src/container.ts`, `packages/server/src/server.ts`, `packages/server/src/exports.ts`, `packages/server/src/index.ts`, `packages/server/src/**/*.test.ts`
- [x] 4. **รัน tests, lint และ typecheck เพื่อยืนยันว่า rename และ reference updates ครบทั้ง workspace.**
  - verify: `pnpm --filter @repo/server test && pnpm run lint && pnpm run check-types`
  - files: `packages/server/src/features/**`, `packages/server/AGENTS.md`

## Done when

- [x] ไฟล์ใน feature และ subfeature ทุกไฟล์ที่ไม่ใช่ barrel `index.ts` ใช้ชื่อที่ระบุ domain ก่อน role/specific suffix อย่างสม่ำเสมอ รวมถึง tests และ helper files
- [x] `packages/server/AGENTS.md` อธิบาย convention ใหม่ พร้อมตัวอย่างที่ตรงกับโครงสร้างจริง
- [x] ไม่มี imports ที่อ้าง path เก่า และ public package/API exports ยังทำงานเหมือนเดิม
- [x] `pnpm --filter @repo/server test`, `pnpm run lint` และ `pnpm run check-types` ผ่าน

## Notes for implementer

ขอบเขตนี้กว้างและอาจแตะไฟล์จำนวนมากตามที่ผู้ใช้เลือกให้รวมเป็นแผนเดียว ให้ทำเป็นชุดย่อยตาม feature และรัน typecheck/tests หลังแต่ละชุดได้ ใช้ rename ที่รักษา git history และอย่าปรับ logic หรือ API ระหว่าง rename เว้นแต่จำเป็นต้องแก้ import path เท่านั้น
