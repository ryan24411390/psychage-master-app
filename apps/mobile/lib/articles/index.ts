// Article data layer — public barrel.
export {
  getArticleBySlug,
  listArticlesByCategorySlugs,
  listArticlesBySlugs,
  listRecentArticles,
  searchArticles,
} from './repo';
export {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleDetail,
  type ArticleListItem,
} from './types';
