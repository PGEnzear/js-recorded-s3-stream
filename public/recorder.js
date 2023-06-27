document.addEventListener("DOMContentLoaded", async () => {
  await main();
})

let chunks = [];

let xhr;
let audioStream;
let mediaRecorder;

const getMediaStream = async () => {
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
  
  return new Promise((resolve, reject) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("getUserMedia supported.");
      navigator.mediaDevices.getUserMedia({audio: true})
        .then((stream) => {
          resolve(stream)
        })
        .catch((err) => {
          console.error(`The following getUserMedia error occurred: ${err}`);
          reject(err)
        });
    } else {
      console.log("getUserMedia not supported on your browser!");
      reject();
    }
  })
}

const buttonEventListeners = () => {
  const record = document.querySelector(".record");
  const stop = document.querySelector(".stop");

  record.onclick = () => {
    xhr = new XMLHttpRequest();

    xhr.open("POST", "http://localhost:3000/sendAudio");

    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log("recorder started");
    record.style.background = "red";
    record.style.color = "black";
  };

  stop.onclick = () => {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
    record.style.background = "";
    record.style.color = "";
  };

}

const mediaRecorderListeners = () => {
  mediaRecorder.onstop = (e) => {
    console.log("recorder stopped");
  
    const audio = document.createElement("audio");
  
    audio.setAttribute("controls", "");
  
    const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    chunks = [];

    const audioFile = new File([blob], "audio.wav");

    const formData = new FormData();

    formData.append("audio", audioFile);
    xhr.send(formData);

    const audioURL = window.URL.createObjectURL(blob);

    audio.src = audioURL;

    console.log(audioURL)
  };

  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };
}

const main = async () => {
  audioStream = await getMediaStream();

  mediaRecorder = new MediaRecorder(audioStream);

  buttonEventListeners();

  mediaRecorderListeners();
}