/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import config from '../utils/config';
import authRouter from '../modules/auth/auth.route';
import adminRouter from '../modules/admin/admin.route';
import userRouter from '../modules/user/user.route';
import supplierRouter from '../modules/supplier/supplier.route';
const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRouter.authRouter,
  },
  {
    path: '/admin',
    route: adminRouter.adminRouter,
  },
  {
    path: '/user',
    route: userRouter.authRouter,
  },
  {
    path: '/supplier',
    route: supplierRouter.supplierRouter,
  },
];
defaultRoutes.forEach(route => {
  const apis = route.route.stack.map((path: any) => {
    return { path: path.route.path, methods: path.route.methods };
  });
  apis.map((api: any) => {
    console.log([
      api.methods,
      {
        route: `${config.server_url}${config.api_route}${route.path}${api.path}`,
      },
    ]);
  });
  router.use(route.path, route.route);
});

export default router;
