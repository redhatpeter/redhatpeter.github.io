# redhatpeter.github.io

My personal technical blog, built with the [Chirpy][chirpy] Jekyll theme and hosted on GitHub Pages.

**Live site:** https://redhatpeter.github.io

## Day-to-day workflow

The local dev server has **auto-regeneration** — edit any file and the browser preview updates automatically. To stop it, press `Ctrl+C` in the terminal running it.

### Start the local preview

```bash
cd ~/MyArticle && bundle exec jekyll serve
```

Then open http://localhost:4000/.

### Write a new post

Add a file to `_posts/` named `YYYY-MM-DD-title.md` with front matter, for example:

```markdown
---
title: My Post Title
date: 2026-07-19 12:00:00 -0400
categories: [Category]
tags: [tag1, tag2]
---

Your content here.
```

> Tip: keep the timestamp at or before the current time, or run `bundle exec jekyll serve --future` to preview scheduled posts locally.

### Publish changes

```bash
git add -A && git commit -m "your message" && git push
```

GitHub Actions rebuilds and deploys automatically (~1 min).

### Profile and learning resources

The homepage keeps articles prominent with a compact link to the
[Books & Courses page](_tabs/books-courses.html). Update resource descriptions,
image links, and referral/coupon codes there. Images live in
[`assets/img/profile/`](assets/img/profile/); grouped certifications are on the
[About page](_tabs/about.md).

Personal book reflections appear in the [Favorite Reads listing](_tabs/favorite-reads.html),
separate from authored books and courses. Add a Markdown file to `_reads/` using
[`outliers.md`](_reads/outliers.md) as a template, with `title`, `book_author`,
`description`, `image`, `image_width`, `image_height`, and numeric `order` front matter.
Use the cover's actual pixel dimensions to preserve its proportions. Store covers in
`assets/img/books/` and put the full reflection in the body. Each entry automatically
gets a listing card and a detail page at `/favorite-reads/<filename>/`; it does not
appear in the homepage's technical post list.

Set `book_group` to `Technology & Engineering` or `Leadership & Life`. The listing
generates category labels and filter counts from this metadata. Filters work
without leaving the page; with JavaScript disabled, all books remain available.

Chirpy generates the Books & Courses navigation entry from the tab's front matter.
Its navigation and browser-title labels are defined in
[`_data/locales/en.yml`](_data/locales/en.yml), which extends the theme's English labels.
The [`sidebar override`](_includes/sidebar.html) adds a small book feature, hidden
on mobile and short screens to leave room for navigation. The professional
description comes from `tagline` in [`_config.yml`](_config.yml).

The [`homepage override`](_layouts/home.html) preserves Chirpy's post list and
pagination, adding [`a compact resource link`](_includes/home-profile.html) on
page one. When upgrading Chirpy, compare both overrides with the theme templates.
Responsive styles live in
[`assets/css/jekyll-theme-chirpy.scss`](assets/css/jekyll-theme-chirpy.scss).

## Theme docs

Check out the [theme's documentation](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

## License

This work is published under the [MIT][mit] License.

[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE
