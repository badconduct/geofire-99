const { GoogleGenAI, Type } = require('@google/genai');

const LOG_PREFIX = "[GeoFire '99 News]";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

let cachedNews = null;
let cacheTimestamp = 0;
let isFetching = false;

// The schema for the AI response
const newsSchema = {
  type: Type.OBJECT,
  properties: {
    stories: {
      type: Type.ARRAY,
      description: 'An array of exactly 12 news stories.',
      items: {
        type: Type.OBJECT,
        properties: {
          headline: {
            type: Type.STRING,
            description: 'A concise, newspaper-style headline for the story.'
          },
          summary: {
            type: Type.STRING,
            description: 'A one or two-sentence summary of the news story.'
          },
          fullStory: {
            type: Type.STRING,
            description:
              'The full news article, written in a journalistic style appropriate for 1999. It should be several paragraphs long.'
          }
        },
        required: ['headline', 'summary', 'fullStory']
      }
    }
  }
};

async function fetchNewsFromGemini() {
  console.log(`${LOG_PREFIX} Fetching fresh news from Gemini API...`);
  isFetching = true;

  try {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY not configured.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const today = new Date();
    today.setDate(today.getDate() - 1); // Get yesterday's date
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const month = monthNames[today.getMonth()];
    const day = today.getDate();
    const year = 1999;

    const prompt = `Generate a list of exactly 12 diverse and significant real-world news stories (e.g., politics, technology, culture, sports) that occurred on the specific date: ${month} ${day}, ${year}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: newsSchema
      }
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (parsedResponse && parsedResponse.stories && parsedResponse.stories.length > 0) {
      console.log(
        `${LOG_PREFIX} Successfully fetched and parsed ${parsedResponse.stories.length} news stories.`
      );
      cachedNews = parsedResponse.stories;
      cacheTimestamp = Date.now();
      return cachedNews;
    } else {
      throw new Error('Received invalid or empty story data from Gemini.');
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error fetching news from Gemini:`, error);
    return null;
  } finally {
    isFetching = false;
  }
}

async function getNews() {
  const now = Date.now();
  if (cachedNews && now - cacheTimestamp < CACHE_DURATION_MS) {
    console.log(`${LOG_PREFIX} Serving news from cache.`);
    return cachedNews;
  }

  if (isFetching) {
    console.log(`${LOG_PREFIX} Fetch in progress, returning cached version for now.`);
    return cachedNews || [];
  }

  const freshNews = await fetchNewsFromGemini();
  return freshNews || cachedNews || []; // Fallback to old cache or empty array on error
}

// Initial fetch when server starts
function warmup() {
  console.log(`${LOG_PREFIX} Pre-warming news cache...`);
  fetchNewsFromGemini();
}

module.exports = {
  getNews,
  warmup
};
