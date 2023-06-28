let predictions = [];
var bikesAvailableList = [];
var standsAvailableList = [];
var timeObjectList = [];
var daysList = [];
var data;
var bikeAvailabilityPredictionChart;
// Chart.defaults.font = 9;

async function getPredictionsForDate(stationId, requestData) {
  return post(PREDICTION_API.format(stationId), requestData)
    .then((data) => {
      return data;
    })
    .catch((error) => console.error(error));
}

async function getHistoricalDataWeekly(stationId) {
  return post(HISTORICAL_API.format(stationId), {})
    .then((data) => {
      return data;
    })
    .catch((error) => console.error(error));
}

async function extractBikesAvailable(stationId) {
   data = await getHistoricalDataWeekly(stationId);

  for (const id in data) {
    const bikesAvailableAvg = data[id].available_bikes;
    if (bikesAvailableAvg !== null) {
      bikesAvailableList.push(bikesAvailableAvg);
    }
  }
  console.log(bikesAvailableList);


  for (const id in data) {
    const standsAvailableAvg = data[id].available_stands;
    if (standsAvailableAvg !== null) {
      standsAvailableList.push(standsAvailableAvg);
    }
  }
  console.log(standsAvailableList);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  
  
  for (const key in data) {
    const dayDiff = todayIndex - key;
    const day = daysOfWeek[(dayDiff < 0 ? dayDiff + 7 : dayDiff) % 7];
    daysList.push(day);
  }
  
  console.log(daysList);

  return data;
}

function displayPredictionChart(stationId, journeyTime, journeyDate, type) {
  let minutes = journeyTime.split(":")[1];
  let hours = journeyTime.split(":")[0];
  hours = Number(minutes) % 30 === 0 ? hours : String(Number(hours) + 1);
  minutes = "00";

  journeyTime = hours + ":" + minutes;
  let predictionTimes = getPredictionTimes(journeyTime, journeyDate);
  let predictions = {};

  predictionTimes.forEach((time) => {
    let dateTime = getFormattedDate(time) + " " + getFormattedTime(time);
    let requestData = { time: dateTime };
    getPredictionsForDate(stationId, requestData).then((response) => {
      let result = {};
      predictions[dateTime] = response;
      if (Object.keys(predictions).length === predictionTimes.length) {
        predictions = Object.keys(predictions)
          .sort()
          .reduce((accumulator, key) => {
            accumulator[key] = predictions[key];
            return accumulator;
          }, {});
        for (i in predictions) {
          let formattedKey = i.split(" ")[1];
          if (predictions[i].indexOf("-") > 0) {
            predictions[formattedKey] = Math.round(
              (Number(predictions[i].split("-")[0]) +
                Number(predictions[i].split("-")[1])) /
                2
            );
            delete predictions[i];
          } else {
            predictions[formattedKey] = Number(predictions[i].split("+")[0]);
            delete predictions[i];
          }
        }
        if (type === 'pickup'){
          renderChart("pickup-location-chart", predictions);
        } else{
          getAvailableStandsFromPredictions(predictions, stationId).then(data => renderChart("drop-location-chart", data));
        }
      }
    });
  });
}

function getAvailableStandsFromPredictions(predictions, stationId){
  let station_data = [];
  let station_data_response = get(STATIONS_API);
  return station_data_response.then((data) => {
    station_data = data;
    const stat_info = station_data.find(
      (info) => info.number === stationId
    );
    let available_stands = stat_info.available_bike_stands;
    for (i in predictions) {
      predictions[i] = available_stands - predictions[i] < 0 ? 0 : available_stands - predictions[i];
    }
    return predictions;
  });
}

function getPredictionTimes(journeyTime, journeyDate) {
  let plannedDate = journeyDate + "T" + journeyTime + ":00";
  plannedDate = plannedDate = new Date(Date.parse(plannedDate));
  predictionTimes = [];
  predictionStartTime = new Date(plannedDate.getTime() - 30 * 3 * 60000);
  for (var i = 0; i < 6; i++) {
    let predictionTime = new Date(
      predictionStartTime.getTime() + 30 * i * 60000
    );
    predictionTimes.push(predictionTime);
  }
  return predictionTimes;
}

function renderChart(ctx, predictions) {
  Chart.helpers.each(Chart.instances, function (instance) {
    if (instance.canvas.id === ctx) {
      instance.destroy();
    }
  });
  let context = ctx === 'pickup-location-chart'? 'Bike' : 'Stand'
  bikeAvailabilityPredictionChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(predictions),
      datasets: [
        {
          label: `${context} Availability`,
          data: Object.values(predictions),
          backgroundColor: "rgba(18, 83, 109, 1)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function graphRender(stationId) {
  var ctx1 = document.getElementById('myChart3').getContext('2d');
  var ctx2 = document.getElementById('myChart4').getContext('2d');
  
  function renderHistoricalChart(ctx, availableList, daysOfWeek) {
    Chart.helpers.each(Chart.instances, function (instance) {
      if (instance.canvas.id === ctx) {
        instance.destroy();
      }
    });
    let context = ctx === ctx1 ? 'Bike' : 'Stand';
    var chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: daysOfWeek,
        datasets: [{
          label: `${context} Availability`,
          data: availableList,
          backgroundColor: 'rgba(18, 83, 109, 1)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales:{
          y: {
                beginAtZero: true
        }
        }
      }
    });
  }
  

  async function renderCharts(stationId) {
    const data = await extractBikesAvailable(stationId);
    console.log("Data is: ", data);
    console.log("Bikes Available", bikesAvailableList);
    console.log("Stands Available", standsAvailableList);
    console.log("Days", daysList);

    renderHistoricalChart(ctx1, bikesAvailableList, daysList);
    renderHistoricalChart(ctx2, standsAvailableList, daysList);
    
  }
console.log("station id 2 is: ", stationId);
  renderCharts(stationId);
};
