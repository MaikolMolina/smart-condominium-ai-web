import * as faceapi from 'face-api.js';

// Configuración y utilidades para FaceAPI.js
export class FacialRecognition {
  constructor() {
    this.modelLoaded = false;
    this.modelsPath = process.env.PUBLIC_URL + '/models'; // usar public/
  }

  async loadModels() {
    if (this.modelLoaded) return true;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath),
        faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath)
      ]);
      
      this.modelLoaded = true;
      console.log('Modelos de FaceAPI cargados correctamente');
      return true;
    } catch (error) {
      console.error('Error cargando modelos de FaceAPI:', error);
      return false;
    }
  }

  async detectFaces(videoElement) {
    if (!this.modelLoaded) {
      await this.loadModels();
    }

    const detectionOptions = new faceapi.TinyFaceDetectorOptions();
    const detections = await faceapi.detectAllFaces(videoElement, detectionOptions)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  }

  async getFaceEmbedding(canvas) {
    if (!this.modelLoaded) {
      await this.loadModels();
    }

    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? Array.from(detection.descriptor) : null;
  }

  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      sum += Math.pow(embedding1[i] - embedding2[i], 2);
    }
    
    const distance = Math.sqrt(sum);
    const similarity = 1 / (1 + distance);
    return 1 / (1 + distance);
  }
}

export const captureFrame = (videoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas;
};

export const canvasToBase64 = (canvas, quality = 0.8) => {
  return canvas.toDataURL('image/jpeg', quality);
};
