let username = localStorage.getItem("username");
let sideBarState = "loggedOutSidebar";
if (username) {
  // Delete the logged-out sidebar
  document.getElementById("loggedOutSidebar").remove();
  // Set the username button
  document.getElementById("usernameButton").innerText = username;
  sideBarState = "loggedInSidebar";
  // Set the profile link
  document.querySelector("[data-link-profile]").setAttribute("href", `/user/${username}`);
} else {
  // Delete the logged-in sidebar
  document.getElementById("loggedInSidebar").remove();
  sideBarState = "loggedOutSidebar";
}

function togSideBar() {
  let sidebar = document.getElementById(sideBarState);
  console.log(sideBarState);
  sidebar.classList.toggle("-translate-x-full");
}

let hidden = true;

function togProfileInfo() {
  let profileInfo = document.getElementById("profileInfo");

  if (hidden == true) {
    profileInfo.classList.remove("hidden");
    setTimeout(function () {
      profileInfo.classList.toggle("translate-y-20");
      profileInfo.classList.toggle("opacity-0");
    }, 250);
    hidden = false;
  } else if (hidden == false) {
    profileInfo.classList.toggle("translate-y-20");
    profileInfo.classList.toggle("opacity-0");
    setTimeout(function () {
      profileInfo.classList.remove("hidden");
    }, 250);
    hidden = false;
  }

  console.log("sideba2r");
}

const signupButton = document.getElementById("signupButton");
let signUpOpen = false;

signupButton.addEventListener("click", function () {
  let signUpModal = document.getElementById("signUpModal");
  signUpModal.classList.remove("hidden");
  console.log("Modal opened");
  signUpOpen = true;
});

document.addEventListener("mouseup", function (event) {
  let signUpModal = document.getElementById("signUpModal");
  let innerSignupModal = document.getElementById("innerSignupModal");
  if (signUpOpen && innerSignupModal !== event.target && !innerSignupModal.contains(event.target)) {
    console.log("Modal Closed");
    signUpOpen = false;
    signUpModal.classList.add("hidden");
  }
});
