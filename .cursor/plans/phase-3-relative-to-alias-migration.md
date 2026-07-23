# Plan D — Refactor relative paths sang `@/*` alias (Phase 3)

> **Status:** PLANNED, NOT EXECUTED. Được lưu lại để tham khảo khi cần.
> **Ngày tạo:** 23/07/2026
> **Người tạo:** Cursor Assistant

---

## 1. Mục tiêu

Refactor toàn bộ `~470` relative imports thành `@/...` alias, bảo toàn 100% runtime behavior, chia thành nhiều commit nhỏ dễ rollback.

---

## 2. Decision đã chốt

### D1. Naming convention

- Alias: `@/*` (đã có sẵn) — **không đổi**
- Style: `@/components/ui/Button` (giữ nguyên path gốc, không rút gọn)
- Lý do: tránh phải đổi ESLint rule, dễ grep, dễ onboard dev mới

### D2. Approach: incremental theo concern

Không refactor 177 file trong 1 commit (khó review, conflict khi merge). Chia **8 commits theo concern**:

```
C1 — api + types
C2 — hooks
C3 — utils + constants + lib + mocks
C4 — components/ui + auth + layout
C5 — components/admin
C6 — components/{booking,customer,service,history,settings,wash-bay}
C7 — pages/*
C8 — ESLint guard rule + README
```

### D3. ESLint guard (sau khi migrate xong)

```js
// eslint.config.js — thêm vào rules
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['../../../*', '../../*', '../*'],
    message: 'Use @/ alias instead of relative paths. See Phase 3 plan.',
  }],
}],
```

### D4. Công cụ refactor

- **KHÔNG dùng sed thủ công** (dễ miss edge case như `'@/'` trong string literal)
- Dùng **TypeScript compiler API + script riêng** hoặc `jscodeshift`
- Verify từng commit: `npx tsc --noEmit && npm run build`

---

## 3. Thống kê scope (từ Bước C)

| Metric | Giá trị |
|--------|---------|
| Tổng relative imports trong `src/` | **~470** |
| File có ít nhất 1 relative import | **~177** |
| File dùng alias `@/` (đã có sẵn) | **0** |
| File có depth 4+ (`../../../../`) | **0** |
| File có depth 3 (`../../../`) | **~136** |
| File có depth 2 (`../../`) | **~177** (là tập cha) |

### Top 12 file hot (nhiều relative nhất)

| # | File | Count |
|---|------|-------|
| 1 | `pages/bookings/BookingListPage.tsx` | 22 |
| 2 | `pages/bookings/BookingDetailPage.tsx` | 22 |
| 3 | `pages/admin/bookings/AdminBookingDetailPage.tsx` | 21 |
| 4 | `pages/admin/history/AdminWashHistoryPage.tsx` | 20 |
| 5 | `pages/admin/users/AdminCustomerDetailPage.tsx` | 20 |
| 6 | `pages/admin/vehicles/AdminVehicleListPage.tsx` | 19 |
| 7 | `pages/bookings/CheckInPage.tsx` | 19 |
| 8 | `pages/admin/garages/AdminWashBayManagementPage.tsx` | 19 |
| 9 | `pages/admin/services/AdminServicePackageFormPage.tsx` | 10 |
| 10 | `pages/admin/research/AdminResearchReportsPage.tsx` | 18 |
| 11 | `pages/admin/waitlists/AdminWaitlistsPage.tsx` | 18 |
| 12 | `pages/staff/arrivals/StaffPlateScanDetailPage.tsx` | 20 |

### Phân bố theo folder

| Folder | Files | Relative imports |
|--------|-------|------------------|
| `pages/admin/*` | ~80 | ~280 |
| `pages/staff/*` | ~10 | ~70 |
| `pages/bookings/*` | 4 | ~70 |
| `pages/public/*` | 4 | ~5 |
| `pages/service/*` | 2 | ~29 |
| `pages/auth/*` | 2 | ~22 |
| `pages/history/*` | 1 | ~13 |
| `pages/customers/*` | 2 | ~16 |
| `pages/dashboard/*` | 1 | ~11 |
| `pages/settings/*` | 1 | ~15 |
| `components/admin/*` | ~50 | ~120 |
| `components/staff/*` | 8 | ~30 (Phase 2 mới) |
| `components/booking/*` | ~10 | ~50 |
| `components/customer/*` | ~10 | ~30 |
| `components/auth/*` | ~7 | ~13 |
| `components/ui/*` | 11 | ~12 |
| `hooks/api/admin/*` | ~25 | ~110 |
| `hooks/api/staff/*` | ~10 | ~30 |
| `hooks/api/customer/*` | 2 | ~9 |
| `hooks/*` (root) | 1 | ~1 |
| `api/*` | ~20 | ~40 |
| `lib/*` | ~8 | ~40 |
| `utils/*` | ~30 | ~80 |
| `mocks/*` | ~25 | ~30 |
| `lib/mappers/*` | 4 | ~30 |
| `constants/*` | ~10 | ~10 |

---

## 4. Edge case đã phát hiện (từ Bước C)

1. **Encoding lẫn lợn**: grep trả cả `/` và `\` cho cùng file — không phải bug, chỉ là ripgrep.
2. **`BookingContext.tsx`** — 21 relative imports, file bootstrap, refactor cẩn thận.
3. **Alias config đã sẵn sàng** tại commit `cc37e76`:
   - `tsconfig.app.json`: `paths: { "@/*": ["src/*"] }`
   - `vite.config.ts`: `resolve.alias: { '@': path.resolve(__dirname, 'src') }`
4. **Không có file depth 4+** → không phải xử lý edge case path phức tạp.

---

## 5. Order chi tiết 8 commits

| # | Folder xử lý | Files | Relative cần đổi | Rủi ro | Test |
|---|--------------|-------|------------------|--------|------|
| **C1** | `src/api/*`, `src/types/*` | ~25 | ~45 | Thấp | `npm run build` |
| **C2** | `src/hooks/*` | ~40 | ~150 | Trung bình | `npm run build` |
| **C3** | `src/utils/*`, `constants/*`, `lib/*`, `mocks/*` | ~75 | ~160 | Thấp | `npm run build` |
| **C4** | `components/ui/*`, `auth/*`, `layout/*` | ~25 | ~35 | Trung bình | smoke `/login` |
| **C5** | `components/admin/*` | ~50 | ~120 | Trung bình | smoke `/admin/*` |
| **C6** | `components/{booking,customer,service,history,settings,wash-bay}/*` | ~25 | ~95 | Cao | smoke `/staff/arrivals` |
| **C7** | `src/pages/*` | ~70 | ~280 | Cao nhất | smoke toàn bộ |
| **C8** | ESLint rule + README | 2 | 0 | Thấp | `npm run lint` |

**Tổng: 8 commits, ~470 dòng đổi, ~1.5 giờ effort.**

---

## 6. Template mỗi commit

```bash
git checkout -b refactor/phase-3-<N>-<scope>
# Chạy refactor script trên folder tương ứng
# Verify: npx tsc --noEmit && npm run build
git add <folder>
git commit -m "refactor(<scope>): migrate <folder> to @/* alias"
git checkout Staff && git merge refactor/phase-3-<N>-<scope> --ff-only
git push origin Staff
```

---

## 7. Risk register

| Risk | Mitigation |
|------|-----------|
| Phase 2 staff arrivals vừa merge, có thể vỡ | Commit C7 smoke `/staff/arrivals` cẩn thận |
| Dynamic import (`import(`...`)`) không bắt được | Verify cả `import(` patterns trước khi commit |
| Circular import phát sinh | Build sẽ fail → fix ngay |
| Tanstack Query key factory path | Pattern `queryKeys.ts` không import qua path, an toàn |

---

## 8. Out of scope (Phase 3 KHÔNG làm)

- ❌ Không đổi alias (giữ `@/*`)
- ❌ Không sửa bug logic (chỉ refactor import paths)
- ❌ Không đổi format file
- ❌ Không refactor test file nếu có

---

## 9. Khi nào nên chạy plan này?

✅ Nên chạy khi:
- Dự án làm lâu dài (>3 tháng)
- Sắp scale team
- Codebase đã ổn định, không có feature lớn đang dang dở

❌ Không nên chạy khi:
- Sắp bàn giao / demo
- Đang focus feature mới
- Chưa smoke test kỹ Phase 2
- Làm một mình, không có team

---

**Kết thúc plan D. Plan này sẵn sàng để tham khảo khi cần.**
