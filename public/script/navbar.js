if (localStorage.getItem("username")) {
  // Delete the logged-out sidebar
  document.getElementById("loggedOutSidebar").remove();
} else {
  // Delete the logged-in sidebar
  document.getElementById("loggedInSidebar").remove();
}

function togSideBar() {
  let sidebar = document.getElementById("sideBar");
  let profileInfo = document.getElementById("profileInfo");
  sidebar.classList.toggle("-translate-x-full");
  profileInfo.classList.add("hidden");
  console.log("sideba2r");
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
let signUpModal = document.getElementById("signUpModal");
let innerSignupModal = document.getElementById("innerSignupModal");

signupButton.addEventListener("click", function () {
  signUpModal.classList.remove("hidden");
  console.log("Modal opened");
  signUpOpen = true;
});

document.addEventListener("mouseup", function (event) {
  if (signUpOpen && innerSignupModal !== event.target && !innerSignupModal.contains(event.target)) {
    console.log("Modal Closed");
    signUpOpen = false;
    signUpModal.classList.add("hidden");
  }
});
