# Nutri-Intel — توثيق النظام الكامل

> **الإصدار:** 1.1 | **التاريخ:** 2026-04-22 | **الاختبارات:** 76/76 ✅

---

## جدول المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة)
2. [البنية المعمارية](#2-البنية-المعمارية)
3. [قاعدة البيانات — الجداول والعلاقات](#3-قاعدة-البيانات)
4. [واجهة API — كل الـ Endpoints](#4-واجهة-api)
5. [نظام المصادقة والأمان](#5-نظام-المصادقة-والأمان)
6. [المعادلات والحسابات الطبية](#6-المعادلات-والحسابات-الطبية)
7. [الذكاء الاصطناعي والتحليل](#7-الذكاء-الاصطناعي-والتحليل)
8. [قواعد البيانات المضمنة](#8-قواعد-البيانات-المضمنة)
9. [نظام الإشعارات والتذكيرات](#9-نظام-الإشعارات)
10. [الواجهة الأمامية — المكونات والصفحات](#10-الواجهة-الأمامية)
11. [نظام الترجمة (EN/AR)](#11-نظام-الترجمة)
12. [الاختبارات](#12-الاختبارات)
13. [البناء والنشر](#13-البناء-والنشر)
14. [الثوابت والحدود الحرجة](#14-الثوابت-والحدود-الحرجة)

---

## 1. نظرة عامة

**Nutri-Intel** منصة صحية متكاملة تجمع بين تتبع التغذية، ورصد المؤشرات الحيوية، والذكاء الاصطناعي لتقديم توصيات شخصية. تدعم اللغتين العربية والإنجليزية بالكامل مع واجهة RTL/LTR.

### الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| تتبع التغذية | تسجيل الوجبات + حساب الماكرو تلقائياً |
| مراقبة الصحة | ضغط الدم، سكر الدم، معدل القلب، النوم، الوزن |
| الذكاء الاصطناعي | تحليل الصور، chatbot، توقعات صحية |
| الأدوية | جدول الأدوية + كشف التفاعلات + تذكيرات |
| الأهداف الصحية | تتبع الوزن والنظام الغذائي مع شريط تقدم |
| تقارير PDF | تقارير صحية شاملة قابلة للتحميل |
| PWA | يعمل كتطبيق على الجوال (Service Worker) |

---

## 2. البنية المعمارية

```
nutri-intel/
├── client/                  # React 19 SPA
│   └── src/
│       ├── pages/           # 23 صفحة
│       ├── components/      # مكونات UI + لوحة التحكم
│       ├── contexts/        # AuthContext
│       ├── hooks/           # 7 custom hooks
│       └── lib/             # utilities + i18n + dateUtils
├── server/                  # Express 5 API
│   ├── index.ts             # Server entry + middleware
│   ├── routes.ts            # كل الـ API endpoints
│   ├── auth.ts              # bcrypt + session
│   ├── db.ts                # Drizzle ORM + PostgreSQL
│   ├── email.ts             # Nodemailer + reset tokens
│   ├── vite.ts              # Dev HMR bridge
│   └── static.ts            # Production static serving
├── shared/                  # مشترك بين client وserver
│   ├── schema.ts            # Drizzle schema + Zod validators
│   ├── food-nutrition.ts    # 219+ أصناف غذائية
│   └── drug-interactions.ts # 200+ تفاعلات دوائية
├── script/
│   └── build.ts             # ESBuild + Vite production build
└── tests/                   # 4 ملفات اختبار (76 test)
```

### Stack التقني

| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| Frontend | React | 19.2.0 |
| Backend | Express | 5.0.1 |
| Build Tool | Vite | 7.1.9 |
| Database ORM | Drizzle | 0.39.3 |
| Database | PostgreSQL | — |
| Validation | Zod | 3.25.76 |
| State Management | TanStack Query | 5.60.5 |
| Routing | Wouter | 3.3.5 |
| UI Components | Radix UI + shadcn | — |
| CSS | Tailwind CSS | 4.1.14 |
| Charts | Recharts | 2.15.4 |
| PDF Export | jsPDF | 4.2.0 |
| Email | Nodemailer | 8.0.5 |
| LLM | Groq API | — |
| Testing | Vitest | 4.1.4 |

---

## 3. قاعدة البيانات

### الاتصال والإعداد

```typescript
// server/db.ts
// Mock mode تلقائي إذا لم تكن DATABASE_URL موجودة
export const isMockMode = !process.env.DATABASE_URL;

// إعدادات Connection Pool
{
  max: 10,
  idle_timeout: 30,     // ثانية
  connect_timeout: 10,  // ثانية
}
```

### جدول `users`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | `varchar` UUID | مفتاح رئيسي، `gen_random_uuid()` |
| `username` | `varchar` UNIQUE | اسم المستخدم |
| `email` | `varchar` UNIQUE | البريد الإلكتروني |
| `password` | `varchar` | bcrypt hash (salt=10) |
| `firstName` | `varchar` nullable | الاسم الأول |
| `lastName` | `varchar` nullable | الاسم الأخير |
| `age` | `integer` nullable | العمر بالسنوات |
| `height` | `decimal(10,2)` nullable | الطول بالسنتيمتر |
| `weight` | `decimal(10,2)` nullable | الوزن بالكيلوجرام |
| `bloodType` | `text` nullable | فصيلة الدم (A+, O-, ...) |
| `activityLevel` | `text` nullable | مستوى النشاط |
| `goals` | `jsonb` nullable | مصفوفة الأهداف |
| `onboardingCompleted` | `boolean` | هل أكمل الـ onboarding؟ default: false |
| `createdAt` | `timestamp` | تاريخ التسجيل |
| `updatedAt` | `timestamp` | آخر تحديث |

### جدول `meals`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | مفتاح رئيسي |
| `userId` | varchar FK → users | cascade delete |
| `name` | `text` | اسم الوجبة |
| `description` | `text` nullable | وصف الوجبة |
| `mealType` | `text` | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `date` | `timestamp` | تاريخ ووقت الوجبة |
| `createdAt` / `updatedAt` | timestamp | — |

**علاقة:** `meals` → many `nutrients` (عبر `mealsRelations`)

### جدول `nutrients`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | مفتاح رئيسي |
| `mealId` | varchar FK → meals | cascade delete |
| `calories` | `decimal(10,2)` | سعر حراري |
| `protein` | `decimal(10,2)` | بروتين (جرام) |
| `carbohydrates` | `decimal(10,2)` | كربوهيدرات (جرام) |
| `fat` | `decimal(10,2)` | دهون (جرام) |
| `fiber` | `decimal(10,2)` | ألياف (جرام) |
| `sugar` | `decimal(10,2)` | سكر (جرام) |
| `sodium` | `decimal(10,2)` | صوديوم (ملجم) |
| `createdAt` | timestamp | — |

> **ملاحظة مهمة:** بيانات التغذية لا تُخزن في جدول `meals` مباشرة — بل في `nutrients` وتُجمع بـ `with: { nutrients: true }` عند الاستعلام.

### جدول `healthMetrics`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | FK → users | — |
| `type` | `text` | نوع القياس (Blood Pressure, Glucose, Heart Rate, Weight, Sleep, Water) |
| `value` | `text` | القيمة (نص للمرونة) |
| `unit` | `text` | الوحدة (mmHg, mg/dL, bpm, kg, hours, ml) |
| `date` | `timestamp` | تاريخ القياس |
| `notes` | `text` nullable | ملاحظات |
| `createdAt` / `updatedAt` | timestamp | — |

### جدول `medications`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | FK → users | — |
| `name` | `text` | اسم الدواء |
| `dosage` | `text` | الجرعة (رقم) |
| `unit` | `text` | `mg` \| `ml` \| `tablet` |
| `frequency` | `text` | "twice daily", "9:00 AM", ... |
| `reason` | `text` nullable | سبب الوصفة |
| `startDate` | `timestamp` | تاريخ البداية |
| `endDate` | `timestamp` nullable | تاريخ الانتهاء |
| `prescribedBy` | `text` nullable | الطبيب |
| `notes` | `text` nullable | ملاحظات |

### جدول `healthJournal`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | FK → users | — |
| `date` | `timestamp` | — |
| `title` | `text` | عنوان الإدخال |
| `content` | `text` | المحتوى |
| `mood` | `text` | `happy` \| `sad` \| `neutral` \| `anxious` \| `stressed` |
| `energy` | `integer` | مستوى الطاقة (1-10) |
| `tags` | `text[]` | وسوم |
| `attachments` | `jsonb` | مرفقات |

### جدول `dietaryPreferences`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | UNIQUE FK → users | واحد لكل مستخدم |
| `vegetarian` | boolean | — |
| `vegan` | boolean | — |
| `glutenFree` | boolean | — |
| `dairyFree` | boolean | — |
| `nutAllergy` | boolean | — |
| `shellFishAllergy` | boolean | — |
| `otherAllergies` | text nullable | — |
| `dietType` | text | `balanced` \| `keto` \| `low-carb` \| `mediterranean` |
| `calorieGoal` | integer | هدف السعرات |
| `proteinGoal` | decimal | هدف البروتين (جرام) |
| `carbGoal` | decimal | هدف الكربوهيدرات |
| `fatGoal` | decimal | هدف الدهون |

### جدول `userGoals`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | FK → users | cascade delete |
| `goalType` | text | `lose_weight` \| `gain_muscle` \| `maintain` \| `eat_healthy` \| `manage_condition` |
| `targetWeight` | decimal(10,2) nullable | الوزن المستهدف (كجم) |
| `startWeight` | decimal(10,2) nullable | وزن البداية (كجم) |
| `targetDate` | timestamp nullable | تاريخ الهدف |
| `targetCalories` | integer nullable | هدف السعرات |
| `isActive` | boolean | default: true |

### جدول `chatbotMessages`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | — |
| `userId` | FK → users | — |
| `conversationId` | text | معرف المحادثة |
| `role` | text | `user` \| `assistant` |
| `content` | text | نص الرسالة |
| `messageType` | text | `text` \| `suggestion` \| `recommendation` |
| `metadata` | jsonb | بيانات إضافية |

### جدول `emergencyContacts`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | مفتاح رئيسي |
| `userId` | FK → users | cascade delete |
| `name` | text | الاسم الكامل |
| `phone` | text | رقم الهاتف |
| `relationship` | text nullable | العلاقة (أخ، طبيب، ...) |
| `isPrimary` | boolean | جهة الاتصال الأولى default: false |
| `createdAt` | timestamp | — |

### جدول `emergencyMedicalInfo`

| العمود | النوع | الوصف |
|--------|-------|-------|
| `id` | UUID | مفتاح رئيسي |
| `userId` | UNIQUE FK → users | واحد لكل مستخدم (1:1) |
| `bloodType` | text nullable | فصيلة الدم |
| `allergies` | text nullable | الحساسية |
| `medications` | text nullable | الأدوية الحالية |
| `conditions` | text nullable | الحالات المزمنة |
| `updatedAt` | timestamp | — |

### مخطط العلاقات (ERD مختصر)

```
users ─┬─── meals ──── nutrients
       ├─── healthMetrics
       ├─── medications
       ├─── healthJournal
       ├─── dietaryPreferences (1:1)
       ├─── userGoals
       ├─── chatbotMessages
       ├─── emergencyContacts
       └─── emergencyMedicalInfo (1:1)
```

---

## 4. واجهة API

**Base URL:** `/api`  
**Authentication:** Session cookie (express-session)  
**Body limit:** 10 MB  
**Content-Type:** `application/json`

---

### 4.1 المصادقة `/api/auth`

#### `POST /api/auth/register`
```
Body: {
  username: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  age?: number,
  height?: number,   // cm
  weight?: number,   // kg
  bloodType?: string
}
Response 201: User object (بدون password)
Response 400: "Username already exists" | "Email already registered"
```

#### `POST /api/auth/login`
```
Body: { username: string, password: string }
Response 200: User object
Response 401: "Invalid credentials"
```

#### `POST /api/auth/logout`
```
Response 200: { message: "Logged out successfully" }
```

#### `GET /api/auth/me`
```
Response 200: User object (من الـ session)
Response 401: { message: "Not authenticated" }
```

#### `POST /api/auth/forgot-password`
```
Body: { email: string, language?: "en" | "ar" }
Response 200: { message: "Password reset email sent" }
// يرسل email فيه رابط صالح لمدة ساعة
```

#### `POST /api/auth/reset-password`
```
Body: { token: string, password: string }
Response 200: { message: "Password reset successfully" }
Response 400: "Invalid or expired reset token"
```

#### `POST /api/auth/change-password`
```
Body: { currentPassword: string, newPassword: string }
Response 200: { message: "Password changed successfully" }
Response 401: "Current password is incorrect"
```

#### `POST /api/auth/onboarding`
```
Body: { goals?: string[], activityLevel?: string }
// يحدث onboardingCompleted = true
Response 200: Updated user object
```

---

### 4.2 الملف الشخصي `/api/users`

#### `GET /api/users/profile`
```
Response 200: User object كامل
```

#### `PUT /api/users/profile`
```
Body: { firstName, lastName, email, age, height, weight, bloodType }
Response 200: Updated user
```

#### `GET /api/users/preferences`
```
Response 200: dietaryPreferences object | {}
```

#### `PUT /api/users/preferences`
```
Body: dietaryPreferences fields
Response 200: Updated preferences (upsert)
```

---

### 4.3 التغذية `/api/nutrition`

#### `GET /api/nutrition/meals?date=YYYY-MM-DD`
```
Response 200: Meal[] مع بيانات التغذية مدمجة:
[{
  id, name, description, mealType, date,
  calories, protein, carbs, fat, fiber, sugar, sodium
}]
```

#### `POST /api/nutrition/meals`
```
Body: {
  name: string,
  description?: string,
  mealType: "breakfast"|"lunch"|"dinner"|"snack",
  date: string,        // YYYY-MM-DD
  calories?: number,
  protein?: number,
  carbs?: number,
  fat?: number,
  fiber?: number
}
Response 201: { meal, nutrients }
// يُنشئ سجل في meals + سجل في nutrients
```

#### `PUT /api/nutrition/meals/:id`
```
Body: نفس POST fields (كلها اختيارية)
Response 200: { meal, nutrients }
```

#### `DELETE /api/nutrition/meals/:id`
```
Response 204: No Content
```

#### `GET /api/nutrition/daily-summary?date=YYYY-MM-DD`
```
Response 200: {
  totalCalories: number,
  totalProtein: number,
  totalCarbs: number,
  totalFat: number,
  mealCount: number
}
```

---

### 4.4 الصحة `/api/health`

#### `GET /api/health/metrics?date=YYYY-MM-DD`
```
Response 200: HealthMetric[]
// إذا لم يُحدد date → يرجع كل القياسات
```

#### `POST /api/health/metrics`
```
Body: {
  type: "Blood Pressure"|"Blood Glucose"|"Heart Rate"|"Weight"|"Sleep"|"Water",
  value: string,   // e.g. "120/80" لضغط الدم، "95" للسكر
  unit: string,    // mmHg, mg/dL, bpm, kg, hours, ml
  date: string,
  notes?: string
}
Response 201: HealthMetric
```

#### `GET /api/health/medications`
```
Response 200: Medication[]
```

#### `POST /api/health/medications`
```
Body: { name, dosage, unit, frequency, reason?, startDate, endDate?, prescribedBy?, notes? }
Response 201: Medication
```

#### `PUT /api/health/medications/:id`
```
Body: أي field من Medication (partial)
Response 200: Updated Medication
```

#### `DELETE /api/health/medications/:id`
```
Response 204
```

#### `GET /api/health/journal`
```
Response 200: JournalEntry[] (مرتبة حسب التاريخ تنازلياً)
```

#### `POST /api/health/journal`
```
Body: { date, title, content, mood, energy, tags? }
Response 201: JournalEntry
```

#### `PUT /api/health/journal/:id`  |  `DELETE /api/health/journal/:id`
```
Response 200 / 204
```

---

### 4.5 الأهداف `/api/goals`

#### `GET /api/goals`
```
Response 200: UserGoal[] (فقط isActive = true)
```

#### `POST /api/goals`
```
Body: { goalType, targetWeight?, startWeight?, targetDate?, targetCalories? }
Response 201: UserGoal
```

#### `PUT /api/goals/:id`
```
Body: Validated with insertUserGoalSchema.partial()
// يرفض أي حقل غير معرّف في الـ schema
Response 200: Updated UserGoal
```

#### `DELETE /api/goals/:id`
```
// يضع isActive = false (soft delete)
Response 200: { success: true }
```

---

### 4.6 Chatbot `/api/chatbot` و `/api/chat`

#### `GET /api/chatbot/conversations`
```
Response 200: [{ conversationId, lastMessage, messageCount }]
```

#### `GET /api/chatbot/conversations/:conversationId`
```
Response 200: Message[]
```

#### `POST /api/chatbot/messages`
```
Body: { conversationId: string, content: string }
Response 200: { userMessage, assistantMessage }
// المساعد يستخدم Groq llama-3.1-8b-instant
```

#### `DELETE /api/chatbot/conversations/:conversationId`
```
Response 200: { deleted: number }
```

#### `POST /api/chat` *(Rate limited: 50 req / 15 min)*
```
// Format A:
Body: { message: string, history?: [{role, content}] }

// Format B:
Body: { messages: [{role: "system"|"user"|"assistant", content}] }

Response 200: {
  reply: string,     // Format A
  message: string,   // Format B alias
  choices: [{ message: { content } }]  // OpenAI-compatible
}

// LLM: Groq llama-3.1-8b-instant
// Temperature: 0.7
// Max tokens: 2048
// Arabic detection: /[\u0600-\u06FF]/ → يرد بالعربي
```

---

### 4.7 تحليل الصور `/api/analyze-meal-photo`

```
POST /api/analyze-meal-photo
Body: {
  imageBase64: string,   // base64 بدون prefix
  mimeType: string,      // "image/jpeg" | "image/png"
  language?: "en"|"ar"
}
Response 200: {
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
}
// LLM: Groq llama-3.2-11b-vision-preview
```

---

### 4.8 تتبع الماء `/api/water`

#### `GET /api/water/logs?date=YYYY-MM-DD`
```
Response 200: WaterLog[]
```

#### `POST /api/water/logs`
```
Body: { amount: number, unit?: "ml"|"oz", date?: string }
Response 201: WaterLog
```

#### `DELETE /api/water/logs/:id`
```
Response 204
```

---

### 4.9 قاعدة بيانات الأكل `/api/food-database`

#### `GET /api/food-database/categories`
```
Response 200: string[]  // كل الفئات الفريدة
```

#### `GET /api/food-database/foods?q=QUERY&category=CATEGORY`
```
// بحث في الاسم الإنجليزي والعربي
Response 200: FoodItem[]  // أقصى 20 نتيجة
```

#### `POST /api/food-database/calculate`
```
Body: { foodName: string, servingUnit: string, quantity: number }
Response 200: {
  calories, protein, carbs, fat, fiber, sugar,
  cholesterol, sodium, vitamins, minerals
}
```

---

### 4.9.5 الطوارئ `/api/emergency`

#### `GET /api/emergency/contacts`
```
Response 200: EmergencyContact[]
```

#### `POST /api/emergency/contacts`
```
Body: { name, phone, relationship?, isPrimary? }
Response 201: EmergencyContact
```

#### `DELETE /api/emergency/contacts/:id`
```
Response 200: { success: true }
```

#### `GET /api/emergency/medical-info`
```
Response 200: EmergencyMedicalInfo | {}
```

#### `PUT /api/emergency/medical-info`
```
Body: { bloodType?, allergies?, medications?, conditions? }
Response 200: EmergencyMedicalInfo  // upsert
```

### 4.9.6 حذف الحساب

#### `DELETE /api/users/me`
```
// يحذف المستخدم + cascade يحذف كل البيانات
// يدمر الـ session
Response 200: { success: true }
Response 401: Unauthorized
```

### 4.10 مسارات أخرى

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/api/progress/streak` | `{ streak, totalDaysLogged }` |
| GET | `/api/notifications` | تذكيرات الأدوية القادمة |
| GET | `/api/coaching/sessions` | جلسات الكوتشينج |
| POST | `/api/coaching/sessions` | إنشاء جلسة |
| PUT | `/api/coaching/sessions/:id` | تحديث جلسة |
| DELETE | `/api/coaching/sessions/:id` | حذف جلسة |
| POST | `/api/upload` | رفع ملف (base64، max 10MB) |
| GET | `/api/uploads/:id` | تحميل ملف |
| GET | `/api/health` | Health check: `{ status: "ok", timestamp }` |

---

## 5. نظام المصادقة والأمان

### bcrypt (server/auth.ts)

```typescript
// تشفير كلمة المرور
const hash = await bcrypt.hash(password, 10);  // salt rounds = 10

// التحقق
const match = await bcrypt.compare(password, hash);
```

### اشتراطات كلمة المرور (Production)

| الشرط | التفاصيل |
|-------|---------|
| الطول | 8 أحرف على الأقل |
| أحرف صغيرة | مطلوبة |
| أحرف كبيرة | مطلوبة |
| أرقام | مطلوبة |
| رموز خاصة | مطلوبة |
| Test mode | أي password مقبول |

### Session

```typescript
// server/index.ts
session({
  secret: process.env.SESSION_SECRET,  // ≥ 32 حرف (إلزامي في production)
  resave: false,
  saveUninitialized: false,
  store: MemoryStore,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 أيام
    httpOnly: true,
    secure: true,  // في production فقط
  }
})
```

> ⚠️ `SESSION_SECRET` أقل من 32 حرف في production → خطأ مميت يوقف السيرفر.

### Reset Token (server/email.ts)

```typescript
// توليد token
crypto.randomBytes(32).toString('hex')  // 64 حرف hex

// صلاحية
TTL = 60 * 60 * 1000  // ساعة واحدة

// التخزين (in-memory)
Map<token, { userId, email, expiresAt }>

// Consume (مرة واحدة فقط)
// يُحذف التوكن فور الاستخدام
```

### Rate Limiting

```typescript
// /api/chat endpoint فقط
rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 دقيقة
  max: 50,                    // 50 طلب
  message: { error: "Too many requests..." }
})
```

---

## 6. المعادلات والحسابات الطبية

### 6.1 مؤشر كتلة الجسم (BMI)

```
BMI = الوزن (كجم) / الطول (م)²

التصنيف:
< 18.5   → نقص الوزن
18.5–24.9 → طبيعي
25.0–29.9 → زيادة وزن
30.0–34.9 → سمنة درجة 1
≥ 35.0   → سمنة مفرطة
```

### 6.2 الوزن المثالي — Devine IBW (1974)

```
الذكور:   IBW = 50  + 2.3 × (الطول_بالإنش − 60)
الإناث:   IBW = 45.5 + 2.3 × (الطول_بالإنش − 60)

// ححويل: 1 إنش = 2.54 سم → الطول_بالإنش = الطول_سم / 2.54
```

### 6.3 الوزن المعدل — ABW (للسمنة)

```
// يُطبق عندما: الوزن الفعلي > IBW × 1.2
ABW = IBW + 0.4 × (الوزن_الفعلي − IBW)
```

### 6.4 معدل الأيض الأساسي — Mifflin-St Jeor BMR (1990)

```
قاعدة: (10 × الوزن_كجم) + (6.25 × الطول_سم) − (5 × العمر)
الذكور:  BMR = قاعدة + 5
الإناث:  BMR = قاعدة − 161

المصدر: Mifflin et al., 1990 (الأدق للسكان المعاصرين)
```

### 6.5 معدل الطاقة الكلي — TDEE

```
TDEE = BMR × معامل_النشاط

معاملات النشاط:
1.2   → خامل (لا تمرين)
1.375 → نشاط خفيف (1-3 أيام/أسبوع)
1.55  → نشاط متوسط (3-5 أيام/أسبوع)
1.725 → نشاط عالٍ (6-7 أيام/أسبوع)
1.9   → نشاط مكثف جداً
```

### 6.6 نسبة الدهون — Navy Body Fat (Hodgdon & Beckett, 1984)

```
الذكور:
BF% = 86.010 × log₁₀(الخصر − الرقبة) − 70.041 × log₁₀(الطول) + 36.76

الإناث:
BF% = 163.205 × log₁₀(الخصر + الورك − الرقبة) − 97.684 × log₁₀(الطول) − 78.387

// كل القياسات بالسنتيمتر
```

### 6.7 نسبة الدهون من BMI — Deurenberg (1991)

```
BF% = 1.20 × BMI + 0.23 × العمر − 10.8 × الجنس − 5.4
// الجنس: ذكر = 1، أنثى = 0
```

### 6.8 الكتلة العضلية الصافية

```
LBM  = الوزن × (1 − BF% / 100)   // Lean Body Mass
FFMI = LBM / الطول_م²              // Fat-Free Mass Index
FFMI_normalized = FFMI + 6.1 × (1.8 − الطول_م)
```

### 6.9 BMR من الكتلة العضلية — Katch-McArdle

```
BMR = 370 + 21.6 × LBM
// أدق عندما تُعرف نسبة الدهون
```

### 6.10 أهداف الماكرو حسب الهدف

| الهدف | السعرات | البروتين | الدهون | الكربوهيدرات | الألياف |
|-------|---------|---------|-------|-------------|--------|
| خسارة وزن | `max(1200, TDEE − 500)` | 2.2 جم/كجم | 0.9 جم/كجم | المتبقي ÷ 4 | 14 جم/1000 kcal |
| حفاظ | TDEE | 1.6 جم/كجم | 0.9 جم/كجم | المتبقي ÷ 4 | 14 جم/1000 kcal |
| بناء عضلات | TDEE + 300 | 1.8 جم/كجم | 1.0 جم/كجم | المتبقي ÷ 4 | 14 جم/1000 kcal |

```
// معادلة حساب الكربوهيدرات:
كاربس = (السعرات − بروتين×4 − دهون×9) / 4
// الألياف (IOM Standard): 14 جم لكل 1000 سعر حراري
```

### 6.11 احتياج الماء اليومي

```
هدف_الماء_مل = الوزن_كجم × 33
// مثال: 70 كجم → 2310 مل/اليوم
// يُستخدم في: WaterTracking، PredictiveInsights (هدف ديناميكي من وزن المستخدم)
// القيمة الافتراضية إذا لم يُسجَّل وزن: 2500 مل
```

### 6.12 احتياج البروتين حسب مستوى النشاط

```
خامل:           1.0 جم / كجم
متوسط النشاط:   1.3 جم / كجم
عالي النشاط:    1.5 جم / كجم
```

### 6.13 نسبة الخصر للطول (WHtR)

```
WHtR = محيط_الخصر_سم / الطول_سم
> 0.5 → زيادة خطر القلب والسكري
```

---

## 7. الذكاء الاصطناعي والتحليل

### 7.1 AI Health Score (AIScore.tsx)

```
scoreComponent(actual, target):
  ratio = actual / target
  ratio ∈ [0.88, 1.12] → 25 نقطة  (ممتاز)
  ratio ∈ [0.75, 1.25] → 18 نقطة  (جيد)
  ratio ∈ [0.55, 1.40] → 10 نقطة  (مقبول)
  else               → 4 نقاط   (ضعيف)

الدرجة الكلية = Σ scoreComponent(ماكرو_i, هدف_i)  للـ 4 ماكرو
// max = 100

تصنيف الدرجة:
≥ 80  → optimal (أزرق/أخضر)
55-79 → fair (أصفر)
< 55  → poor (أحمر)
```

**أهداف AI Score (مخصصة أو افتراضية):**

```
// الأولوية: dietaryPreferences من DB → حساب من الوزن → افتراضي
calories = prefs.calorieGoal               || 2000
protein  = prefs.proteinGoal               || weight_kg × 1.3
carbs    = prefs.carbGoal                  || 250 جم
fat      = prefs.fatGoal                   || 75 جم
```

**أهداف الـ Dashboard الثابتة (SummaryCards):**

| المؤشر | الهدف اليومي |
|--------|-------------|
| السعرات | 2400 kcal |
| البروتين | 160 جم |
| الكربوهيدرات | 250 جم |
| الدهون | 75 جم |
| الألياف | 30 جم |
| الماء | وزن_كجم × 33 مل (ديناميكي) |

### 7.2 التوقعات الصحية (PredictiveInsights.tsx)

#### خطر الجفاف

```
هدف_الماء = الوزن_كجم × 33 مل
نسبة_الترطيب = min((ماء_اليوم / هدف_الماء) × 100, 100)
خطر_الجفاف = max(0, 100 − نسبة_الترطيب)

// إذا لم يُسجل ماء اليوم → خطر افتراضي = 72%
لون:  > 55% → أصفر (تحذير)
      ≤ 55% → أزرق (طبيعي)
```

#### خطر عدم استقرار سكر الدم

```
// بيانات قياسات Blood Glucose من الـ DB
avg = متوسط كل القراءات
highCount = عدد القراءات > 140 mg/dL
highFraction = highCount / إجمالي_القراءات

خطر:
  avg > 126 && highFraction > 0.5  → 82% (مرتفع جداً)
  highFraction > 0.3 || avg > 110  → 55% (متوسط)
  avg ≤ 100                        → 12% (منخفض)
  else                             → 28%
  لا توجد قراءات                   → 30% (افتراضي)
```

#### خطر نقص التغذية

```
هدف_البروتين = الوزن_كجم × 1.0 جم/كجم
متوسط_البروتين = (مجموع بروتين آخر 7 أيام) / 7

خطر:
  لا وجبات           → 65%
  < 50% من الهدف     → 78%
  < 75% من الهدف     → 48%
  ≥ 100% من الهدف    → 14%
  else               → 28%
```

### 7.3 حدود ضغط الدم (AHA 2017)

```
طبيعي:        systolic < 120  &&  diastolic < 80
مرتفع:        systolic 120–129  &&  diastolic < 80
مرحلة 1:      systolic 130–139  ||  diastolic 80–89
مرحلة 2:      systolic ≥ 140   ||  diastolic ≥ 90

// تحذير تلقائي: إذا ≥ 2 قراءات بـ systolic ≥ 130
خطوط مرجعية في الـ Chart: 120 (أخضر), 130 (أصفر), 140 (أحمر)
```

### 7.4 حدود سكر الدم

```
صيام:
  طبيعي:        < 100 mg/dL
  ما قبل السكري: 100–125 mg/dL
  سكري:         ≥ 126 mg/dL

بعد الأكل:
  طبيعي:        < 140 mg/dL
  ما قبل السكري: 140–199 mg/dL
  سكري:         ≥ 200 mg/dL
```

### 7.5 نموذج اللغة (Groq API)

```typescript
// Chat / Chatbot
model:      "llama-3.1-8b-instant"
temperature: 0.7
max_tokens:  2048
// Arabic detection: /[\u0600-\u06FF]/ في الرسالة

// Photo Analysis
model: "llama-3.2-11b-vision-preview"
// يرجع JSON: { name, calories, protein, carbs, fat }

// إذا GROQ_API_KEY غير موجود
// → رسالة واضحة للمستخدم بدل صمت
```

### 7.6 تقدير الماكرو من السعرات (Nutrition.tsx)

```
بروتين = (السعرات × 0.30) / 4   → 30% من الطاقة
كربوهيدرات = (السعرات × 0.40) / 4   → 40%
دهون = (السعرات × 0.25) / 9      → 25%
ألياف = (السعرات × 0.05) / 2      → 5%
```

### 7.7 تقدير الصوديوم والكوليسترول (SummaryCards)

```
صوديوم_مق (ملجم) = (دهون × 30) + 250
كوليسترول (ملجم) = 185 + (دهون × 1.2)

أهداف:
  صوديوم   → 2300 ملجم/يوم
  كوليسترول → 200 ملجم/يوم
```

---

## 8. قواعد البيانات المضمنة

### 8.1 قاعدة الأغذية (shared/food-nutrition.ts)

```typescript
interface FoodItem {
  name: string;           // الاسم الإنجليزي
  nameAr: string;         // الاسم العربي
  category: string;       // dairy|fruit|vegetable|grain|protein|nut|oil|sweet|beverage|legume
  per100g: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    cholesterol: number;
    sodium: number;
    vitamins: { A, B1, B6, B12, C, D };  // كلها ملجم
    minerals: { calcium, iron, magnesium, zinc };  // ملجم
    nutritionDensityScore: number;  // 0-100
  };
  servingUnits: ServingUnit[];
  defaultServingUnit: string;
}
```

**الإحصائيات:**
- 219+ صنف غذائي
- 10 فئات
- كل قيمة لكل 100 جرام

**وحدات القياس المتاحة:**

| الوحدة | النوع |
|--------|-------|
| grams (جرام) | كتلة |
| ounces (أونصة) | كتلة |
| cups (كوب) | حجم |
| tablespoons (ملعقة كبيرة) | حجم |
| pieces (قطعة/حبة) | عدد |

---

### 8.2 قاعدة التفاعلات الدوائية (shared/drug-interactions.ts)

```typescript
interface DrugInteraction {
  id: string;
  drug1: string;        drug1Ar: string;
  drug2: string;        drug2Ar: string;
  severity: "high" | "medium" | "low";
  category: string;
  description: string;  descriptionAr: string;
}
```

**الفئات:**

| الفئة | أمثلة على تفاعلات |
|-------|-----------------|
| heart | Amlodipine + Simvastatin → خطر انحلال العضلات (Rhabdomyolysis) |
| blood | Atenolol + Verapamil → بطء قلب حاد، احتمال توقف |
| blood_thinners | Warfarin + Aspirin → خطر نزيف مرتفع |
| diabetes | Metformin + Alcohol → حماض لاكتيكي |
| antibiotics | Ciprofloxacin + Antacids → تقليل امتصاص 50-90% |
| psychiatric | Lithium + NSAIDs → ارتفاع مستوى الليثيوم |
| stomach | Omeprazole + Clopidogrel → تقليل فعالية Clopidogrel |
| supplements | Vitamin K + Warfarin → عكس تأثير مضاد التخثر |
| hormones | Oral Contraceptives + Rifampin → فشل وقاية |

**مستويات الخطورة:**
- **HIGH:** تهدد الحياة، توقف فوري + مراجعة طبيب
- **MEDIUM:** تفاعل كبير يحتاج متابعة
- **LOW:** تفاعل بسيط، يكفي الإفصاح

**الإحصائيات:** 200+ زوج تفاعل

---

## 9. نظام الإشعارات

### تذكيرات الأدوية (useMedicationReminders.ts)

```typescript
CHECK_INTERVAL_MS = 60_000  // يفحص كل دقيقة

// شرط الإطلاق:
الوقت_المجدول ± 2 دقيقة  &&  لم يُطلق خلال آخر ساعة

// حد التكرار: مرة واحدة/ساعة لكل (دواء + وقت)
```

**تحليل صيغة الجرعات:**

| الصيغة | الأوقات المُستخرجة |
|--------|-----------------|
| `"9:00 AM"` | `[09:00]` (Regex مباشر) |
| `"14:30"` | `[14:30]` (Regex مباشر) |
| `"twice daily"` | `[08:00, 20:00]` |
| `"three times daily"` | `[08:00, 14:00, 20:00]` |
| `"morning"` | `[08:00]` |
| `"evening"` / `"night"` | `[20:00]` |
| `"noon"` | `[12:00]` |
| أي صيغة أخرى | `[08:00]` (افتراضي) |

**التخزين:**
```
localStorage["nutri-intel-last-reminder"] = Map<"medicationId:HH:MM", timestamp>
```

**Notification API:**
```
Title: "⏰ Medication Reminder"  |  "⏰ تذكير بالدواء"
Body:  "{medicationName} – {dosage}{unit}"
Icon:  /favicon.ico
```

---

## 10. الواجهة الأمامية

### الصفحات (23 صفحة)

| المسار | الصفحة | الوصف |
|--------|--------|-------|
| `/` | Dashboard | لوحة التحكم الرئيسية |
| `/nutrition` | Nutrition | تحليل التغذية الأسبوعي |
| `/meal-planner` | MealPlanner | تخطيط الوجبات + تحليل صور |
| `/health` | HealthMonitoring | مراقبة المؤشرات الحيوية |
| `/predictions` | Predictions | توقعات صحية AI |
| `/report` | HealthReport | تقرير صحي (7/30/90 يوم) |
| `/journal` | HealthJournal | يومية الصحة |
| `/water` | WaterTracking | تتبع شرب الماء |
| `/medications` | Medications | إدارة الأدوية |
| `/ai-assistant` | AIAssistant | المساعد الذكي |
| `/symptom-checker` | SymptomChecker | فحص الأعراض |
| `/drug-interactions` | DrugInteractions | كشف التفاعلات الدوائية |
| `/food-database` | FoodDatabase | قاعدة بيانات الأكل |
| `/bmi` | BMICalculator | حاسبة BMI المتقدمة |
| `/emergency` | Emergency | جهات طوارئ |
| `/coaching` | CoachingConsultation | حجز استشارة |
| `/coaching/sessions` | CoachingSessions | جلساتي |
| `/coaching/chat` | CoachingChat | الدردشة مع المدرب |
| `/profile` | Profile | الملف الشخصي |
| `/settings` | Settings | الإعدادات |
| `/onboarding` | Onboarding | الإعداد الأولي للمستخدم الجديد |
| `/login` | Login | — |
| `/register` | Register | — |
| `/forgot-password` | ForgotPassword | — |
| `/reset-password` | ResetPassword | — |

### مكونات لوحة التحكم

| المكون | الوصف |
|--------|-------|
| `SummaryCards` | 10 بطاقات مؤشرات يومية |
| `WeeklyTrends` | مخطط منطقة للسعرات / الكربو / البروتين |
| `AIScore` | درجة الامتثال الغذائي (0-100) |
| `PredictiveInsights` | 3 مؤشرات خطر تنبؤية |
| `TodaysMeals` | وجبات اليوم |
| `Medications` | الأدوية النشطة |
| `HealthJournal` | آخر إدخالات اليومية |
| `StreakWidget` | سلسلة الأيام المتتالية |
| `GoalProgress` | شريط تقدم الأهداف |
| `NotificationBanner` | طلب إذن الإشعارات (synchronous check) |

### الـ Hooks المخصصة

| Hook | الوظيفة |
|------|---------|
| `useNutrition` | `useDailySummary`, `useMeals`, `useCreateMeal`, `useDeleteMeal` |
| `useHealth` | `useHealthMetrics`, `useMedications`, `useHealthJournal`, mutations |
| `useMedicationReminders` | جدولة تذكيرات الأدوية |
| `use-language` | `{ t, language, setLanguage }` — EN/AR |
| `use-font-size` | تكبير/تصغير الخط |
| `use-toast` | Toast notifications |
| `use-mobile` | كشف الشاشات الصغيرة |

### Date Utilities (client/src/lib/dateUtils.ts)

```typescript
today()           → "2026-04-22"
getLast7Days()    → ["2026-04-22", ..., "2026-04-16"]  // الأحدث أولاً
getLastNDays(n)   → مصفوفة n تاريخ
getWeekDates()    → الأيام من الاثنين إلى الأحد للأسبوع الحالي
```

---

## 11. نظام الترجمة

### الهيكل (client/src/lib/i18n.ts)

```typescript
const translations = {
  en: { key: "English text", ... },
  ar: { key: "النص العربي", ... }
}

// الاستخدام:
const { t, language } = useLanguage();
t("dashboard")  // "Dashboard" أو "لوحة التحكم"
```

### مجموعات المفاتيح الرئيسية

| المجموعة | أمثلة |
|---------|-------|
| التنقل | `dashboard`, `nutrition`, `mealPlanner`, `healthMonitoring`, `predictions` |
| الإجراءات | `save`, `cancel`, `delete`, `add`, `edit`, `search` |
| التغذية | `calories`, `protein`, `carbs`, `fat`, `fiber`, `water` |
| الصحة | `bloodPressure`, `glucose`, `heartRate`, `sleep`, `weight` |
| الأدوية | `medications`, `dosage`, `frequency`, `addMedication` |
| لوحة التحكم | `welcomeBack`, `nutritionSummaryTitle`, `weeklyTrendsTitle`, `aiPredictions` |
| المصادقة | `login`, `register`, `logout`, `forgotPassword` |

---

## 12. الاختبارات

```
vitest.config.ts
  environment: node
  include:    tests/**/*.test.ts
  coverage:   server/**, shared/**
  exclude:    server/vite.ts, server/static.ts
```

### ملفات الاختبار

| الملف | ما يختبره |
|-------|----------|
| `tests/api.test.ts` | API endpoints (auth, meals, metrics, goals) |
| `tests/bmi.test.ts` | معادلات BMI, IBW, ABW, TDEE |
| `tests/food-database.test.ts` | البحث في قاعدة الأكل، حساب التغذية |
| `tests/i18n.test.ts` | مفاتيح الترجمة موجودة في EN وAR |

```bash
npm test              # تشغيل كل الاختبارات مرة واحدة
npm run test:watch    # وضع المشاهدة
npm run test:coverage # تقرير التغطية
```

**النتيجة الحالية:** 76 / 76 ✅

---

## 13. البناء والنشر

### أوامر npm

```bash
npm run dev          # خادم تطوير (Express + Vite HMR)
npm run dev:client   # Vite فقط على port 5000
npm run build        # بناء إنتاج (Vite + ESBuild)
npm start            # تشغيل إنتاج (dist/index.cjs)
npm run check        # TypeScript type checking
npm run db:push      # مزامنة schema مع PostgreSQL
npm test             # تشغيل الاختبارات
```

### عملية البناء (script/build.ts)

```
1. rm -rf dist/
2. Vite build → dist/public/  (client SPA)
3. ESBuild bundle → dist/index.cjs  (server)
   - platform: node, format: cjs, minify: true
   - يُدمج: express, drizzle-orm, bcryptjs, groq, nodemailer, ...
   - يُستثني: باقي node_modules
```

### متغيرات البيئة

| المتغير | مطلوب؟ | الوصف |
|--------|--------|-------|
| `DATABASE_URL` | ✅ Production | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | ✅ Production | ≥ 32 حرف عشوائي |
| `GROQ_API_KEY` | للـ AI | Groq API key |
| `SMTP_HOST` | للـ email | خادم SMTP |
| `SMTP_PORT` | للـ email | عادةً 587 |
| `SMTP_USER` | للـ email | — |
| `SMTP_PASS` | للـ email | — |
| `SMTP_FROM` | اختياري | default: `noreply@nutri-intel.com` |
| `APP_URL` | اختياري | default: `http://localhost:5000` |
| `PORT` | اختياري | default: 5000 |
| `NODE_ENV` | اختياري | `production` لتفعيل HTTPS cookies |
| `ANALYZE` | اختياري | `true` لتوليد bundle stats |

### Docker

```yaml
# docker-compose.yml
services:
  app:   # Node.js server
  db:    # PostgreSQL

# Dockerfile: multi-stage build
# railway.json: Railway.app deployment config
```

### Vite Bundle Chunks

```
react:    react + react-dom
tanstack: @tanstack/react-query
ui:       Radix UI dialogs/popovers/tooltips
icons:    lucide-react
themes:   next-themes
three:    three.js + @react-three/fiber + drei
pdf:      jspdf
charts:   recharts
```

---

## 14. الثوابت والحدود الحرجة

### حدود المؤشرات الصحية

| المؤشر | طبيعي | تحذير | خطر |
|--------|-------|-------|-----|
| BMI | 18.5–24.9 | 25–29.9 أو < 18.5 | ≥ 30 |
| ضغط الدم (Systolic) | < 120 | 130–139 | ≥ 140 |
| ضغط الدم (Diastolic) | < 80 | 80–89 | ≥ 90 |
| سكر الدم (صيام) | < 100 | 100–125 | ≥ 126 |
| سكر الدم (بعد أكل) | < 140 | 140–199 | ≥ 200 |
| معدل القلب | 60–100 | > 100 | — |
| النوم | 7–9 ساعات | < 7 أو > 9 | — |
| الكوليسترول | < 200 ملجم | 200–239 | ≥ 240 |
| الصوديوم اليومي | < 2300 ملجم | 2300–3000 | > 3000 |

### حدود النظام

| الإعداد | القيمة |
|--------|-------|
| حجم الجلسة | 7 أيام |
| صلاحية رمز إعادة كلمة المرور | ساعة واحدة |
| حد طلبات Chat | 50 طلب / 15 دقيقة |
| حجم رفع الملفات | 10 ميجابايت |
| طول SESSION_SECRET (الإنتاج) | ≥ 32 حرف |
| Connection Pool | max 10 connections |
| Idle Timeout | 30 ثانية |
| Connect Timeout | 10 ثواني |
| فترة فحص تذكيرات الأدوية | 60 ثانية |
| نافذة إطلاق التذكير | ± 2 دقيقة |
| حد إعادة الإشعار | مرة واحدة / ساعة لكل دواء |

### أهداف التغذية اليومية (Dashboard)

| المؤشر | الهدف |
|--------|------|
| السعرات | 2400 kcal |
| البروتين | 160 جم |
| الكربوهيدرات | 250 جم |
| الدهون | 75 جم |
| الألياف | 30 جم |
| الماء | 3000 مل |
| السكر | 50 جم |
| الصوديوم | 2300 ملجم |
| الكوليسترول | 200 ملجم |

---

---

## 15. سجل التغييرات

### الإصدار 1.1 — 2026-04-22

| التغيير | التفاصيل |
|---------|---------|
| **Emergency → DB** | نقل جهات الطوارئ والمعلومات الطبية من localStorage إلى جداول DB حقيقية (`emergency_contacts`, `emergency_medical_info`) |
| **حذف الحساب** | `DELETE /api/users/me` يحذف المستخدم وكل بياناته من DB (cascade) ويدمر الـ session |
| **Coaching** | CoachingConsultation وCoachingSessions أصبحتا صفحات حقيقية تتصلان بـ `/api/coaching/sessions` |
| **WaterTracking** | الهدف اليومي أصبح ديناميكياً: `وزن_كجم × 33` بدلاً من قيمة ثابتة |
| **AI Score** | الأهداف تُقرأ من `dietaryPreferences` أولاً، ثم تُحسب من الوزن، ثم تستخدم القيم الافتراضية |
| **CoachingChat** | إزالة "Dr. Ahmed" الـ hardcoded — استبدل بـ "Nutri-Intel Coach" / "مساعد نيوتري-إنتل" |
| **SymptomChecker** | توسيع قائمة الأعراض من 20 إلى 37 عَرَض + إضافة مدة الأعراض وشدتها (خفيفة/متوسطة/شديدة) + فلتر بالفئة |
| **Privacy Policy** | كتابة سياسة خصوصية حقيقية ثنائية اللغة في Settings |
| **Dark Mode** | تحسين الألوان: `destructive` أصبح مرئياً، `ring` أصبح أزرق، `border` أكثر وضوحاً، `muted-foreground` أوضح |

---

*تم توليد هذا التوثيق بعد مراجعة الكود المصدري الكامل وتشغيل 76 اختباراً جميعها ناجح ✅*
