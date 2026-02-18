import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class Link extends Model { }

Link.init(
  {
    id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    wish: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'basic',
    },
    min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10000,
    },
    audio: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    sender: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    receiver: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    theme: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prizeAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'prize_amount',
    },
    hasSpun: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_spun',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    sequelize,
    modelName: "Link",
    tableName: "links",
    timestamps: false,
  }
);
