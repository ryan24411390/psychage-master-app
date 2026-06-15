// Article data layer — public barrel.
export {
  CATEGORY_PAGE_SIZE,
  getArticleBySlug,
  listArticlesByCategorySlug,
  listPopulatedCategories,
} from './repo';
export {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleCategory,
  type ArticleDetail,
  type ArticleListItem,
  type Citation,
} from './types';
