import express from 'express';

export default function express_api(app, main, settings) {
  const api = express();
  const router = express.Router();

  api.use('/', router)

  return api;
}
