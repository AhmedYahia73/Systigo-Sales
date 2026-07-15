// src/config/swagger.ts

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
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

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  // رابط عرض واجهة Swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📝 Swagger documentation is available at http://localhost:5000/api-docs");
};