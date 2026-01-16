# spotify-currently-playing-searcher

Adds customizable search buttons to Spotify Web Player that search the current track on external sites.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)
2. [Click here to install](../../raw/main/spotify-currently-playing-searcher.user.js)

## Configure

Click the userscript manager icon → Settings to configure buttons.

There are two modes for building search URLs:

- **Param mode**: Use when the site expects separate query parameters like `?artist=X&title=Y`
- **Template mode**: Use when the site expects a single formatted query string like `?query="Song" AND artist:"Name"`

<details>
<summary><strong>Param mode</strong></summary>

For sites that use separate query parameters for artist and title.

```json
{
  "text": "Example",
  "url": "https://example.com/search",
  "artistParam": "artist-on-external-site",
  "titleParam": "title-on-external-site",
  "extraParams": {
    "order_by": "date"
  }
}
```
→ `?artist-on-external-site=Artist&title-on-external-site=Song&order_by=date`

| Field | Description |
|-------|-------------|
| `text` | Button label |
| `url` | Search URL |
| `artistParam` | Query param for first artist |
| `artistsParam` | Query param for all artists (requires `artistsMode`) |
| `artistsMode` | `"join"` or `"repeat"` |
| `artistsSeparator` | Separator when mode is `"join"` (default: `","`) |
| `titleParam` | Query param for title |
| `extraParams` | Additional static params |

#### Multiple artists

Join all artists with a space:
```json
{
  "artistsParam": "artists",
  "artistsMode": "join",
  "artistsSeparator": " "
}
```
→ `?artists=Artist1 Artist2 Artist3`

Repeat the param for each artist:
```json
{
  "artistsParam": "artist",
  "artistsMode": "repeat"
}
```
→ `?artist=Artist1&artist=Artist2&artist=Artist3`

</details>

<details>
<summary><strong>Template mode</strong></summary>

For sites that expect a single query param with custom syntax (like MusicBrainz advanced search).

```json
{
  "text": "MB",
  "url": "https://musicbrainz.org/search",
  "queryTemplate": "{title} AND {artists}",
  "queryParam": "query",
  "titleFormat": "\"{}\"",
  "artistFormat": "artist:\"{}\"",
  "artistsJoin": " AND ",
  "extraParams": { "type": "recording", "advanced": "1" }
}
```
→ `?query="Song" AND artist:"Artist1" AND artist:"Artist2"&type=recording&advanced=1`

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `queryTemplate` | Yes | - | Template with `{title}`, `{artist}`, `{artists}` placeholders |
| `queryParam` | Yes | - | Param name for the constructed query |
| `titleFormat` | No | `{}` | Format for title, `{}` is replaced with value |
| `artistFormat` | No | `{}` | Format for each artist |
| `artistsJoin` | No | `, ` | Separator when joining artists |
| `extraParams` | No | `{}` | Additional static params |

</details>

## AI disclosure

Built with heavy reliance on Claude Code.

---

Not affiliated with Spotify AB.
