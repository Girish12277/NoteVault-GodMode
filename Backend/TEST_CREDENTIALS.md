
# 🔐 TEST CREDENTIALS & COUPONS

This document contains all the necessary credentials to test the StudyVault platform.

## 🔑 Common Password
**All seeded users** use the same password:
> **Password:** `admin`

---

## 👤 User Accounts

### 🛡️ Admins
| Email | Role | Notes |
|-------|------|-------|
| `admin@studyvault.com` | SUPER_ADMIN | Main system admin |
| `superadmin@studyvault.com` | ADMIN | - |

### 💼 Sellers
| Email | Role | Notes |
|-------|------|-------|
| `seller1@studyvault.com` | SELLER | Has existing note: "Complete Data Structures Guide" |
| `seller2@studyvault.com` | SELLER | - |
| `seller3@studyvault.com` | SELLER | - |
| `notes.topper@gmail.com` | SELLER | - |
| `professor.x@university.edu` | SELLER | - |

### 🎓 Buyers
| Email | Role | Notes |
|-------|------|-------|
| `buyer1@studyvault.com` | BUYER | Standard buyer account |
| `buyer2@studyvault.com` | BUYER | - |
| `student.one@college.edu` | BUYER | - |
| `exam.warrior@gmail.com` | BUYER | - |
| `lastminute@study.com` | BUYER | - |

---

## 🎟️ Active Coupons

| Code | Type | Value | Condition | Description |
|------|------|-------|-----------|-------------|
| **`WELCOME50`** | FLAT | ₹50 | Order > ₹150 | Flat ₹50 off for new users |
| **`SAVE20`** | % | 20% | Max ₹200 | Standard 20% discount |
| **`BIGSPENDER`** | % | 30% | Order > ₹1000 | High value discount |
| **`FLASH5`** | FLAT | ₹100 | Order > ₹200 | Limited to first 5 uses (Hurry!) |
| **`CSLOVER`** | % | 25% | CS Category | Only valid for "Computer Science" notes |
| **`ALICEFAN`** | FLAT | ₹50 | Seller 1 Notes | Only valid for notes by `seller1@studyvault.com` |

---

## 🧪 E2E Test Credentials (Automated Tests)
These are used by the automated test suite (`tests/e2e/...`).

**New User Registration:**
- **Email:** `seller_UUID@e2etest.com` (Generated dynamically)
- **Password:** `Test@1234`
