import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { Camera, CameraApi, CameraType } from "react-native-camera-kit";

function App(): React.JSX.Element {
  const cameraRef = useRef<CameraApi>(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.Back);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);

  useEffect(() => {
    (async () => {
      // console.log("yes123");
      // fetch("https://example.org/products.json").then(async (xxx) => {
      //   console.log("xxx", xxx);
      // }).catch((e) => console.log(e));
      // console.log("yes123", await response.json());

      // console.log("yes");
      await tf.ready();
      // console.log('FETCH ',fetch);
      // console.log('FETCH', fetch);
      cocoSsd
        // .load({base: "lite_mobilenet_v2", modelUrl: "https://ahsan.coms"})
        .load()
        .then((a) => {
          console.log("done", a);
          setModel(a);
        })
        .catch((e) => console.log("e", e));

      // console.log("loadedModel", loadedModel)
      // setModel(loadedModel);
    })();
  }, []);

  const convertImageToTensor = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageTensor = await tf.browser.fromPixels(blob);
    return imageTensor;
  };

  const handleCapture = async (image: { uri: string }) => {
    setImageUri(image.uri);

    if (model) {
      const tensor = await convertImageToTensor(image.uri);
      const predictions = await model.detect(tensor);
      setDetections(predictions);
      console.log("Detections:", predictions);
    }
  };

  console.log(detections, model);

  return (
    <SafeAreaView style={styles.root}>
      {cameraVisible ? (
        imageUri ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <Image source={{ uri: imageUri }} style={{ flex: 1 }} />
          </>
        ) : (
          <>
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              cameraType={cameraType}
              flashMode="auto"
            />
            <TouchableOpacity
              style={styles.captureButton}
              onPress={async () => {
                const image = await cameraRef.current?.capture();
                image?.uri && handleCapture(image);
              }}
            />
            <TouchableOpacity
              style={styles.flipTypeButton}
              onPress={() =>
                setCameraType((t) =>
                  t === CameraType.Back ? CameraType.Front : CameraType.Back
                )
              }
            >
              <Text style={styles.buttonIcon}>↻</Text>
            </TouchableOpacity>
          </>
        )
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCameraVisible(true)}
        >
          <Text style={styles.buttonText}>Open Camera</Text>
        </TouchableOpacity>
      )}
      {detections.length > 0 && (
        <Text>Detected: {JSON.stringify(detections)}</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ababab",
  },
  button: {
    alignItems: "center",
    height: 50,
    width: "100%",
    backgroundColor: "#7359be",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 600,
  },
  buttonIcon: {
    color: "#000000",
    fontSize: 26,
    fontWeight: 600,
  },
  captureButton: {
    height: 60,
    width: 60,
    backgroundColor: "#ffffff",
    borderColor: "#000000",
    borderWidth: 4,
    outlineColor: "#f0f0f0",
    outlineWidth: 3,
    borderRadius: 30,
    position: "absolute",
    bottom: 40,
    left: Dimensions.get("window").width / 2 - 30,
  },
  flipTypeButton: {
    height: 40,
    width: 40,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderRadius: 20,
    position: "absolute",
    bottom: 40,
    left: Dimensions.get("window").width / 2 + 80,
  },
});

export default App;
