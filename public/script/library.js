(async () => {
  let feedElement = document.querySelector("[data-feed]");
  let results;
  if (localStorage.getItem("username")) {
    results = await fetch("/api/library", {
      headers: {
        "X-User": localStorage.getItem("username"),
        "X-Pass": localStorage.getItem("password")
      }
    });
    results = await results.json();
    if (results) {
      let storyTile = await fetch("../partials/storyTile.ejs");
      storyTile = await storyTile.text();
      for (let i = 0; i < results.length; i++) {
        feedElement.innerHTML += ejs.render(storyTile, { metadata: results[i] });
      }
    } else {
      feedElement.innerHTML = "You don't own any stories yet. Why not find one to buy on the <a href='/'>home page</a>?";
    }
  } else {
    feedElement.innerHTML = "You need to sign in to view your library.";
  }
})();
