let map;
let station_data = [];
let station_info = [];
const station_pins = [];
var stationNumber;
const { Map } = await google.maps.importLibrary("maps");
let infowindow = new google.maps.InfoWindow();
let autocomplete;
let stationNames = [];
var isDarkModeEnabled = false;
let isSidePanelOpen = false;
var overlay;

var dublin_cord = { lat: 53.35014, lng: -6.26615 };

function init() {
  loadStationsList().then((stations) =>
    loadData()
      .then((station_data) => initMap())
      .then((data) => loadWeatherData())
      .catch((error) => console.log(error))
  );
}

async function loadData() {
  let station_data_response = get(STATIONS_API);
  return station_data_response.then((data) => {
    station_data = data;
    station_data.forEach((station) => {
      stationNames.push(station.name);
    });
    let list = document.getElementById("bikeLocations");

    stationNames.forEach(function (station) {
      var option = document.createElement("option");
      option.value = station;
      list.appendChild(option);
    });
    return station_data;
  });
}

async function loadWeatherData() {
  let weatherIcons = {
    Clear: "./images/weather-sunny.gif",
    Clouds: "./images/weather-cloudy.gif",
    Drizzle: "./images/weather-drizzle.gif",
    Mist: "./images/weather-fog.gif",
    Rain: "./images/weather-heavyrain.gif",
    Fog: "./images/weather-fog.gif",
    Snow: "./images/weather-snow.gif",
  };
  let weather_response = post(WEATHER_API, dublin_cord);
  return weather_response.then((data) => {
    console.log(data);
    let weatherIcon = document.getElementById("weather-icon");
    weatherIcon.src = weatherIcons[data["main"]];
    weatherIcon.title = data["main"];

    let weatherTemp = document.getElementById("weather-temp");
    weatherTemp.textContent = (data["temp"] - 273).toFixed(0) + "°C";
  });
}

async function loadStationsList() {
  let station_data_response = get(STATIONS_LIST_API);
  return station_data_response.then((data) => {
    station_info = data;
  });
}

async function initMap() {
  // Keep track of whether the side panel is currently open

  const sidePanel = document.getElementById("side-panel");
  document.body.appendChild(sidePanel);
  map = new Map(document.getElementById("map"), {
    center: dublin_cord,
    zoom: 13,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: mapStyles.normal,
  });

  const dublin_center_marker = new google.maps.Marker({
    position: dublin_cord,
    map: map,
    mapTypeControl: false,
    icon: {
      url: "images/location.png",
      scaledSize: new google.maps.Size(30, 30),
    },
  });

  station_data.forEach((station) => {
    // Find the station information in the station_info object
    const stat_info = station_info.find(
      (info) => info.number === station.number
    );
    stationNumber = stat_info.number;
    var station_pin = new google.maps.Marker({
      position: { lat: station.position.lat, lng: station.position.lng },
      map: map,
      icon: {
        url: "images/location.png",
        scaledSize: new google.maps.Size(30, 30),
      },
    });

    const availableBikes =
      "<img src='images/bikesavailable.png' style='width:30px;height:30px;'>";
    const totalCapacity =
      "<img src='images/bicycle.png' style='width:30px;height:30px;'>";
    const freeStands =
      "<img src='images/parking.png' style='width:30px;height:30px;'>";
    const creditCardYes =
      "<img src='images/cardacceptedyes.png' style='width:30px;height:30px;'>";
    const creditCardNo =
      "<img src='images/cardacceptedno.png' style='width:30px;height:30px;'>";
    var creditCardAccepted = stat_info.banking ? creditCardYes : creditCardNo;

    const station_pin_details = `
<div class="hover-details">
  <h2>${station.name}</h2>
  <div class="details-container">
    <h3>${availableBikes}: ${stat_info.available_bikes}</h3>
    <h3>${freeStands}: ${stat_info.available_bike_stands}</h3>
    <h3>${totalCapacity}: ${stat_info.bike_stands}</h3>
    <h3>${creditCardAccepted}</h3>
  </div>
</div>
`;
    station_pin.addListener("mouseover", function () {
      infowindow.open(map, station_pin);
      infowindow.setContent(
        '<div class="info-window"><div class="info-window-inner">' +
          station_pin_details +
          "</div></div>"
      );
    });
    station_pins.push(station_pin);
    // User current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const user_pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        let marker = new google.maps.Marker({
          position: user_pos,
          map: map,
          icon: {
            url: "images/user.png",
            scaledSize: new google.maps.Size(40, 40),
          },
        });
      });
    }
    station_pin.addListener("mouseout", function () {
      infowindow.close();
    });
    station_pin.addListener("click", function () {
      var searchBarWrapper = document.querySelector(".search-wrapper");
      if (isSidePanelOpen) {
        sidePanel.style.display = "none";
        overlay = document.getElementById("overlay");
        overlay.style.display = "none";
        isSidePanelOpen = false;
        //searchBarWrapper.style.display = "block";
        //document.getElementById("search-input").value = "";
        //document.getElementById("search-input").style.backgroundColor = "";
        graphRender(stationNumber);
      } else {
        sidePanel.style.display = "block";
        overlay = document.getElementById("overlay");
        overlay.style.display = "block";
        isSidePanelOpen = true;
        graphRender(stationNumber);
        document.getElementById("prediction-data").style.display = "none";
        document.getElementById("trend-data").style.display = "block";
        //searchBarWrapper.style.display = "none";
        document.getElementById("stationDetail").innerHTML =
          station_pin_details;
        document.getElementById("search-input").value = station.name;
        document.getElementById("search-input").style.backgroundColor =
          "rgb(24, 73, 102)";
      }
    });
  });
  initAutocomplete(map);
}

// Autocomplete functionality for the search

function initAutocomplete(map) {
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    componentRestrictions: { country: ["IE"] },
  };
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("search-input"),
    options
  );
  autocomplete.bindTo("bounds", map);
  const auto_marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29),
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    },
  });

  autocomplete.addListener("place_changed", () => {
    auto_marker.setVisible(false);
    const place = autocomplete.getPlace();
    const position = place.geometry.location;
    if (!place.geometry || !place.geometry.location) {
      window.alert("No info found");
    } else {
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(position);
        map.setZoom(17);
      }
    }

    auto_marker.setPosition(position);
    auto_marker.setVisible(true);
  });
}

function onChangePickUpOrDrop() {
  const fromSelect = document.getElementById("from");
  const toSelect = document.getElementById("to");
  const submitButton = document.getElementById("search");

  if (fromSelect.value && toSelect.value) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
  let selectedPickUpStation = undefined;
  let selectedDropStation = undefined;
  // Update the marker of the selected location
  if (fromSelect.value) {
    selectedPickUpStation = station_data.find(
      (station) => station.name === fromSelect.value
    );
  }
  if (toSelect.value) {
    selectedDropStation = station_data.find(
      (station) => station.name === toSelect.value
    );
  }
  changeMarker(selectedPickUpStation, selectedDropStation);
}

/*
Function to change the marker style when a pick up or drop location is selected
 */
function changeMarker(pickUpStation, dropStation) {
  let icon = {};
  station_pins.forEach((pin) => {
    if (
      (pickUpStation &&
        pin.position.toJSON().lat == pickUpStation.position.lat &&
        pin.position.toJSON().lng == pickUpStation.position.lng) ||
      (dropStation &&
        pin.position.toJSON().lat == dropStation.position.lat &&
        pin.position.toJSON().lng == dropStation.position.lng)
    ) {
      icon = {
        url: "images/pin.png",
        scaledSize: new google.maps.Size(35, 35),
      };
      pin.setIcon(icon);
    } else {
      icon = {
        url: "images/location.png",
        scaledSize: new google.maps.Size(30, 30),
      };
      pin.setIcon(icon);
    }
  });
}

function checkInputs() {
  const fromSelect = document.getElementById("from");
  const toSelect = document.getElementById("to");
  const submitButton = document.getElementById("search");

  if (fromSelect.value && toSelect.value) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
}

function toggleJourneyPlanner() {
  const box = document.querySelector(".box").classList.toggle("expand");
  const arrow = document.querySelector(".arrow").classList.toggle("up");
  const content = document.querySelector(".content").classList.toggle("show");

  const dateTime = new Date();
  console.log(dateTime);
  let time = document.getElementById("time");
  time.value =
    ("0" + dateTime.getHours()).slice(-2) +
    ":" +
    ("0" + dateTime.getMinutes()).slice(-2);

  let date = document.getElementById("date");
  date.value =
    dateTime.getFullYear() +
    "-" +
    ("0" + (dateTime.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + dateTime.getDate()).slice(-2);
  date.min =
    dateTime.getFullYear() +
    "-" +
    ("0" + dateTime.getMonth()).slice(-2) +
    "-" +
    ("0" + dateTime.getDate()).slice(-2);
  dateTime.setDate(dateTime.getDate() + 5);
  date.max =
    dateTime.getFullYear() +
    "-" +
    ("0" + dateTime.getMonth()).slice(-2) +
    "-" +
    ("0" + dateTime.getDate()).slice(-2);
}


function showAvailable(isBikesButton) {

  const availableData = isBikesButton ? 'available_bikes' : 'available_bike_stands';
    

  station_data.forEach((station) => {
    const stat_info = station_info.find(
      (info) => info.number === station.number
    );
    const stat_pin = new google.maps.Marker({
      position: { lat: station.position.lat, lng: station.position.lng },
      map: map,
      icon: {
        url: "images/mapMarker.png",
        scaledSize: new google.maps.Size(30, 30),
      },
    });
    const availableCount = stat_info[availableData];
    console.log(
      `Station ${stat_info.name}: ${availableCount} available ${
        isBikesButton ? "bikes" : "bike_stands"
      }`
    );
    const infowindow = new google.maps.InfoWindow({
      content: `<div class="single-info-window"><div class="single-info-window-inner">${availableCount}</div></div>`,
    });
    infowindow.open(map, stat_pin);
    google.maps.event.addListener(map, "click", () => {
      infowindow.close();
      initMap();
    });
  });
}

const bikeButton = document.querySelector('.button-container button:nth-of-type(1)');
const standsButton = document.querySelector('.button-container button:nth-of-type(2)');

bikeButton.classList.add('selected');
bikeButton.addEventListener('click', function() {
  bikeButton.classList.add('selected');
  standsButton.classList.remove('selected');
  showAvailable(true);
});

standsButton.addEventListener('click', function() {
  standsButton.classList.add('selected');
  bikeButton.classList.remove('selected');
  showAvailable(false);
});

function updateTime() {
  // get current time
  const now = new Date();

  // get hours, minutes, and seconds
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  // update time element
  const timeElement = document.getElementById("currentTime");
  timeElement.innerText = `${hours}:${minutes}`;
}

setInterval(updateTime, 1000);

function toggleDarkMode() {
  isDarkModeEnabled = !isDarkModeEnabled;

  const header = document
    .querySelector(".header-style")
    .classList.toggle("header-dark");

  const headertext = document
    .querySelector(".header-text")
    .classList.toggle("header-text-dark");

  const journeytext = document
    .querySelector(".journey-text")
    .classList.toggle("header-text-dark");

  if (isDarkModeEnabled) {
    const logo = document.querySelector(".logoImg");
    logo.src = "./images/dbikes_logo_dark.png";
  } else {
    const logo = document.querySelector(".logoImg");
    logo.src = "./images/logo.svg";
  }

  map.setOptions({
    styles: isDarkModeEnabled ? mapStyles.dark : mapStyles.normal,
  });
}

const mapStyles = {
  normal: [],
  dark: getMapStyles(),
};

async function planJourney() {
  let pickUpPointPredictions = {};
  let dropPointPredictions = {};

  let selectedTime = document.getElementById("time").value;
  let selectedDate = document.getElementById("date").value;
  let fromLocation = document.getElementById("from").value;
  let toLocation = document.getElementById("to").value;

  let selectedPickUpStation = station_data.find(
    (station) => station.name === fromLocation
  );
  let selectedDropStation = station_data.find(
    (station) => station.name === toLocation
  );
  console.log(selectedTime, selectedDate);
  let requestData = { time: selectedDate + " " + selectedTime + ":00" };

  await getPredictionsForDate(selectedPickUpStation.number, requestData).then(
    (data) => {
      pickUpPointPredictions = data;
    }
  );
  await getPredictionsForDate(selectedDropStation.number, requestData).then(
    (data) => {
      dropPointPredictions = data;
    }
  );

  console.log("Pickup: ", pickUpPointPredictions);
  console.log("Drop:", dropPointPredictions);

  const sidePanel = document.getElementById("side-panel");
  sidePanel.style.display = "block";
  overlay = document.getElementById("overlay");
  overlay.style.display = "block";
  isSidePanelOpen = true;
  document.getElementById("trend-data").style.display = "none";
  document.getElementById("prediction-data").style.display = "block";
  displayStationDetails(
    selectedPickUpStation,
    selectedTime + " " + selectedDate,
    "pickup"
  );
  displayStationDetails(
    selectedDropStation,
    selectedTime + " " + selectedDate,
    "drop"
  );

  displayPredictionChart(
    selectedPickUpStation.number,
    selectedTime,
    selectedDate,
    'pickup'
  );
  displayPredictionChart(
    selectedDropStation.number,
    selectedTime,
    selectedDate,
    'drop'
  );
}

function displayStationDetails(station, time, type) {
  time = getDateFromString(
    time.split(" ")[1],
    time.split(" ")[0]
  ).toLocaleString();
  var s = "";
  if (type === "pickup") {
    s = `Bikes: ${station.available_bikes}`;
  } else {
    s = `Free Stands: ${station.available_bike_stands}`;
  }
  let stationDetailsHtml = `<h2>${station.name}</h2>
  <div class="predictions-container">
    <p class='prediction-values'>Forecast for: ${time}</p>
    <p class='prediction-values'>${s}</p>
    <p class='prediction-values'>Card Accepted: ${
      station.banking ? "Yes" : "No"
    }</p>
  </div>`;
  let stationPrediction = document.getElementById(type + "-stationPrediction");
  stationPrediction.innerHTML = stationDetailsHtml;
}

function getMapStyles() {
  return [
    {
      elementType: "geometry",
      stylers: [
        {
          color: "#242f3e",
        },
      ],
    },
    {
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#746855",
        },
      ],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#242f3e",
        },
      ],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#d59563",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#d59563",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [
        {
          color: "#263c3f",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#6b9a76",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [
        {
          color: "#38414e",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#212a37",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#9ca5b3",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [
        {
          color: "#746855",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        {
          color: "#1f2835",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#f3d19c",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [
        {
          color: "#2f3948",
        },
      ],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#d59563",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#17263c",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#515c6d",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#17263c",
        },
      ],
    },
  ];
}

// Close side-panel when clicked outside the side panel.
overlay = document.getElementById("overlay");
document.addEventListener("click", function (event) {
  // let markerButtons = document.getElementsByTagName('img');
  const sidePanel = document.getElementById("side-panel");
  if (overlay.contains(event.target)) {
    overlay.style.display = "none";
    sidePanel.style.display = "none";
    document.getElementById("search-input").value = "";
    document.getElementById("search-input").style.backgroundColor = "";
  }
});

if (!String.prototype.format) {
  String.prototype.format = function (...args) {
    return this.replace(/(\{\d+\})/g, function (a) {
      return args[+a.substring(1, a.length - 2) || 0];
    });
  };
}

window.init = init;
window.initMap = initMap;
window.loadData = loadData;
window.checkInputs = checkInputs;
window.toggleJourneyPlanner = toggleJourneyPlanner;
window.toggleDarkMode = toggleDarkMode;
window.onChangePickUpOrDrop = onChangePickUpOrDrop;
window.planJourney = planJourney;
window.showAvailable = showAvailable;
// window.updateTime = updateTime;
