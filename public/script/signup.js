let formElement = document.querySelector("#innerSignupModal");
let usernameElement = formElement.querySelector("[name='username']");
let passwordElement = formElement.querySelector("[name='password']");

formElement.addEventListener("submit", () => {
  localStorage.setItem("username", usernameElement.value);
  localStorage.setItem("password", passwordElement.value);
});
