google.charts.load('current', {'packages':['corechart']});

google.charts.setOnLoadCallback(drawChart1);
google.charts.setOnLoadCallback(drawChart2);

function drawChart1() {
  var data = google.visualization.arrayToDataTable([    ['Days', 'Availability'],
    ['Today', 5],
    ['Tomorrow', 15],
    ['Day 3', 20],
    ['Day 4', 35],
    ['Day 5', 40],
    ['Day 6', 55],
    ['Day 7', 65]
  ]);

  var options = {
    title: 'Availability',
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Days'
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart1'));

  chart.draw(data, options);
}

function drawChart2() {
  var data = google.visualization.arrayToDataTable([    ['Days', 'Availability'],
    ['Today', 5],
    ['Tomorrow', 15],
    ['Day 3', 25],
    ['Day 4', 35],
    ['Day 5', 45],
    ['Day 6', 55],
    ['Day 7', 65]
  ]);

  var options = {
    title: 'Availability',
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Days'
    }
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart2'));

  chart.draw(data, options);
}
