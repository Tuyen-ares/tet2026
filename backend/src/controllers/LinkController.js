export class LinkController {
  constructor(linkService) {
    this.linkService = linkService;
  }

  create = async (req, res, next) => {
    try {
      const result = await this.linkService.createLink(req.body || {});
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCardById = async (req, res, next) => {
    try {
      const result = await this.linkService.getLinkById(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  spin = async (req, res, next) => {
    try {
      const result = await this.linkService.spinLink(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
