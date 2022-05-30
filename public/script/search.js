let searchFormElement = document.querySelector("#searchForm");
let searchElement = searchFormElement.querySelector("[name='search']");

searchFormElement.addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.assign(`/search?query=${searchElement.value}`);
});
