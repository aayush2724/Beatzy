const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

const LRCLIB_URL = process.env.LRCLIB_URL || 'https://lrclib.net/api/search';
const GENIUS_API_URL = 'https://api.genius.com/search';
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

function normalize(value) {
  return String(value || '')
    .replace(/\s*\([^)]*(remaster|live|edit|version|sped up|slowed|instrumental)[^)]*\)/gi, '')
    .replace(/\s*-\s*(remaster|live|edit|version|sped up|slowed|instrumental).*$/i, '')
    .trim();
}

function scoreMatch(item, title, artist) {
  const track = String(item.trackName || item.title || '').toLowerCase();
  const itemArtist = String(item.artistName || item.primary_artist?.name || '').toLowerCase();
  const wantedTitle = title.toLowerCase();
  const wantedArtist = artist.toLowerCase();

  let score = 0;
  if (track === wantedTitle) score += 4;
  else if (track.includes(wantedTitle) || wantedTitle.includes(track)) score += 2;
  if (itemArtist === wantedArtist) score += 4;
  else if (itemArtist.includes(wantedArtist) || wantedArtist.includes(itemArtist)) score += 2;
  
  if (item.syncedLyrics) score += 2; // Higher priority for synced
  if (item.plainLyrics) score += 1;
  return score;
}

async function fetchFromGenius(title, artist) {
  if (!GENIUS_ACCESS_TOKEN) return null;
  try {
    const { data } = await axios.get(GENIUS_API_URL, {
      params: { q: `${title} ${artist}` },
      headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` },
    });

    const hits = data.response.hits;
    if (!hits.length) return null;

    // Get the first hit's URL and scrape lyrics
    const song = hits[0].result;
    const { data: html } = await axios.get(song.url);
    const $ = cheerio.load(html);
    
    // Genius often changes their classes, this is a common selector
    let lyrics = $('[class^="Lyrics__Container"], .lyrics').text().trim();
    if (!lyrics) {
        // Fallback for different Genius layouts
        lyrics = $('.lyrics').text().trim();
    }

    if (!lyrics) return null;

    return {
      lyrics: lyrics,
      syncedLyrics: null,
      source: 'genius',
      providerId: song.id.toString(),
    };
  } catch (err) {
    logger.warn('Genius lyrics fetch failed', { error: err.message });
    return null;
  }
}

async function fetchLyrics({ title, artist }) {
  const trackName = normalize(title);
  const artistName = normalize(artist);
  if (!trackName || !artistName) return null;

  try {
    // 1. Try LRCLIB first (better for synced lyrics)
    const { data } = await axios.get(LRCLIB_URL, {
      params: { track_name: trackName, artist_name: artistName },
      timeout: 6000,
      headers: {
        'User-Agent': 'Beatzy/1.0 (portfolio music analysis project)',
      },
    });

    let best = null;
    if (Array.isArray(data) && data.length > 0) {
      [best] = data
        .filter((item) => item?.plainLyrics || item?.syncedLyrics)
        .sort((a, b) => scoreMatch(b, trackName, artistName) - scoreMatch(a, trackName, artistName));
    }

    if (best && (best.syncedLyrics || best.plainLyrics)) {
        return {
          lyrics: best.plainLyrics || null,
          syncedLyrics: best.syncedLyrics || null,
          source: 'lrclib',
          providerId: best.id,
        };
    }

    // 2. Fallback to Genius if LRCLIB failed or returned nothing
    const geniusResult = await fetchFromGenius(trackName, artistName);
    if (geniusResult) return geniusResult;

    return null;
  } catch (err) {
    logger.warn('Lyrics lookup failed', { title: trackName, artist: artistName, error: err.message });
    return null;
  }
}

module.exports = { fetchLyrics };
