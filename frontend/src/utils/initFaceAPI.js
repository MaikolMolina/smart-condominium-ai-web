import * as faceapi from 'face-api.js';

export const loadFaceAPIModels = async () => {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    console.log('Modelos de FaceAPI cargados correctamente');
    return true;
  } catch (error) {
    console.error('Error cargando modelos de FaceAPI:', error);
    return false;
  }
};