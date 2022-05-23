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

function togLogin() {
  let main = document.getElementById("login");
  main.classList.toggle("hidden");
}
