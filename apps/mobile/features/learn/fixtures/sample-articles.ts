// Real published articles, pulled verbatim from the shared Supabase
// public.articles corpus (see docs/adr/003-mobile-article-content-source.md).
// Lets the hub and reader lanes — and their tests — build without live data or
// each other. Bodies are the clinician-reviewed HTML, UNALTERED: the exact shape
// getArticleBySlug returns (ArticleDetail). Regenerate by re-querying the corpus.

import {
  ARTICLE_AUTHOR_NAME,
  ARTICLE_AUTHOR_ROLE,
  type ArticleDetail,
  type ArticleListItem,
} from '@/lib/articles';

export const sampleArticleDetail: ArticleDetail = {
  slug: "pandemic-loneliness-covid-need-for-each-other",
  title: "You Are Not Alone",
  seoDescription: "The COVID-19 pandemic revealed the depth of our need for human connection. Learn what we learned about loneliness and belonging.",
  heroImageUrl: "https://ozourhqyqtpppvpbhphw.supabase.co/storage/v1/object/public/article-images/covers/CAT15-045.jpeg",
  readTime: null,
  tags: ["COVID-19", "Pandemic", "Loneliness", "Social Connection"],
  categoryName: "Loneliness, Social Connection & Belonging",
  categorySlug: "loneliness-connection",
  createdAt: "2026-03-20T07:57:14.871659+00:00",
  subtitle: null,
  contentHtml: "<div><div id=\"introduction\" class=\"scroll-mt-32\"><p class=\"lead text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed\">In March 2020, the world went inside. And we learned, suddenly and collectively, how much we need each other.</p><p class=\"mb-6\">The COVID-19 pandemic was a global experiment in isolation. Lockdowns, social distancing, and fear of contagion severed the casual connections that structure daily life: coworkers, gym buddies, coffee shop regulars, neighbors <button type=\"button\" id=\"citation-ref-1\" class=\"\n                        inline-flex items-center justify-center\n                        w-[18px] h-[18px] ml-0.5 -mt-2\n                        text-[10px] font-bold text-teal-600 dark:text-teal-400\n                        bg-teal-50 dark:bg-teal-900/30\n                        rounded-full cursor-pointer\n                        hover:bg-teal-100 dark:hover:bg-teal-900/50\n                        hover:scale-110\n                        active:scale-95\n                        transition-all duration-150\n                        align-super\n                        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1\n                    \" aria-label=\"Citation 1 — click to view reference\" data-state=\"closed\">1</button>.</p><p class=\"mb-6\">Years later, we are still reckoning with what we learned. This article explores the loneliness crisis the pandemic revealed, how people adapted, and what lasting changes it made to how we connect.</p></div><p class=\"mb-6\">[Full article content would continue here]</p></div>",
  contentFormat: "html",
  authorName: ARTICLE_AUTHOR_NAME,
  authorRole: ARTICLE_AUTHOR_ROLE,
};

export const sampleArticleDetails: ArticleDetail[] = [
  sampleArticleDetail,
  {
  slug: "loneliness-chronic-illness-health-barriers-social-connection",
  title: "The Future of Human Connection",
  seoDescription: "Chronic illness can create profound isolation. Understand why health challenges increase loneliness and how to stay connected.",
  heroImageUrl: "https://ozourhqyqtpppvpbhphw.supabase.co/storage/v1/object/public/article-images/covers/CAT15-044.jpeg",
  readTime: null,
  tags: ["Chronic Illness", "Disability", "Loneliness", "Health"],
  categoryName: "Loneliness, Social Connection & Belonging",
  categorySlug: "loneliness-connection",
  createdAt: "2026-03-20T07:57:14.871659+00:00",
  subtitle: null,
  contentHtml: "<div><div id=\"introduction\" class=\"scroll-mt-32\"><p class=\"lead text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed\">Living with chronic illness is hard enough. But one of the cruelest parts is often invisible: the profound isolation it creates.</p><p class=\"mb-6\">When pain, fatigue, or unpredictable symptoms make it hard to leave the house, when friends stop inviting you because you cancel so often, when your life revolves around doctor appointments and managing symptoms --- loneliness becomes a constant companion <button type=\"button\" id=\"citation-ref-1\" class=\"\n                        inline-flex items-center justify-center\n                        w-[18px] h-[18px] ml-0.5 -mt-2\n                        text-[10px] font-bold text-teal-600 dark:text-teal-400\n                        bg-teal-50 dark:bg-teal-900/30\n                        rounded-full cursor-pointer\n                        hover:bg-teal-100 dark:hover:bg-teal-900/50\n                        hover:scale-110\n                        active:scale-95\n                        transition-all duration-150\n                        align-super\n                        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1\n                    \" aria-label=\"Citation 1 — click to view reference\" data-state=\"closed\">1</button>.</p><p class=\"mb-6\">This article explores why chronic illness increases isolation, how to navigate friendships when your health is a barrier, and where to find community that understands.</p></div><p class=\"mb-6\">[Full article content would continue here]</p></div>",
  contentFormat: "html",
  authorName: ARTICLE_AUTHOR_NAME,
  authorRole: ARTICLE_AUTHOR_ROLE,
},
  {
  slug: "remote-work-social-isolation-working-from-home",
  title: "Loneliness and Democracy",
  seoDescription: "Remote work offers freedom but can increase loneliness. Learn how to maintain connection while working from home.",
  heroImageUrl: "https://ozourhqyqtpppvpbhphw.supabase.co/storage/v1/object/public/article-images/covers/CAT15-043.jpeg",
  readTime: null,
  tags: ["Remote Work", "Work From Home", "Isolation", "Social Connection"],
  categoryName: "Loneliness, Social Connection & Belonging",
  categorySlug: "loneliness-connection",
  createdAt: "2026-03-20T07:57:14.871659+00:00",
  subtitle: null,
  contentHtml: "<div><div id=\"introduction\" class=\"scroll-mt-32\"><p class=\"lead text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed\">Working from home sounded like a dream. No commute. No office politics. Total flexibility. Then you realized: you miss people.</p><p class=\"mb-6\">Remote work has transformed how millions work, offering freedom and flexibility. But it has also created a new form of isolation. When your office is your bedroom and your coworkers are Zoom squares, social connection becomes optional --- and often forgotten <button type=\"button\" id=\"citation-ref-1\" class=\"\n                        inline-flex items-center justify-center\n                        w-[18px] h-[18px] ml-0.5 -mt-2\n                        text-[10px] font-bold text-teal-600 dark:text-teal-400\n                        bg-teal-50 dark:bg-teal-900/30\n                        rounded-full cursor-pointer\n                        hover:bg-teal-100 dark:hover:bg-teal-900/50\n                        hover:scale-110\n                        active:scale-95\n                        transition-all duration-150\n                        align-super\n                        focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1\n                    \" aria-label=\"Citation 1 — click to view reference\" data-state=\"closed\">1</button>.</p><p class=\"mb-6\">This article explores how remote work affects social connection, who is most at risk for isolation, and strategies for maintaining community while working from home.</p></div><p class=\"mb-6\">[Full article content would continue here following the same pattern]</p></div>",
  contentFormat: "html",
  authorName: ARTICLE_AUTHOR_NAME,
  authorRole: ARTICLE_AUTHOR_ROLE,
},
];

export const sampleArticleList: ArticleListItem[] = sampleArticleDetails.map(
  ({
    slug,
    title,
    seoDescription,
    heroImageUrl,
    readTime,
    tags,
    categoryName,
    categorySlug,
    createdAt,
  }) => ({
    slug,
    title,
    seoDescription,
    heroImageUrl,
    readTime,
    tags,
    categoryName,
    categorySlug,
    createdAt,
  }),
);
