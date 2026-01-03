# سامانه چت بلادرنگ

سیستم چت آنی (Real-time Chat) ساخت‌شده با **Next.js**، **PostgreSQL**، و **Socket.io** برای استفاده در برنامه‌های وب و ادغام در سایت‌های خارجی.

## ✨ ویژگی‌ها

- ✅ **چت بلادرنگ** - پیام‌های آنی از طریق WebSocket
- ✅ **احراز هویت** - ثبت‌نام و ورود امن
- ✅ **آپلود تصاویر** - با فشرده‌سازی خودکار
- ✅ **پنل مدیریت** - برای ادمین‌ها
- ✅ **API عمومی** - برای ادغام در سایت‌های دیگر
- ✅ **Widget** - برای نمایش در سایت‌های خارجی

## 🚀 شروع کار

### پیش‌نیازها

- Node.js 18+
- PostgreSQL 12+

### نصب

```bash
npm install
```

### تنظیم دیتابیس

```bash
# ویرایش DATABASE_URL در .env
npx prisma migrate dev --name init
```

### اجرای برنامه

```bash
npm run dev
```

برنامه در `http://localhost:3000` اجرا می‌شود.

## 📖 صفحات

- **صفحه اصلی**: `http://localhost:3000`
- **ثبت‌نام**: `http://localhost:3000/auth/register`
- **ورود**: `http://localhost:3000/auth/login`
- **چت**: `http://localhost:3000/chat`
- **پنل مدیریت**: `http://localhost:3000/admin`

## 🔌 API

### احراز هویت
```bash
POST /api/auth/register
POST /api/auth/login
```

### پیام‌ها
```bash
GET /api/messages
POST /api/messages
DELETE /api/messages/<id>
```

### آپلود
```bash
POST /api/upload
```

### Widget
```bash
GET /api/widget/messages
POST /api/widget/messages
GET /api/widget/config
GET /api/widget/script
```

## 🔧 ادغام Widget

```html
<script>
  window.CHAT_WIDGET_API_KEY = 'your-api-key';
</script>
<script src="http://localhost:3000/api/widget/script"></script>
```

## 📝 ساختار پروژه

```
├── app/api/          # API routes
├── app/auth/         # صفحات احراز هویت
├── app/chat/         # صفحه چت
├── app/admin/        # پنل مدیریت
├── components/       # React components
├── lib/              # Utilities
└── prisma/           # Database schema
```

## 🚀 استقرار

```bash
npm run build
npm run start
```

یا PM2:

```bash
pm2 start npm --name "chat" -- run start
```
