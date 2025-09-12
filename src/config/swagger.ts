import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Management API',
      version: '1.0.0',
      description: 'Dokumentasi API untuk project User Management (Express + TypeScript)',
    },
    servers: [
      { url: 'http://localhost:3000/api' }, // base path API
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // lokasi file yang berisi komentar swagger
};

export const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
