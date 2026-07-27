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

## Theme docs

Check out the [theme's documentation](https://github.com/cotes2020/jekyll-theme-chirpy/wiki).

## License

This work is published under the [MIT][mit] License.

[chirpy]: https://github.com/cotes2020/jekyll-theme-chirpy/
[mit]: https://github.com/cotes2020/chirpy-starter/blob/master/LICENSE
