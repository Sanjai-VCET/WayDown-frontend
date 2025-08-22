// frontend/src/utils/mapmyindiaAPI.js
const MAPMYINDIA_API_URL = "https://apis.mappls.com/advancedmaps/v1/";
const ACCESS_TOKEN = "3b448f6fca4f1dea6b809e69c41de294"; // Your provided key

export function initMapMyIndia(callback) {
  const script = document.createElement("script");
  script.src = `${MAPMYINDIA_API_URL}${ACCESS_TOKEN}/map_sdk?layer=standard&callback=initMap`;
  script.async = true;
  script.onload = () => {
    window.initMap = callback || (() => console.log("MapMyIndia initialized"));
  };
  script.onerror = () => console.error("Failed to load MapMyIndia API. Check the URL or token.");
  document.head.appendChild(script);
}