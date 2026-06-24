// Article data layer — public barrel.
export {
  CATEGORY_PAGE_SIZE,
  getArticleBySlug,
  getFeatured,
  getRelatedArticles,
  listArticlesByCategorySlug,
  listArticlesByCategorySlugs,
  listArticlesBySlugs,
  listBrowseCategories,
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
  type BrowseCategory,
  type Citation,
} from './types';
