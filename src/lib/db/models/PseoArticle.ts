import mongoose, { Schema, Document } from 'mongoose';

export interface IPseoArticle extends Document {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  publishedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

const PseoArticleSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    summary: { type: String },
    content: { type: String },
    keywords: { type: [String], default: [] },
    publishedAt: { type: String },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const PseoArticleModel =
  mongoose.models.PseoArticle ||
  mongoose.model<IPseoArticle>('PseoArticle', PseoArticleSchema, 'pseoArticles');
