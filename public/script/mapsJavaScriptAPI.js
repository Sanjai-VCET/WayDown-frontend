// Define the CORS proxy URL
const CROSproxyURL = "https://www.whateverorigin.org/get?url=";

// Add language argument if defined (optional)
let args = "";
if (typeof language !== "undefined") args += "&language=" + language;

// Function to send requests through the CORS proxy
function sendRequestThroughCROSproxy(url, callback) {
  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        if (callback) callback(JSON.parse(this.responseText).contents);
      } else {
        console.warn("Proxy request failed, retrying:", this.status);
        sendRequestThroughCROSproxy(url, callback); // Retry on failure
      }
    }
  };
  xhttp.open("GET", CROSproxyURL + encodeURIComponent(url), true);
  xhttp.send();
}

// Bypass function to handle Google Maps API script loading
function bypass(googleAPIcomponentJS, googleAPIcomponentURL) {
  if (googleAPIcomponentURL.toString().indexOf("common.js") !== -1) {
    const removeFailureAlert = function (googleAPIcomponentURL) {
      sendRequestThroughCROSproxy(googleAPIcomponentURL, (responseText) => {
        const anotherAppendChildToHeadJSRegex = /\.head;.*src=(.*?);/;
        const anotherAppendChildToHeadJS = responseText.match(
          anotherAppendChildToHeadJSRegex
        );
        const googleAPItrustedScriptURL = anotherAppendChildToHeadJS[1];
        const bypassQuotaServicePayload =
          anotherAppendChildToHeadJS[0].replace(
            googleAPItrustedScriptURL,
            googleAPItrustedScriptURL +
              '.toString().indexOf("QuotaService.RecordEvent")!==-1?"":' +
              googleAPItrustedScriptURL
          );

        const script = document.createElement("script");
        script.innerHTML = responseText
          .replace(
            new RegExp(/;if\(![a-z]+?\).*Failure.*?\}/),
            ";"
          )
          .replace(
            new RegExp(/(\|\|\(\(\)=>\{\}\);\S+\?\S+?\()/),
            "$1true||"
          )
          .replace(anotherAppendChildToHeadJSRegex, bypassQuotaServicePayload);
        document.head.appendChild(script);
      });
    };
    googleAPIcomponentJS.innerHTML =
      "(" + removeFailureAlert.toString() + ')("' + googleAPIcomponentURL.toString() + '")';
  } else if (googleAPIcomponentURL.toString().indexOf("map.js") !== -1) {
    const hijackMapJS = function (googleAPIcomponentURL) {
      sendRequestThroughCROSproxy(googleAPIcomponentURL, (responseText) => {
        const script = document.createElement("script");

        const unknownStatusRegex = /const\s+(\w+)\s*=.*?;/g;
        const unknownStatusMatch = responseText.match(unknownStatusRegex);

        for (let i = 0; i < unknownStatusMatch.length; i++) {
          if (unknownStatusMatch[i].indexOf("getStatus") !== -1) {
            script.innerHTML = responseText.replace(
              unknownStatusMatch[i],
              unknownStatusMatch[i].replace(/=.*/, "=1;")
            );
            break;
          }
        }
        document.head.appendChild(script);
      });
    };
    googleAPIcomponentJS.innerHTML =
      "(" + hijackMapJS.toString() + ')("' + googleAPIcomponentURL.toString() + '")';
  } else {
    googleAPIcomponentJS.src = googleAPIcomponentURL;
  }
}

// Function to create and execute the payload
function createAndExecutePayload(googleAPIjs) {
  const script = document.createElement("script");
  const appendChildToHeadJS = googleAPIjs.match(/(\w+)\.src=(_.*?);/);
  const googleAPIcomponentJS = appendChildToHeadJS[1];
  const googleAPIcomponentURL = appendChildToHeadJS[2];
  script.innerHTML = googleAPIjs.replace(
    appendChildToHeadJS[0],
    "(" + bypass.toString() + ")(" + googleAPIcomponentJS + ", " + googleAPIcomponentURL + ");"
  );
  document.head.appendChild(script);
}

// Export function to initialize the map
export function initMapThroughProxy(callback) {
  sendRequestThroughCROSproxy(
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&callback=initMap" +
      args,
    (googleAPIjs) => {
      createAndExecutePayload(googleAPIjs);
      // Set up the initMap callback to be overridden by the component
      window.initMap = callback || (() => console.log("Map initialized"));
    }
  );
}