import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mindMapsRouter from "./mindmaps/index";
import aiRouter from "./ai/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/mindmaps", mindMapsRouter);
router.use("/ai", aiRouter);

export default router;
