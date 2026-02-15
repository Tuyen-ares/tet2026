import { Router } from "express";

export const createLinkRoutes = (linkController) => {
  const router = Router();

  router.post("/create", linkController.create);
  router.get("/card/:id", linkController.getCardById);
  router.post("/spin/:id", linkController.spin);

  return router;
};
