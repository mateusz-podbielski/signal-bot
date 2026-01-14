import express, {Router} from 'express';

export default abstract class AppRouter {
    public router: Router;

    protected constructor() {
        this.router = express.Router();
        this.routes();
    }

    protected abstract routes(): void;
}
