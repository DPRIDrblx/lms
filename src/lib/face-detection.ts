import * as faceapi from "face-api.js";

let modelsLoaded = false;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function detectFace(video: HTMLVideoElement) {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection || null;
}

export type Direction = "up" | "down" | "left" | "right";

export function estimateHeadPose(landmarks: faceapi.FaceLandmarks68): { yaw: number; pitch: number } {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const jaw = landmarks.getJawOutline();

  const noseTip = nose[3];
  const leftEyeCenter = {
    x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length,
    y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length,
  };
  const rightEyeCenter = {
    x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length,
    y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length,
  };

  const eyeCenter = {
    x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
    y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
  };

  const faceWidth = Math.abs(jaw[jaw.length - 1].x - jaw[0].x);
  const faceHeight = Math.abs(jaw[8].y - eyeCenter.y);

  const yaw = (noseTip.x - eyeCenter.x) / (faceWidth * 0.5);
  const pitch = (noseTip.y - eyeCenter.y) / (faceHeight * 0.8) - 1;

  return { yaw, pitch };
}

export function checkDirection(pose: { yaw: number; pitch: number }, target: Direction): boolean {
  const threshold = 0.25;
  switch (target) {
    case "left":
      return pose.yaw < -threshold;
    case "right":
      return pose.yaw > threshold;
    case "up":
      return pose.pitch < -threshold;
    case "down":
      return pose.pitch > threshold;
  }
}

export function getDirectionLabel(dir: Direction): string {
  const labels: Record<Direction, string> = {
    up: "Look Up ↑",
    down: "Look Down ↓",
    left: "Look Left ←",
    right: "Look Right →",
  };
  return labels[dir];
}

export function getRandomChallenges(count = 4): Direction[] {
  const all: Direction[] = ["up", "down", "left", "right"];
  return all.sort(() => Math.random() - 0.5).slice(0, count);
}
