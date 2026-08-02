# Vision & Scope: Cloudy & Clover

---

## Cloudy (Original Project)

**Vision:**
> Cloudy - Better UI for OpenCode with Desktop IDE-like interface

**Current Scope:**

| Category | Items |
|----------|-------|
| **Focus** | Better OpenCode UI wrapper |
| **Target** | Developers who want superior UX for OpenCode |
| **Frontend** | Tab system (chat, desk, webview, files), Desktop IDE pattern |
| **Backend** | Hono + Node.js, Proxy layer for OpenCode SSE |
| **Database** | Drizzle ORM + PGlite (WASM Postgres) |
| **Architecture** | Monorepo (pnpm + Turborepo) |
| **Platform** | CLI binary + React frontend |

**Key Features (Current):**
- Tab abstraction (chat, desk, webview, files)
- Session management
- Desk canvas (React Flow based)
- OpenCode proxy layer
- Health check, OpenAPI docs

**Status:** Active development

---

## Clover (New Project)

**Origin:**
- แยกออกจาก Cloudy
- OpenCode ไม่ตอบโจทย์ (ขาด co-worker feel)
- ต้องการ personal agent ที่ทำ general work

**Vision Statement:**
> **Clover** - Personal co-worker agent ที่ทำงาน general work ได้หลากหลาย ไม่ใช่แค่ coding assistant แต่เป็น "คนร่วมงาน" ที่คุยด้วยได้ทุกเรื่อง มี context ของ project, จำสิ่งที่คุยกันได้ และช่วย think through problem ด้วยกัน

**Key Differentiators from OpenCode/ChatGPT:**
- **Co-worker feel** ไม่ใช่ tool
- **Context-aware** ของ project/user
- **Memory** ข้าม session
- **General work** ไม่ใช่แค่ code

**Technical Scope:**

| Category | Reuse from Cloudy | Build New |
|----------|------------------|-----------|
| Frontend | Tab system, stores, UI shell | LLM integration UI, productivity-focused UX |
| Backend | SSE infrastructure, proxy layer | LLM integration, memory system, tools |
| Database | Schema patterns | Personal knowledge base |

**นอก scope (MVP):**
- Mobile app
- Multi-user/team features
- Public API

**Direction:**
- Personal use first
- Tight integration with personal workflow
- Iterate fast, opinionated choices

**Status:** Planned

---

## Relationship Between Projects

```
Cloudy ←── shares core patterns ──→ Clover
   │                              │
   └── Tab system                 └── Tab system (reused)
   └── Stores                     └── Stores (reused)
   └── SSE infrastructure         └── SSE infrastructure (reused)
   └── OpenCode integration       └── LLM integration (new)
                                    └── Memory system (new)
```

**Repository:** แยกกัน

---

## Decisions

| # | Topic | Decision | Date |
|---|-------|----------|------|
| 1 | ชื่อ project ใหม่ | Clover | 2026-08-02 |
| 2 | Repository | แยกจาก Cloudy | 2026-08-02 |
| 3 | Focus | Personal use, general work co-worker | 2026-08-02 |
