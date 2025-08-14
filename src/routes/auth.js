import express from 'express';

export default function express_auth(app, main, settings) {
  const auth = express();
  const router = express.Router();

  auth.use('/', router)

  return auth;
}
