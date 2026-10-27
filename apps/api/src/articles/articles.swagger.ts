export const articlePublicationStatusEnum = ['draft', 'published', 'archived'];

const articleBodyProperties = {
  slug: { type: 'string' },
  title: { type: 'string' },
  excerpt: { type: 'string' },
  content: { type: 'string' },
  status: { type: 'string', enum: articlePublicationStatusEnum },
  coverImageUrl: { type: 'string', nullable: true },
  seoTitle: { type: 'string', nullable: true },
  seoDescription: { type: 'string', nullable: true },
  publishedAt: { type: 'string', format: 'date-time', nullable: true },
  authorId: { type: 'string' },
  categoryIds: { type: 'array', items: { type: 'string' } },
  tagIds: { type: 'array', items: { type: 'string' } },
};

export const articleSchema = {
  type: 'object',
  required: [
    'id',
    'slug',
    'title',
    'excerpt',
    'content',
    'status',
    'coverImageUrl',
    'seoTitle',
    'seoDescription',
    'publishedAt',
    'authorId',
    'categoryIds',
    'tagIds',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    ...articleBodyProperties,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const createArticleBodySchema = {
  type: 'object',
  required: [
    'slug',
    'title',
    'excerpt',
    'content',
    'status',
    'authorId',
    'categoryIds',
    'tagIds',
  ],
  properties: articleBodyProperties,
};

export const updateArticleBodySchema = {
  type: 'object',
  properties: articleBodyProperties,
};
