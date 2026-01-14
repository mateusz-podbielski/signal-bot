import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { join } from 'path';
import serveStatic from 'serve-static';

const app = express();
app.use(serveStatic(join(__dirname, 'assets')));
app.listen(process.env.BACKEND_EXTENSION_PORT);
