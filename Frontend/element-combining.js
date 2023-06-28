var searchBarWrapper = document.querySelector(".search-wrapper");
fetch("./location-search.html")
  .then((res) => res.text())
  .then((data) => {
    searchBarWrapper.innerHTML = data;
  });
