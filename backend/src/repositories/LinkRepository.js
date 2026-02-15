import { Op } from "sequelize";
import { Link } from "../models/index.js";

export class LinkRepository {
  async create(payload) {
    return Link.create(payload);
  }

  async findById(id) {
    return Link.findByPk(id);
  }

  async deleteExpired(threshold) {
    return Link.destroy({
      where: {
        createdAt: {
          [Op.lt]: threshold,
        },
      },
    });
  }

  async spinOnce(id, computePrizeFn) {
    // computePrizeFn should return an integer prize amount
    const sequelize = Link.sequelize;
    return sequelize.transaction(async (transaction) => {
      const link = await Link.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!link) return { success: false, reason: 'NOT_FOUND' };
      if (link.hasSpun) return { success: false, reason: 'ALREADY_SPUN', prize: link.prizeAmount };

      const prize = computePrizeFn(link);
      link.prizeAmount = prize;
      link.hasSpun = true;
      await link.save({ transaction });

      return { success: true, prize };
    });
  }
}
