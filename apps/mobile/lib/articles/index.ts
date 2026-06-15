// Article data layer — public barrel.
export {
  getArticleBySlug,
  getFeatured,
  getRelatedArticles,
  listArticlesByCategorySlugs,
} from './repo';
export {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleDetail,
  type ArticleListItem,
} from './types';
