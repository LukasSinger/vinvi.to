let searchFormElement = document.querySelector("#searchForm");
let searchElement = searchFormElement.querySelector("[name='search']");
let balanceElement = document.querySelector("[data-balance]");

(async () => {
  let balance;
  if (localStorage.getItem("username")) {
    balance = await fetch("/api/balance", {
      headers: {
        "X-User": localStorage.getItem("username"),
        "X-Pass": localStorage.getItem("password")
      }
    });
    balance = await balance.json();
  }
  if (balance) balanceElement.innerText = balance;
  else {
    balanceElement.parentElement.classList.add("hidden");
    balanceElement.parentElement.classList.remove("sm:flex");
  }
})();

searchFormElement.addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.assign(`/search?query=${searchElement.value}`);
});
