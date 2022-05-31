let storyFormElement = document.getElementById("storyForm");
let usernameElement = storyFormElement.querySelector("[name='username']");
let passwordElement = storyFormElement.querySelector("[name='password']");

usernameElement.setAttribute("value", localStorage.getItem("username"));
passwordElement.setAttribute("value", localStorage.getItem("password"));
