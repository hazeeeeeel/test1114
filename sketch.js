import ParameterList from "./parameterList.js";

let classifier;
let bodyPose;
let video;
let font;

let vwidth;
let vheight;

let poses = [];
let classification = "";
let segmentation;
let pixelation_level = 10;
let isModelLoaded = false;

let trainButton;
let title;
let text_contents;

let prev_parameters = [];
let curr_parameters = new ParameterList();

let segmentOptions = {
  maskType: "background",
}

let bodyposeOptions = {
  modelType: "SINGLEPOSE_LIGHTNING", // "MULTIPOSE_LIGHTNING", "SINGLEPOSE_LIGHTNING", or "SINGLEPOSE_THUNDER".
  enableSmoothing: true,
  minPoseScore: 0.45,
  enableTracking: true,
  trackerType: "boundingBox", // "keypoint" or "boundingBox"
  flipped: false
}

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose();
  // font = this.loadFont('assets/fonts/bb_bureau_trial/Politip-trial.ttf');
}

function setup() {
  let w = window.innerWidth / 2 - 60;
  createCanvas(w, w * 1.5);

  console.log("width: " + width, "; height: " + height);

  // Create the webcam video and hide it
  vwidth = w;
  vheight = w * 0.75;
  video = createCapture(VIDEO);
  video.size(vwidth, vheight);
  video.hide();

  title = createP("Bouldering");
  title.class("politip");

  text_contents = document.getElementsByClassName("text-content");

  // For this example to work across all browsers
  // "webgl" or "cpu" needs to be set as the backend
  ml5.setBackend("webgl");

  // Set up the neural network
  let classifierOptions = {
    task: "classification",
  };
  classifier = ml5.neuralNetwork(classifierOptions);

  modelPath = "model-1018-AIX/";

  const modelDetails = {
    model: modelPath + "model.json",
    metadata: modelPath + "model_meta.json",
    weights: modelPath + "model.weights.bin",
  };

  classifier.load(modelDetails, modelLoaded);

  // Start the bodyPose detection
  bodyPose.detectStart(video, gotPoses);

}

function draw() {
  background(255, 255, 255);
  
  //Display the webcam video
    
  image(video, 0, 0, vwidth, vheight);

  // Draw the bodyPose keypoints
  if (poses[0]) {
    let pose = poses[0];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let keypoint = pose.keypoints[i];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
    }
  }

  // If the model is loaded, make a classification and display the result
  if (isModelLoaded && poses[0]) {
    let inputData = flattenPoseData();
    // classifier.classify(inputData, gotClassification);
    // textSize(64);
    // fill(0, 255, 0);
    // text(classification, 20, 60);

    // store current parameters separately to make a delay in change
    let pose = poses[0];
    let ct = (pose.left_shoulder.x + pose.right_shoulder.x) / 2;
    let cb = (pose.left_ankle.x + pose.right_ankle.x) / 2;
    curr_parameters.set(
      abs(max(pose.left_ankle.y, pose.right_ankle.y) - min(pose.left_eye.y, pose.right_eye.y)), // poseHeight
      abs(pose.left_wrist.x - pose.right_wrist.x), // armSpan
      abs(pose.left_ankle.x - pose.right_ankle.x), // feetSpan
      ct - pose.left_wrist.x, // leftHandSpan
      pose.right_wrist.x - ct, // rightHandSpan
      cb - pose.left_ankle.x, // leftFeetSpan
      pose.right_ankle.x - cb, // rightHandSpan
      ct, // centerTop
      cb, // centerBottom
    );

    // calculate smoothed value for display
    smoothData();
    
    drawParameters();
    
    // displayTitle();
    displayText();
  }
}

function drawParameters() {
  push();

  strokeWeight(3);
  stroke(0, 255, 0);
  line(10, 10, 10, 10 + poseHeight);
  line(vwidth / 2 + 10 - leftHandSpan, 10, vwidth / 2 + 10, 10);
  line(vwidth / 2 + 10, 30, vwidth / 2 + 10 + rightHandSpan, 40, 30);

  strokeWeight(1);
  stroke(255, 255, 0);
  line(centerTop, 0, centerTop, vheight);
  stroke(0, 255, 255);
  line(centerBottom, 0, centerBottom, vheight);

  noStroke();
  fill(0, 255, 0);
  textSize(12);
  text(round(poseHeight), 10, 13 + poseHeight); // 0 - 180
  text(round(poseHeight2), 20, 13 + poseHeight2);
  text(round(armSpan), 33 + armSpan, 10); // 0 - 120
  text(round(feetSpan), 33 + feetSpan, 30); // 0 - 100

  fill(255, 255, 0);
  text(round(centerTop), centerTop + 3, 33);

  fill(0, 255, 255);
  text(round(centerBottom), centerBottom + 3, 33);
  pop();
}

function displayTitle() {
  // let weight = map(leftBottomY, 0, windowHeight, 20, 200);
  let width = map(armSpan, 0, 180, 25, 400);
  // let height = map(poseHeight, 0, 800, -40, 60);
  title.style("font-size", "6rem");
  // title.style("font-variation-settings", "'wght' " + weight + ", 'wdth' " + width + ", 'HGHT' " + height);
  title.style("font-variation-settings", "'wdth' " + width);
}

function displayText() {
  // slant: indicates the tilt of torso
  // displacement from midpoint of hips to midpoint of shoulders
  let slant = 0;
  let centerSlant = centerTop - centerBottom;
  if (leftHandSpan > rightHandSpan) {
    slant = round(map(centerSlant, 0, 30, 0, -12));
  } else {
    slant = round(map(centerSlant, 0, 30, 0, 12));
  }

  // thin stroke: left span indicates spread of left arm
  let thinStroke = round(map(curr_parameters.leftHandSpan, 0, 100, 0, 100));

  // thick stroke: right span indicates spread of right arm
  let thickStroke = round(map(curr_parameters.rightHandSpan, 0, 100, 0, 100));

  let A_team = ["A", "C", "E", "F", "L"];
  let I_team = ["B", "D", "I", "M", "S"];
  let X_team = ["H", "K", "R", "T", "X"];
  let spans = [];
  // switch (classification) {
  //   case "A":
      for (let letter of A_team) {
        let getSpans = document.getElementsByClassName(letter);
        spans.push(...getSpans);
      }
  //     break;
  //   case "I":
      for (let letter of I_team) {
        let getSpans = document.getElementsByClassName(letter);
        spans.push(...getSpans);      }
  //     break;
  //     case "X":
        for (let letter of X_team) {
          let getSpans = document.getElementsByClassName(letter);
          spans.push(...getSpans);        
        }
  //       break;
  
  //   default:
  //     break;
  // }
  for (let s of spans) {
    let fvs = "";
    fvs += "'slnt' " + slant + ", ";
    fvs += "'yopq' " + thinStroke + ", ";
    fvs += "'xopq' " + thickStroke;
    // console.log(fvs);
    
    s.style.fontVariationSettings = fvs;
  }
}

function smoothData() {
  // compare current data to previous data

  // remove current data if it's too far from prev ones

  // scale down changes

  // add current data to prev
  prev_parameters.unshift(curr_parameters);
  if(prev_parameters.length >= 6) {
    prev_parameters.pop();
  }
}

// convert the bodyPose data to a 1D array
function flattenPoseData() {
  let pose = poses[0];
  let poseData = [];
  for (let i = 0; i < pose.keypoints.length; i++) {
    let keypoint = pose.keypoints[i];
    poseData.push(keypoint.x);
    poseData.push(keypoint.y);
  }
  return poseData;
}

// Callback function for when bodyPose outputs data
function gotPoses(results) {
  poses = results;
}

// function gotSegmentation(result) {
//   segmentation = result;
// }

// Callback function for when the classifier makes a classification
function gotClassification(results) {
  classification = results[0].label;
}

// Callback function for when the pre-trained model is loaded
function modelLoaded() {
  isModelLoaded = true;
}

function redirect2train() {
  window.location.href = "train.html";
}
