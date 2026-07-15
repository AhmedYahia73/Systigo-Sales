"use strict";
// src/seeds/02_default_targets.ts
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const seed = {
    name: "02_default_targets",
    async run() {
        console.log("   📝 Inserting rich set of default targets...");
        const targetsData = [
            // 🎯 أهداف المبيعات (Sales Targets) - مبالغ مالية أو صفقات مغلقة
            {
                id: "t1111111-1111-1111-1111-111111111111",
                name: "تارجت مبيعات الربع السنوي الأول (Q1)",
                type: "sales",
                number: 150000.00, // مثلاً 150 ألف جنيه/دولار
            },
            {
                id: "t2222222-2222-2222-2222-222222222222",
                name: "تارجت مبيعات الربع السنوي الثاني (Q2)",
                type: "sales",
                number: 250000.00,
            },
            {
                id: "t3333333-3333-3333-3333-333333333333",
                name: "تارجت مبيعات الموظفين المبتدئين شهرياً",
                type: "sales",
                number: 15000.00,
            },
            {
                id: "t4444444-4444-4444-4444-444444444444",
                name: "تارجت مبيعات كبار العملاء (VIP)",
                type: "sales",
                number: 500000.00,
            },
            // 🚗 أهداف الزيارات (Visits Targets) - عدد زيارات للعملاء على الأرض أو الاجتماعات
            {
                id: "t5555555-5555-5555-5555-555555555555",
                name: "تارجت زيارات المبيعات الخارجية الأسبوعي",
                type: "visit",
                number: 20.00, // 20 زيارة ميدانية في الأسبوع
            },
            {
                id: "t6666666-6666-6666-6666-666666666666",
                name: "تارجت زيارات عملاء العقارات شهرياً",
                type: "visit",
                number: 80.00,
            },
            {
                id: "t7777777-7777-7777-7777-777777777777",
                name: "تارجت اجتماعات الـ Zoom والـ Online اليومي",
                type: "visit",
                number: 5.00, // 5 اجتماعات يومياً لكل مندوب
            },
            {
                id: "t8888888-8888-8888-8888-888888888888",
                name: "تارجت زيارات المتابعة والدعم الفني",
                type: "visit",
                number: 12.00,
            }
        ];
        console.log("   📥 Saving targets...");
        await db_1.db.insert(schema_1.targets).values(targetsData);
        console.log(`   🚀 Completed! Seeded ${targetsData.length} diverse targets.`);
    },
    async rollback() {
        console.log("   🗑️ Rolling back seeded targets...");
        // حذف البيانات بناءً على الـ UUIDs المحددة التي تم إدخالها فقط
        await db_1.db.delete(schema_1.targets).where((0, drizzle_orm_1.sql) `id LIKE 't1111111%' OR id LIKE 't2222222%' OR id LIKE 't3333333%' OR id LIKE 't4444444%' OR id LIKE 't5555555%' OR id LIKE 't6666666%' OR id LIKE 't7777777%' OR id LIKE 't8888888%'`);
        console.log("   ✅ Rollback completed successfully.");
    },
};
exports.default = seed;
