const socket = io();

//Elementes
const $messgeForm = document.querySelector("form");
const $messageFormInput = document.querySelector("#message");
const $messageFormButton = document.querySelector("#send");
const $locationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild;
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight;
  }

  
}


socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (location) => {
  console.log(location);
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    location: location.url,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $sidebar.innerHTML = html;
});

$messgeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = $messageFormInput.value;
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("message delivered!");
  });
});

$locationButton.addEventListener("click", () => {
  const locationFunctionality = navigator.geolocation;
  if (!locationFunctionality) {
    return alert("Broswer does't support geolocation");
  }
  $locationButton.setAttribute("disabled", "disabled");
  locationFunctionality.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit(
      "sendLocation",
      {
        latitude,
        longitude,
      },
      () => {
        console.log("location shared!");
        $locationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit(
  "join",
  {
    username,
    room,
  },
  (error) => {
    if (error) {
      alert(error);
      location.href = "/";
    }
  }
);

/*
socket.on("countUpdated", (count) => {
  console.log("count has been updated ", count);
});

document.querySelector("#increment").addEventListener("click", () => {
    console.log("clicked");
    socket.emit('increment');
});
*/
