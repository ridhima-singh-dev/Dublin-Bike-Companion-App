async function post(url = '', data = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

async function get(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
    });
      const data = await response.json();
      return data;
    } catch(error) {
      console.error(error);
    }
}

function getFormattedDate(dateTime){
  return dateTime.getFullYear() +
    "-" +
    ("0" + (dateTime.getMonth() + 1)).slice(-2) +
    "-" +
    ("0" + dateTime.getDate()).slice(-2);
}

function getFormattedTime(dateTime){
  return ("0" + dateTime.getHours()).slice(-2) +
    ":" +
    ("0" + dateTime.getMinutes()).slice(-2) +
    ":" +
    ("0" + dateTime.getSeconds()).slice(-2);
}

function getDateFromString(dateString, timeString){
  dateTimeString = dateString + "T" + timeString + ":00";
  return new Date(Date.parse(dateTimeString));
}
