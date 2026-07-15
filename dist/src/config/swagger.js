"use strict";
// src/config/swagger.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CRM API Documentation",
            version: "1.0.0",
            description: "API documentation for our Sales & Leaders management system",
        },
        servers: [
            {
                url: "http://localhost:5000", // قم بتعديل البورت والمضيف حسب مشروعك
                description: "Development Server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    // المسار الذي سيبحث فيه Swagger عن التعليقات المكتوبة لتوثيق الـ Routes
    apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    // رابط عرض واجهة Swagger
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    console.log("📝 Swagger documentation is available at http://localhost:5000/api-docs");
};
exports.setupSwagger = setupSwagger;
