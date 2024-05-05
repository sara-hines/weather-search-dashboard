// Global variables
var searchHistory = [];
var weatherApiRootUrl = 'https://api.openweathermap.org';
// var weatherApiKey = 'd91f911bcf2c0f925fb6535547a5ddc9';
var weatherApiKey = 'bc02fa4a67fb29de92c982a3ea981b47';

var activityApiRootUrl = 'https://api.geoapify.com/v2/places?categories=tourism.attraction';
var activityApiKey = '426058d376c4497eaf5c98fad40ab305';
var photoContainer = document.getElementById("photo-container");

// DOM element references
// This is the actual form element
var searchForm = document.querySelector('#search-form');
// Input element
var searchInput = document.querySelector('#search-input');
// Section element with the id of today.
var todayContainer = document.querySelector('#today');
// Section element with the id of forecast.
var forecastContainer = document.querySelector('#forecast');
// Div element with the id of history (which is inside the searchForm)
var searchHistoryContainer = document.querySelector('#history');

// Add timezone plugins to day.js
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);


// var map;
var service;
// var infowindow;

function initMap(activityData) {
  console.log(activityData);
  let attraction = (activityData.features[0].properties.name);
  console.log(attraction); 

  var request = {
    query: `${attraction}`,
    fields: ['name', 'geometry', 'place_id'],
  };

  var service = new google.maps.places.PlacesService(map);
  console.log(typeof service);

  service.findPlaceFromQuery(request, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      console.log(results);
      generateActivityDetails(results);
      return results;
    }
  });
}

// function generateActivityDetails(placeIdData) {
// curl -X GET -H 'Content-Type: application/json';
// -H "X-Goog-Api-Key: API_KEY";
// -H "X-Goog-FieldMask: id,displayName";
// "https://places.googleapis.com/v1/places/ChIJj61dQgK6j4AR4GeTYWZsKWw";
// }

function generateActivityDetails(placeIdData) {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.866, lng: 151.196 },
    zoom: 15,
  });

  console.log(placeIdData);
  var fetchedPlaceId = placeIdData[0].place_id;
  console.log(fetchedPlaceId);

  const request = {
    placeId: fetchedPlaceId,
    fields: ["name", "formatted_address", "place_id", "photos", "editorial_summary"],
  };
  const service = new google.maps.places.PlacesService(map);

  service.getDetails(request, function(place) {
    console.log(place);
    console.log(place.name);
    console.log(place.formatted_address);
    console.log(place.editorial_summary);
    console.log(place.photos);
    var placePhoto = document.createElement("img");
    photoContainer.append(placePhoto);
    var fullSource = place.photos[0].html_attributions[0]
    // Will have to figure out how to consistently chop fullSource down into just the usable part of the image url.
  });    
};


// function initialize() {
//   var latlng = new google.maps.LatLng(-34.397, 150.644);
//   var myOptions = {
//       zoom: 8,
//       center: latlng,
//       mapTypeId: google.maps.MapTypeId.ROADMAP
//   };
//   var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
// }
// $(document).ready(initialize);



// Function to display the search history list.
function renderSearchHistory() {
  searchHistoryContainer.innerHTML = '';

  // Start at end of history array and count down to show the most recent at the top.
  for (var i = searchHistory.length - 1; i >= 0; i--) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    // My understanding of the aria-controls attribute is that the value of aria-controls is the thing the element with the aria-attribute controls. So, this button controls the today forecast.
    btn.setAttribute('aria-controls', 'today forecast');
    // I'm a bit confused. It looks like, for every item in the searchHistory array, we're creating a button which controls today forcast and has the classes history-btn and btn-history. It doesn't make sense to have so many buttons. Maybe only 1 of these buttons at a time will be displayed and it will take you to the most recent item in the searchHistory/
    btn.classList.add('history-btn', 'btn-history');

    // `data-search` allows access to city name when click handler is invoked
    // Ok, so data-search is a data* attribute and I'm thinking it would have 1 sort of state when the click handler is not invoked, and 1 sort of state when the click handler is invoked. Ok, so I think that we're using this data* attribute so that we can associate the right element in searchHistory with each button. 
    btn.setAttribute('data-search', searchHistory[i]);
    // And then we're also giving the button the text content of the search history item it corresponds to. Maybe we're using the buttons themselves to display the search history items, instead of displaying them as list items or something. 
    btn.textContent = searchHistory[i];
    // The button(s) will go inside the div element with the id of history, after the search button basically
    searchHistoryContainer.append(btn);
  }
}

// Function to update history in local storage then updates displayed history.
function appendToHistory(search) {
  // If there is no search term return the function
  // .indexOf is a string method and an array method. It looks like we'd be using the array method here. the .indexOf array method returns the first index (arrays are 0 indexed) at which a given element can be found in the array, or -1 if it is not present. I'm confused, because, if we really want to return the function only when there is no search term found, then I feel like that would be if (searchHistory.indexOf(search) == -1), then we return.
  // Also note that search is a variable, so it would represent an actual search term we're looking for. 
  if (searchHistory.indexOf(search) !== -1) {
    return;
  }
  // Pushing the search term into the searchHistory. 
  searchHistory.push(search);
  // Setting to local storage under the name "search-history". We are stringifying searchHistory which has the history we want to store, because it has to be stringified in order to store it. 
  localStorage.setItem('search-history', JSON.stringify(searchHistory));

  renderSearchHistory();
}

// Function to get search history from local storage
function initSearchHistory() {
  var storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

// Function to display the current weather data fetched from OpenWeather api.
function renderCurrentWeather(city, weather) {
  // This is the current date in the format specified.
  var date = dayjs().format('M/D/YYYY');
  // Store response data from our fetch request in variables
  var tempF = weather.main.temp;
  var windMph = weather.wind.speed;
  var humidity = weather.main.humidity;
  var iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  var iconDescription = weather.weather[0].description || weather[0].main;

  var card = document.createElement('div');
  var cardBody = document.createElement('div');
  var heading = document.createElement('h2');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');

  card.setAttribute('class', 'card');
  cardBody.setAttribute('class', 'card-body');
  card.append(cardBody);

  heading.setAttribute('class', 'h3 card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  weatherIcon.setAttribute('class', 'weather-img');
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${tempF}°F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  cardBody.append(heading, tempEl, windEl, humidityEl);

  todayContainer.innerHTML = '';
  todayContainer.append(card);
}

// Function to display a forecast card given an object from open weather api
// daily forecast.
function renderForecastCard(forecast) {
  // variables for data from api
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var tempF = forecast.main.temp;
  var humidity = forecast.main.humidity;
  var windMph = forecast.wind.speed;

  // Create elements for a card
  var col = document.createElement('div');
  var card = document.createElement('div');
  var cardBody = document.createElement('div');
  var cardTitle = document.createElement('h5');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');

  col.append(card);
  card.append(cardBody);
  cardBody.append(cardTitle, weatherIcon, tempEl, windEl, humidityEl);

  col.setAttribute('class', 'col-md');
  col.classList.add('five-day-card');
  card.setAttribute('class', 'card bg-primary h-100 text-white');
  cardBody.setAttribute('class', 'card-body p-2');
  cardTitle.setAttribute('class', 'card-title');
  tempEl.setAttribute('class', 'card-text');
  windEl.setAttribute('class', 'card-text');
  humidityEl.setAttribute('class', 'card-text');

  // Add content to elements
  cardTitle.textContent = dayjs(forecast.dt_txt).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}

// Function to display 5 day forecast.
function renderForecast(dailyForecast) {
  // Create unix timestamps for start and end of 5 day forecast
  var startDt = dayjs().add(1, 'day').startOf('day').unix();
  var endDt = dayjs().add(6, 'day').startOf('day').unix();

  var headingCol = document.createElement('div');
  var heading = document.createElement('h4');

  headingCol.setAttribute('class', 'col-12');
  heading.textContent = '5-Day Forecast:';
  headingCol.append(heading);

  forecastContainer.innerHTML = '';
  forecastContainer.append(headingCol);

  for (var i = 0; i < dailyForecast.length; i++) {

    // First filters through all of the data and returns only data that falls between one day after the current data and up to 5 days later.
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {

      // Then filters through the data and returns only data captured at noon for each day.
      if (dailyForecast[i].dt_txt.slice(11, 13) == "12") {
        renderForecastCard(dailyForecast[i]);
      }
    }
  }
}

function renderItems(city, data) {
  renderCurrentWeather(city, data.list[0], data.city.timezone);
  renderForecast(data.list);
  console.log(data.list);
  // renderActivities()
}


// Fetches weather data for given location from the Weather Geolocation
// endpoint; then, calls functions to display current and forecast weather data.
function fetchWeather(location) {
  var { lon } = location;
  var { lat } = location;
  console.log(location);
  console.log(lon);
  console.log(lat);
  var city = location.name;

  var apiUrl = `${weatherApiRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

// function fetchActivities is called within function fetchCoords, which passes data[0] into the location variable in function fetchActivities.
function fetchActivities(location) {
  var { lon } = location;
  var { lat } = location;
  console.log(location);
  console.log(lon);
  console.log(lat);

  var apiUrl = `${activityApiRootUrl}&filter=circle:${lon},${lat},5000&apiKey=${activityApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var activityData = data;
      // The below will return only 1 suggested activity/sight-seeing place. I would want 3. 
      console.log(data.features[0].properties.address_line2);
      initMap(activityData);
      // renderItems(city, data); used to be here, and I would need to make the appropriate rendering function here
    })
    .catch(function (err) {
      console.error(err);
    });
}




function fetchCoords(search) {
  var apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      console.log(data);
      if (!data[0]) {
        alert('Location not found');
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
        fetchActivities(data[0]);
        console.log(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  // Don't continue if there is nothing in the search form
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  var search = searchInput.value.trim();
  console.log(search);
  // The search variable is the text the user entered in the input element for the city. 
  fetchCoords(search);
  searchInput.value = '';
}

function handleSearchHistoryClick(e) {
  // Don't do search if current elements is not a search history button
  if (!e.target.matches('.btn-history')) {
    return;
  }

  var btn = e.target;
  var search = btn.getAttribute('data-search');
  fetchCoords(search);
}

initSearchHistory();
searchForm.addEventListener('submit', handleSearchFormSubmit);
searchHistoryContainer.addEventListener('click', handleSearchHistoryClick);
