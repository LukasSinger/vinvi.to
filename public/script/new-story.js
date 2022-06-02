let storyFormElement = document.getElementById("storyForm");
let usernameElement = storyFormElement.querySelector("[name='username']");
let passwordElement = storyFormElement.querySelector("[name='password']");

usernameElement.setAttribute("value", localStorage.getItem("username"));
passwordElement.setAttribute("value", localStorage.getItem("password"));


function richText() {
    phrase = document.getElementById("soon");
    phrase.classList.remove("translate-x-96");
    setTimeout(function () {
        phrase.classList.add("translate-x-96");
      }, 1000);
}