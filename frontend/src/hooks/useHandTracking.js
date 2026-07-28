import { useState, useRef, useEffect, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import toast from 'react-hot-toast';

export default function useHandTracking() {
  const [landmarks, setLandmarks] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isPinching, setIsPinching] = useState(false);
  const [isFist, setIsFist] = useState(false);

  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch (err) {
        console.error('Error closing landmarker:', err);
      }
      landmarkerRef.current = null;
    }
    setIsReady(false);
    setLandmarks(null);
    setIsPinching(false);
    setIsFist(false);
  }, []);

  const start = useCallback(async () => {
    // Clean up any existing instances before starting anew
    stop();
    setError(null);
    setIsReady(false);

    try {
      // 1. Resolve WASM assets & instantiate HandLandmarker
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      landmarkerRef.current = landmarker;

      // 2. Access webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) {
            resolve();
          } else {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
        await videoRef.current.play();
      }

      setIsReady(true);

      // 3. Detection loop
      let lastVideoTime = -1;
      const detectFrame = () => {
        const video = videoRef.current;
        const currentLandmarker = landmarkerRef.current;

        if (
          video &&
          currentLandmarker &&
          video.currentTime !== lastVideoTime &&
          video.readyState >= 2
        ) {
          lastVideoTime = video.currentTime;
          const result = currentLandmarker.detectForVideo(
            video,
            performance.now()
          );

          if (result && result.landmarks && result.landmarks.length > 0) {
            const rawHand = result.landmarks[0];
            // Mirror x coordinate (x = 1 - x) to align naturally with mirrored camera
            const mirroredLandmarks = rawHand.map((pt) => ({
              x: 1 - pt.x,
              y: pt.y,
              z: pt.z,
            }));

            setLandmarks(mirroredLandmarks);

            // Compute gestures
            const thumbTip = mirroredLandmarks[4];
            const indexTip = mirroredLandmarks[8];
            const middleTip = mirroredLandmarks[12];
            const ringTip = mirroredLandmarks[16];
            const pinkyTip = mirroredLandmarks[20];
            const wrist = mirroredLandmarks[0];

            // Pinch: Euclidean distance thumb tip to index tip < 0.05
            const pinchDist = Math.hypot(
              thumbTip.x - indexTip.x,
              thumbTip.y - indexTip.y
            );
            setIsPinching(pinchDist < 0.05);

            // Fist: average distance from 4 fingertips to wrist < 0.15
            const distIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
            const distMiddle = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
            const distRing = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y);
            const distPinky = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y);

            const avgFingertipDist =
              (distIndex + distMiddle + distRing + distPinky) / 4;
            setIsFist(avgFingertipDist < 0.15);
          } else {
            setLandmarks(null);
            setIsPinching(false);
            setIsFist(false);
          }
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    } catch (err) {
      console.error('Hand tracking initialization error:', err);
      const msg = err.message || 'Failed to initialize hand tracking camera stream';
      setError(msg);
      toast.error('Could not access camera or load hand tracking model.');
      stop();
    }
  }, [stop]);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  return {
    videoRef,
    landmarks,
    isReady,
    error,
    start,
    stop,
    isPinching,
    isFist,
  };
}
