"use strict";
// src/seeds/05_default_wishlist.ts
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const seed = {
    name: "05_default_wishlist",
    async run() {
        console.log("   📝 Inserting rich set of default wishlist items...");
        const wishListData = [
            {
                id: "w1111111-1111-1111-1111-111111111111",
                name: "إتاحة نظام الدفع والتقسيط على 12 شهر",
                description: "العميل يطلب توفير خيار التقسيط بدون فوائد بالتعاون مع بنوك مصرية كشرط أساسي لزيادة حجم الطلبيات في الربع القادم.",
            },
            {
                id: "w2222222-2222-2222-2222-222222222222",
                name: "لوحة تحكم (Dashboard) مخصصة لقادة الفرق",
                description: "توفير واجهة رسومية فورية لمتابعة أداء المناديب في الشارع لحظة بلحظة ومقارنة الإنجاز مع التارجت الفعلي.",
            },
            {
                id: "w3333333-3333-3333-3333-333333333333",
                name: "دعم فني متاح 24/7 طوال الأسبوع",
                description: "رغبة ملحة من كبار عملاء الصيدليات والمستشفيات للحصول على خط دعم ساخن لحالات الطوارئ خارج أوقات العمل الرسمية.",
            },
            {
                id: "w4444444-4444-4444-4444-444444444444",
                name: "توفير تطبيق جوال يعمل بالكامل بدون إنترنت (Offline Mode)",
                description: "تطبيق للمناديب يتيح تسجيل الزيارات وحفظ الموقع الجغرافي دون الحاجة لاتصال إنترنت مستمر، مع مزامنة البيانات تلقائياً فور توفر الشبكة.",
            },
            {
                id: "w5555555-5555-5555-5555-555555555555",
                name: "تكامل مع نظام الفواتير الإلكترونية (Zakat & Tax Integration)",
                description: "الشركات الكبرى تبدي رغبة في ربط برنامج الـ CRM والمبيعات بنظام مصلحة الضرائب لإنشاء الفواتير القانونية بضغطة زر.",
            },
            {
                id: "w6666666-6666-6666-6666-666666666666",
                name: "توفير كتالوج منتجات تفاعلي مع نماذج 3D",
                description: "رغبة من عملاء شركات الأثاث والتطوير العقاري لعرض المنتجات للزبائن بشكل تفاعلي ومبهر أثناء الزيارة الميدانية.",
            },
            {
                id: "w7777777-7777-7777-7777-777777777777",
                name: "تنبيهات وإشعارات عبر الواتساب تلقائياً (WhatsApp Automation)",
                description: "إرسال رسالة ترحيبية أو تفاصيل الفاتورة ومواعيد الزيارات للعميل بشكل تلقائي عبر الواتساب بمجرد تغيير حالة الزيارة إلى (Sales).",
            },
            {
                id: "w8888888-8888-8888-8888-888888888888",
                name: "توفير خصومات موسمية للعملاء الأوفياء",
                description: "صياغة نظام ولاء مدمج يمنح كود خصم تلقائي للعملاء الذين تخطى حجم تعاملهم التاريخي حاجز الـ 100 ألف جنيه.",
            }
        ];
        console.log("   📥 Saving wishlist items...");
        await db_1.db.insert(schema_1.wishList).values(wishListData);
        console.log(`   🚀 Completed! Seeded ${wishListData.length} highly requested wishlist items.`);
    },
    async rollback() {
        console.log("   🗑️ Rolling back seeded wishlist items...");
        // حذف الرغبات المحددة لضمان عدم تأثر أي بيانات تم إدخالها لاحقاً بواسطة المستخدمين
        await db_1.db.delete(schema_1.wishList).where((0, drizzle_orm_1.sql) `id LIKE 'w1111111%' OR id LIKE 'w2222222%' OR id LIKE 'w3333333%' OR id LIKE 'w4444444%' OR id LIKE 'w5555555%' OR id LIKE 'w6666666%' OR id LIKE 'w7777777%' OR id LIKE 'w8888888%'`);
        console.log("   ✅ Rollback completed successfully.");
    },
};
exports.default = seed;
