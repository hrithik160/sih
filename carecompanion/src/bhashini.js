const INFERENCE_KEY = "7MrLAyB7arzzpx0wjaCY7XqyiBWUR4o5t9hCEhta-5wacf_f-Pu3W5apSe3ooHSC";
const URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";
const SERVICE_ID = "ai4bharat/indictrans-v2-all-gpu--t4";

// Cache translations in memory to avoid redundant API calls
const translationCache = {};

export const translateText = async (text, targetLang) => {
  if (!text || targetLang === "en") return text;
  
  const cacheKey = `${targetLang}_${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Check localStorage cache
  const localCache = localStorage.getItem('bhashini_cache');
  if (localCache) {
    const parsedCache = JSON.parse(localCache);
    if (parsedCache[cacheKey]) {
      translationCache[cacheKey] = parsedCache[cacheKey];
      return parsedCache[cacheKey];
    }
  }

  try {
    const payload = {
      pipelineTasks: [
        {
          taskType: "translation",
          config: {
            language: {
              sourceLanguage: "en",
              targetLanguage: targetLang
            },
            serviceId: SERVICE_ID
          }
        }
      ],
      inputData: {
        input: [
          {
            source: text
          }
        ]
      }
    };

    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Accept": "*/*",
        "Authorization": INFERENCE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      const translated = result.pipelineResponse[0].output[0].target;
      
      // Save to caches
      translationCache[cacheKey] = translated;
      const currentCache = JSON.parse(localStorage.getItem('bhashini_cache') || '{}');
      currentCache[cacheKey] = translated;
      localStorage.setItem('bhashini_cache', JSON.stringify(currentCache));
      
      return translated;
    } else {
      console.error("Bhashini translation failed:", response.statusText);
      return text;
    }
  } catch (error) {
    console.error("Error connecting to Bhashini API:", error);
    return text;
  }
};
