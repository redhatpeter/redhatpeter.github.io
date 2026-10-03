# Copilot instructions for this blog

This repository is a personal technical blog built with the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy/) Jekyll theme and published to GitHub Pages. These instructions define how to write new articles so they stay consistent with existing posts such as `_posts/2026-07-20-when-every-api-becomes-an-agent-tool.md` and `_posts/2026-10-03-from-documents-to-decisions-inside-a-multi-agent-student-loan-accelerator.md`.

## File and URL conventions

- Create each article in `_posts/` as `YYYY-MM-DD-kebab-case-title.md`.
- The filename sets the URL: `permalink` is `/posts/:title/`, so choose the slug deliberately and do not rename published posts.
- Keep the date at or before the current time. `timezone` is `America/New_York`, so use the matching offset (`-0400` or `-0500`).
- Do not add `layout`, `comments`, or `permalink` to front matter. `_config.yml` sets them for all posts.

## Front matter

Use this exact set of fields, in this order:

```yaml
---
title: "Title: A Specific Subtitle That States the Value"
description: "One sentence, no trailing period needed, that summarizes the article."
date: 2026-10-03 05:30:00 -0400
categories: [Primary, Secondary]
tags: [lowercase-hyphenated, five-to-six, specific-tags]
image:
  path: /assets/img/posts/<topic>-cover.png
  alt: One-sentence caption describing what the image shows
toc: true
---
```

- Quote `title` and `description`.
- `categories` has two levels. Reuse existing pairs where they fit, for example `[Azure, Azure AI & Foundry]`, `[AI, AI Agents]`, `[AI, Generative AI & LLMs]`. Check existing posts before inventing a new category.
- `tags` are lowercase, hyphenated, and specific (for example `mcp`, `azure-openai`, `multi-agent`). Use five or six and reuse existing tags where possible.
- `image.alt` is displayed as the caption under the cover image, so write it as a sentence, not a filename.
- Keep `toc: true`.

## Cover image

- Every new article should have a cover image. Store it in `assets/img/posts/` and name it `<topic>-cover.png`.
- Use a wide, roughly 16:9 image. It appears on the post, as the thumbnail on the homepage card, and in link previews.
- Reference it with a site-root path (`/assets/img/posts/...`) in front matter.
- Never reference a file outside the repository, such as a path in a temporary or session folder.

## Opening structure

Start the article body in this order:

1. A tip callout that repeats the `description`:

   ```markdown
   > One-sentence description of the article
   {: .prompt-tip }
   ```

2. When the article summarizes, adapts, or reflects on published or open-source work, add an info callout with attribution and a personal-views statement:

   ```markdown
   > This article explains the [Project Name](https://link), based on [original source](https://link). State clearly if it is a sample and not production guidance. The views expressed here are my own.
   {: .prompt-info }
   ```

3. `## Executive summary`: two to four short paragraphs covering the problem, the approach, and what the reader will learn.

Do not add a `#` (H1) heading to the body. The theme renders `title` as the H1.

## Body

- Use `##` for main sections and `###` for subsections. Write headings in sentence case.
- Keep prose plain and concrete. Prefer short paragraphs, bullet lists, and tables for comparisons.
- Define terms (such as MCP, RAG, agent) briefly before relying on them.
- Use plain `text` code fences for flow and architecture sketches, and tagged fences (`json`, `yaml`, `python`) for real code.
- Set a key takeaway apart as a bold blockquote: `> **One-sentence takeaway.**`
- For images in the body, add meaningful alt text and an italic source or caption line directly below:

  ```markdown
  ![Alt text describing the diagram](https://example.com/or/assets/img/posts/diagram.png)
  _Source: [Where it came from](https://link). Note which parts are proposed, not implemented._
  ```

- Do not add `<style>` blocks, inline HTML, or per-post theme overrides. Let the theme control appearance.

## Accuracy and responsibility

- Ground technical claims in the source code, official documentation, or the cited project. Link primary sources inline.
- State clearly what is **implemented** and what is **proposed or future**. Never describe a roadmap item or diagram label as an existing capability.
- For samples and accelerators, say that they are not production systems. Add a short production-boundary section covering security, durable state, validation, and review where it is relevant.
- Use synthetic data in examples. Never include secrets, keys, tokens, or real personal or financial data.
- When using illustrative numbers, label them as illustrative.

## Ending structure

End the article with these sections, in this order:

1. `## Hands-on implementation`: when a repository exists, link it, list the prerequisites, and give a short practical path to try it (for example, a happy path first, then failure cases). Point readers to the README for exact install steps instead of copying long command lists. Omit this section if there is nothing to run.
2. `## Closing`: summarize the main lesson in a few short paragraphs and finish with one bold blockquote takeaway as the last line.
3. Optional `## References` for numbered source links when the article relies on several external documents.

## Validate before finishing

1. Run `bundle exec jekyll build` and confirm it completes without errors.
2. Preview with `bundle exec jekyll serve` at `http://127.0.0.1:4000/`. Confirm the cover image shows on both the homepage card and the post, the callouts render, the table of contents lists the sections, and every body image loads.
3. Run `git diff --check` to catch whitespace problems.
4. Do not commit or push unless asked. Publishing is `git add -A && git commit && git push`, and GitHub Actions deploys the site.
