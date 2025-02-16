
import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

function App(): React.JSX.Element {
  const [cameraReady, setCameraReady] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);

  useEffect(() => {
    (async () => {
      await tf.ready();
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    })();
  }, []);

  const handleCapture = async (image: { uri: string }) => {
    setImageUri(image.uri);

    if (model) {
      const tensor = await convertImageToTensor(image.uri);
      const predictions = await model.detect(tensor);
      setDetections(predictions);
      console.log('Detections:', predictions);
    }
  };

  const convertImageToTensor = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageTensor = await tf.browser.fromPixels(blob);
    return imageTensor;
  };

  return (
    <View style={{ flex: 1 }}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setImageUri(null)}>
            <Text>Retake</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Camera
          style={{ flex: 1 }}
          cameraType={CameraType.Front}
          // onCameraReady={() => setCameraReady(true)}
          // onCapture={handleCapture}
          // onCaptureButtonPressOut={() => console.log("yes")}
        />
      )}
      {detections.length > 0 && <Text>Detected: {JSON.stringify(detections)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({});

export default App;
