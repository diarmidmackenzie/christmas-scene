const randomString = () => (Math.random() + 1).toString(36).substring(6, 10).toUpperCase();
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const ROOM_KEY = urlParams.get('room') 
if (!ROOM_KEY) {
  location.href = window.location.href + '?room=' + randomString();
}