# vinvi.to

Let your creativity flow while creating your own short stories, or reading others. vinvi.to encourages interaction between authors with the state of the art marketplace.

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-c66648af7eb3fe8bc4f294546bfd86ef473780cde1dea487d3c4ff354943c9ae.svg)](https://github.dev/LukasSinger/vinvi.to)

## API info

`*` means auth headers are required. Include the following in your `fetch()` requests to fulfill these, replacing `username-goes-here` and `password-goes-here` with the actual username and password:

```js
"headers": {
    "X-User": "username-goes-here",
    "X-Pass": "password-goes-here"
}
```

- `* GET /api/balance` - Gets the balance of the signed-in user. Responds with status code `200` and the balance (a number) if the request is successful. Responds with status code `401` if invalid credentials are provided.
- `* GET /api/library` - Gets all stories owned by the signed-in user, excluding stories that the user created themselves. Responds with status code `200` and an array of story IDs if the request is successful. Responds with status code `401` if invalid credentials are provided.
- `POST /api/user/new` - Registers a new user. Accepts form data with `pfp` (optional), `email`, `username`, and `password` properties. Responds with status code `200` if the user is successfully registered. Responds with status code `400` if there is a problem with the form.
- `GET /api/user/:id` - Retrieves information about the user with the specified `:id`. User information consists of `username`, `pfp` (request path to image file), and `createdStories` (array of story IDs). Responds with status code `200` and the user info if the request is successful. Responds with status code `404` if the specified user is not found.
- `POST /api/story/new` - Publishes a new story. Accepts form data with `username`, `password`, `title`, `description` (optional), `tags` (optional), `content`, and `cover` (optional) properties. Responds with status code `200` if the story is successfully published. Responds with status code `400` if there is a problem with the form. Responds with status code `401` if invalid credentials are provided.
- `GET /api/story/search?query=:q&limit=:lim` - Retrieves a list of stories, optionally filtered by the query `:q`, which will limit the results to stories whose titles match. Returns at most `:lim` (or 20, if not provided) matches, ordered from newest to oldest. Responds with status code `200` and an array of story metadata (`content` fields is removed) if the request is successful.
- `* GET /api/story/:id` - Retrieves the story with the specified `:id`. A story consists of the properties submitted upon creation (not `password`) as well as `cost` and `id` properties. Responds with status code `200` and the full story object if the request was successfully authenticated. Responds with status code `200` but only the story's metadata (`content` field is removed) if the request was not authenticated. Responds with status code `404` if the specified story was not found.
- `* GET /api/story/:id/buy` - Buys the story with the specified `:id` for the signed-in user. Responds with status code `200` if the transaction is successful. Responds with status code `400` if the user doesn't have sufficient balance to complete the purchase. Responds with status code `401` if invalid credentials are provided. Responds with status code `404` if the specified story was not found.
- `* GET /api/rewards` - Gives the signed-in user their daily rewards. Responds with status code `200` if rewards are fully or partially fulfilled, based on the amount of content in the database still available to give. Responds with status code `401` if invalid credentials are provided. Responds with status code `429` and the time remaining, in milliseconds, until the next reward can be given if a reward has been collected within the past 24 hours.
