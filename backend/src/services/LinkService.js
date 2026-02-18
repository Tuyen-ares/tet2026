import { env } from "../config/env.js";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { generateId, normalizeMinMax, parseStoredTheme, safeInt, sanitizeThemeInput } from "../utils/linkUtils.js";

export class LinkService {
  constructor(linkRepository) {
    this.linkRepository = linkRepository;
  }

  async createLink(payload) {
    const name = String(payload?.name || "").trim();
    const wish = String(payload?.wish || "").trim();
    const title = String(payload?.title || "").trim();
    const audio = String(payload?.audio || "").trim();
    const sender = String(payload?.sender || "").trim();
    const receiver = String(payload?.receiver || "").trim();
    const type = String(payload?.type || "basic").trim() || "basic";
    const theme = sanitizeThemeInput(payload?.theme);

    if (!name) {
      throw new ValidationError("NAME_REQUIRED", "Name is required.");
    }

    const minInput = safeInt(payload?.min, 1000);
    const maxInput = safeInt(payload?.max, 10000);
    const { safeMin, safeMax } = normalizeMinMax(minInput, maxInput);

    const createdAt = new Date();
    const id = generateId();

    await this.linkRepository.create({
      id,
      name,
      title,
      wish,
      type,
      min: safeMin,
      max: safeMax,
      audio,
      sender,
      receiver,
      theme: JSON.stringify(theme),
      createdAt,
    });

    return {
      id,
      createdAt: createdAt.getTime(),
      expiresAt: createdAt.getTime() + env.linkExpiryMs,
    };
  }

  async getLinkById(idInput) {
    const id = String(idInput || "").trim();

    if (!id) {
      throw new ValidationError("ID_REQUIRED", "Card id is required.");
    }

    const link = await this.linkRepository.findById(id);

    if (!link) {
      throw new NotFoundError("NOT_FOUND", "Card not found.");
    }

    const expiresAt = link.createdAt instanceof Date ? link.createdAt.getTime() + env.linkExpiryMs : new Date(link.createdAt).getTime() + env.linkExpiryMs;

    return {
      id: link.id,
      type: link.type || 'basic',
      name: link.name,
      title: link.title || "",
      wish: link.wish || "",
      min: link.min,
      max: link.max,
      audio: link.audio || "",
      sender: link.sender || "",
      receiver: link.receiver || "",
      theme: parseStoredTheme(link.theme),
      createdAt: link.createdAt instanceof Date ? link.createdAt.getTime() : new Date(link.createdAt).getTime(),
      expiresAt,
      expired: Date.now() > expiresAt,
      prizeAmount: link.prizeAmount || null,
      hasSpun: !!link.hasSpun,
    };
  }

  async spinLink(idInput) {
    const id = String(idInput || "").trim();

    if (!id) {
      throw new ValidationError("ID_REQUIRED", "Card id is required.");
    }

    const computePrize = (link) => {
      const min = Math.max(1000, Math.floor(Number(link.min || 0) / 1000) * 1000);
      const maxRaw = Math.floor(Number(link.max || 0) / 1000) * 1000;
      const max = Math.max(min, maxRaw);
      const steps = Math.floor((max - min) / 1000);
      return min + Math.floor(Math.random() * (steps + 1)) * 1000;
    };

    const result = await this.linkRepository.spinOnce(id, computePrize);
    if (!result.success) {
      if (result.reason === 'NOT_FOUND') throw new NotFoundError('NOT_FOUND', 'Card not found.');
      if (result.reason === 'ALREADY_SPUN') return { alreadySpun: true, prize: result.prize };
    }

    return { alreadySpun: false, prize: result.prize };
  }

  async cleanupExpiredLinks() {
    const threshold = new Date(Date.now() - env.linkExpiryMs);
    return this.linkRepository.deleteExpired(threshold);
  }
}
