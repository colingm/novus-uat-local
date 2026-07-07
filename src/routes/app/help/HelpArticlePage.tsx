/**
 * HelpArticlePage — detail view for /app/help/:slug (Phase 5, D-07).
 *
 * Reads `slug` from React Router's `useParams`, looks up the article via
 * `getHelpArticleBySlug`. Two branches:
 *   - Article found: renders topic + title + paragraph body (split on '\n\n') +
 *     '← Back to Help' anchor.
 *   - Article not found: renders a compact not-found state with the same back
 *     link — NOT a router-level 404 (mirrors Phase 4 filtered-empty pattern).
 *
 * Both branches use PENDO_IDS.help.article.detailBackLink on the back link so
 * Phase 6 guides can target 'return to help list' intent regardless of whether
 * the user landed on a real article or a missing slug.
 *
 * maw={680} on the body container keeps line length readable at body font size
 * (~60-80 chars; same heuristic as Phase 4 Settings maw={480}, scaled for prose).
 */

import { useEffect } from 'react'
import { Stack, Title, Text, Center, Anchor as MantineAnchor } from '@mantine/core'
import { Link, useParams } from 'react-router'
import { PENDO_IDS } from '../../../pendo/PENDO_IDS'
import { getHelpArticleBySlug } from '../../../help/helpArticles'

export function HelpArticlePage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getHelpArticleBySlug(slug) : undefined

  useEffect(() => {
    if (!slug) return
    const a = getHelpArticleBySlug(slug)
    if (a && typeof pendo !== 'undefined') {
      pendo.track('help_article_viewed', {
        slug,
        title: a.title,
        topic: a.topic,
        keywordCount: a.keywords.length,
      })
    }
  }, [slug])

  if (!article) {
    return (
      <Center mih={400}>
        <Stack align="center" gap="md">
          <Title order={3}>Article not found</Title>
          <Text c="dimmed" ta="center" maw={420}>
            We couldn&apos;t find a help article at this URL. It may have been moved or removed.
          </Text>
          {/*
           * S3 polymorphic-Anchor exception: raw Mantine Anchor with
           * component={Link} for React Router navigation. Halo Anchor wrapper
           * doesn't expose polymorphic component typing. Value flows from
           * PENDO_IDS — no hand-typed string. Mirrors HelpList.tsx exception.
           */}
          <MantineAnchor
            component={Link}
            to="/app/help"
            data-pendo-id={PENDO_IDS.help.article.detailBackLink}
          >
            ← Back to Help
          </MantineAnchor>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="xl" maw={680}>
      <Stack gap={4}>
        <Text size="sm" c="dimmed">{article.topic}</Text>
        <Title order={3}>{article.title}</Title>
      </Stack>

      <Stack gap="md">
        {article.body.split('\n\n').map((paragraph, i) => (
          <Text key={i} size="md">{paragraph}</Text>
        ))}
      </Stack>

      {/*
       * S3 polymorphic-Anchor exception: raw Mantine Anchor with component={Link}.
       * Same exception as not-found branch — both branches use the same
       * PENDO_IDS leaf so Phase 6 guides target one ID for 'return to help list'
       * intent regardless of slug-found/not-found state.
       */}
      <MantineAnchor
        component={Link}
        to="/app/help"
        data-pendo-id={PENDO_IDS.help.article.detailBackLink}
      >
        ← Back to Help
      </MantineAnchor>
    </Stack>
  )
}
