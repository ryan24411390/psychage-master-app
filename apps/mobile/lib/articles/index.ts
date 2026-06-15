// Article data layer — public barrel.
export {
  CATEGORY_PAGE_SIZE,
  getArticleBySlug,
  getFeatured,
  getRelatedArticles,
  listArticlesByCategorySlug,
  listArticlesByCategorySlugs,
  listArticlesBySlugs,
  listPopulatedCategories,
  listRecentArticles,
  searchArticles,
} from './repo';
export {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleCategory,
  type ArticleDetail,
  type ArticleListItem,
  type Citation,
} from './types';
