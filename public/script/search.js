let formElement = document.querySelector("#searchForm");
let searchElement = formElement.querySelector("[name='search']");

formElement.addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.assign(`/search?query=${searchElement.value}`);
});
