(function () {
  let username = localStorage.getItem("username");
  let password = localStorage.getItem("password");
  let contentElement = document.querySelector("[data-content]");
  let paywallElement = document.querySelector("[data-pay]");
  let buyButton = paywallElement.querySelector("[data-action-buy]");

  (async () => {
    let storyId = contentElement.getAttribute("data-content");
    let storyData;
    if (username) {
      storyData = await fetch(`/api/story/${storyId}`, {
        headers: {
          "X-User": username,
          "X-Pass": password
        }
      });
      storyData = await storyData.json();
    }
    if (storyData && storyData.content) contentElement.innerText = storyData.content;
    else {
      contentElement.classList.add("hidden");
      paywallElement.classList.remove("hidden");
      buyButton.addEventListener("click", () => {
        if (!username) {
          document.getElementById("signupButton").click();
          return;
        }
        (async () => {
          let result = await fetch(`/api/story/${storyId}/buy`, {
            headers: {
              "X-User": localStorage.getItem("username"),
              "X-Pass": localStorage.getItem("password")
            }
          });
          if (result.ok) {
            let successModal = document.querySelector("[data-modal-success]");
            let successButton = successModal.querySelector("button");
            successButton.addEventListener("click", (e) => {
              window.location.reload();
            });
            successModal.classList.remove("hidden");
          } else {
            let failModal = document.querySelector("[data-modal-fail]");
            let failButton = failModal.querySelector("button");
            failButton.addEventListener("click", (e) => {
              failModal.classList.add("hidden");
            });
            failModal.classList.remove("hidden");
          }
        })();
      });
    }
  })();
})();
