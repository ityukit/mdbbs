import express from 'express';

export default function express_meta(app, main, settings) {
  const meta = express();
  const router = express.Router();

  meta.use('/', router)

  return meta;
}
