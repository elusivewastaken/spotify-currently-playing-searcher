// ==UserScript==
// @name        spotify-currently-playing-searcher
// @namespace   Violentmonkey Scripts
// @match       https://open.spotify.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @require     https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @version     1.0
// @author      elusive
// @description Search the current track on external sites
// ==/UserScript==

(function() {
  'use strict'

  const DEFAULT_BUTTONS = [
    {
      text: 'MB',
      url: 'https://musicbrainz.org/search',
      queryTemplate: '{title} AND {artists}',
      queryParam: 'query',
      titleFormat: '"{}"',
      artistFormat: 'artist:"{}"',
      artistsJoin: ' AND ',
      extraParams: { type: 'recording', advanced: '1' },
    },
  ]

  const validateButtons = (json) => {
    let maybeButtons
    try {
      maybeButtons = JSON.parse(json)
    } catch (error) {
      return `Invalid JSON: ${error.message}`
    }

    if (!Array.isArray(maybeButtons)) {
      return 'Config must be an array of buttons'
    }

    for (const [i, maybeButton] of maybeButtons.entries()) {
      if (typeof maybeButton !== 'object' || maybeButton === null) {
        return `Button ${i + 1}: must be an object`
      }
      if (!maybeButton.text || typeof maybeButton.text !== 'string') {
        return `Button ${i + 1}: missing or invalid "text" field`
      }
      if (!maybeButton.url || typeof maybeButton.url !== 'string') {
        return `Button ${i + 1}: missing or invalid "url" field`
      }
      if (maybeButton.extraParams !== undefined && (typeof maybeButton.extraParams !== 'object' || Array.isArray(maybeButton.extraParams))) {
        return `Button ${i + 1}: "extraParams" must be an object`
      }
      if (maybeButton.artistsParam && !maybeButton.artistsMode) {
        return `Button ${i + 1}: "artistsMode" is required when using "artistsParam"`
      }
      if (maybeButton.artistsMode && !['join', 'repeat'].includes(maybeButton.artistsMode)) {
        return `Button ${i + 1}: "artistsMode" must be "join" or "repeat"`
      }
      if (maybeButton.queryTemplate && !maybeButton.queryParam) {
        return `Button ${i + 1}: "queryParam" is required when using "queryTemplate"`
      }
    }

    return null
  }

  GM_config.init({
    id: 'SpotifyTitleSearcher',
    title: 'Spotify Title Searcher Settings',
    fields: {
      buttons: {
        label: 'Buttons Configuration (JSON array)',
        type: 'textarea',
        default: JSON.stringify(DEFAULT_BUTTONS, null, 2),
      },
    },
    css: '#SpotifyTitleSearcher_buttons_var textarea { width: 100%; height: 300px; font-family: monospace; }',
    events: {
      save: () => {
        const errorMessage = validateButtons(GM_config.get('buttons'))
        if (errorMessage !== null) {
          alert(errorMessage)
          return
        }
        location.reload()
      },
    },
  })

  GM_registerMenuCommand('Settings', () => GM_config.open())

  const getButtons = () => {
    try {
      return JSON.parse(GM_config.get('buttons')) ?? DEFAULT_BUTTONS
    } catch {
      return DEFAULT_BUTTONS
    }
  }

  const parseTrack = () => {
    const parts = document.title.split(' • ')
    if (parts.length < 2) {
      return null
    }
    const [title, artistsString] = parts
    const artists = artistsString.split(', ')
    return { title, artists }
  }

  const buildParamUrl = (config, track) => {
    const params = new URLSearchParams(config.extraParams ?? {})
    if (config.artistParam) {
      params.set(config.artistParam, track.artists[0])
    }
    if (config.artistsParam) {
      if (config.artistsMode === 'repeat') {
        for (const artist of track.artists) {
          params.append(config.artistsParam, artist)
        }
      } else if (config.artistsMode === 'join') {
        params.set(config.artistsParam, track.artists.join(config.artistsSeparator ?? ','))
      }
    }
    if (config.titleParam) {
      params.set(config.titleParam, track.title)
    }
    return `${config.url}?${params}`
  }

  const buildTemplateUrl = (config, track) => {
    const applyFormat = (format, value) => (format ?? '{}').replace('{}', value)

    const formattedTitle = applyFormat(config.titleFormat, track.title)
    const formattedArtist = applyFormat(config.artistFormat, track.artists[0])
    const formattedArtists = track.artists
      .map(artist => applyFormat(config.artistFormat, artist))
      .join(config.artistsJoin ?? ', ')

    const query = config.queryTemplate
      .replace('{title}', formattedTitle)
      .replace('{artist}', formattedArtist)
      .replace('{artists}', formattedArtists)

    const params = new URLSearchParams(config.extraParams ?? {})
    params.set(config.queryParam, query)
    return `${config.url}?${params}`
  }

  const buildSearchUrl = (config, track) => {
    return config.queryTemplate
      ? buildTemplateUrl(config, track)
      : buildParamUrl(config, track)
  }

  const createSearchButton = (templateButton, config, index) => {
    const button = document.createElement('button')
    button.textContent = config.text
    button.className = templateButton.className
    button.id = `spotify-currently-playing-searcher-button-${index}`
    button.addEventListener('click', () => {
      const track = parseTrack()
      if (track === null) {
        alert('No track is currently playing')
        return
      }
      const url = buildSearchUrl(config, track)
      window.open(url, '_blank')
    })
    return button
  }

  const insertButtons = () => {
    const lyricsButton = document.querySelector('[data-testid="lyrics-button"]')
    if (lyricsButton === null) {
      return false
    }
    for (const [index, config] of getButtons().entries()) {
      const button = createSearchButton(lyricsButton, config, index)
      lyricsButton.before(button)
    }
    return true
  }

  const observer = new MutationObserver(() => {
    if (insertButtons()) {
      observer.disconnect()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  insertButtons()
})()

