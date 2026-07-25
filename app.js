const weatherCodes = {
  0: ['clear sky', '☀'], 1: ['mainly clear', '☀'], 2: ['partly cloudy', '◐'], 3: ['overcast', '☁'],
  45: ['foggy', '≋'], 48: ['rime fog', '≋'], 51: ['light drizzle', '⌇'], 53: ['drizzle', '⌇'],
  55: ['heavy drizzle', '⌇'], 56: ['freezing drizzle', '⌇'], 57: ['heavy freezing drizzle', '⌇'],
  61: ['light rain', '☂'], 63: ['rain', '☂'], 65: ['heavy rain', '☂'], 66: ['freezing rain', '☂'],
  67: ['heavy freezing rain', '☂'], 71: ['light snow', '✳'], 73: ['snow', '✳'], 75: ['heavy snow', '✳'],
  77: ['snow grains', '✳'], 80: ['rain showers', '☂'], 81: ['rain showers', '☂'], 82: ['heavy rain showers', '☂'],
  85: ['snow showers', '✳'], 86: ['heavy snow showers', '✳'], 95: ['thunderstorm', 'ϟ'],
  96: ['thunderstorm with hail', 'ϟ'], 99: ['thunderstorm with hail', 'ϟ']
};

const $ = (id) => document.getElementById(id);
const formatTemp = (value) => `${Math.round(value)}°`;
const weatherLabel = (code) => weatherCodes[code] || ['unknown conditions', '—'];

async function getCoordinates(query) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name: query, count: 1, language: 'en', format: 'json' });
  const response = await fetch(url);
  if (!response.ok) throw new Error('location search failed');
  const data = await response.json();
  if (!data.results?.length) throw new Error('location not found');
  return data.results[0];
}

async function getForecast(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({ latitude, longitude, current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: 7 });
  const response = await fetch(url);
  if (!response.ok) throw new Error('weather request failed');
  return response.json();
}

function render(place, data) {
  const { current, daily } = data;
  $('place').textContent = [place.name, place.admin1 || place.country].filter(Boolean).join(', ');
  $('temperature').textContent = formatTemp(current.temperature_2m);
  $('condition').textContent = weatherLabel(current.weather_code)[0];
  $('today-range').textContent = `high ${formatTemp(daily.temperature_2m_max[0])} · low ${formatTemp(daily.temperature_2m_min[0])}`;
  $('feels-like').textContent = formatTemp(current.apparent_temperature);
  $('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $('humidity').textContent = `${current.relative_humidity_2m}%`;
  $('updated').textContent = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
  $('forecast').innerHTML = daily.time.map((date, index) => {
    const [label, icon] = weatherLabel(daily.weather_code[index]);
    const day = new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
    return `<article class="day"><p class="day-name">${index === 0 ? 'today' : day}</p><p class="day-icon" aria-label="${label}" title="${label}">${icon}</p><p class="day-temp">${formatTemp(daily.temperature_2m_max[index])} / ${formatTemp(daily.temperature_2m_min[index])}</p></article>`;
  }).join('');
  document.querySelector('.weather-card').setAttribute('aria-busy', 'false');
}

async function loadLocation(query) {
  $('form-message').textContent = 'updating forecast…';
  document.querySelector('.weather-card').setAttribute('aria-busy', 'true');
  try { const place = await getCoordinates(query); render(place, await getForecast(place.latitude, place.longitude)); $('form-message').textContent = ''; }
  catch (error) { $('form-message').textContent = error.message === 'location not found' ? 'location not found. try another search.' : 'unable to refresh the forecast.'; document.querySelector('.weather-card').setAttribute('aria-busy', 'false'); }
}

$('location-form').addEventListener('submit', (event) => { event.preventDefault(); const query = $('location-input').value.trim(); if (query) loadLocation(query); });
loadLocation('Aarhus, Denmark');
