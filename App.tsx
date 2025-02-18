import "@tensorflow/tfjs-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import * as tfRN from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Camera, CameraApi, CameraType } from "react-native-camera-kit";
import { FileSystem } from "react-native-unimodules";
import RNFS from "react-native-fs";

function App(): React.JSX.Element {
  const cameraRef = useRef<CameraApi>(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.Back);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<cocoSsd.DetectedObject[]>([]);

  useEffect(() => {
    (async () => {
      await tf.ready();
      cocoSsd
        .load({ base: "mobilenet_v2" })
        .then((loadedModel) => {
          console.log("loadedModel", loadedModel);
          setModel(loadedModel);
        })
        .catch((error) => {
          console.log("Error in loading model", error);
        });
    })();
  }, []);

  const convertImageToTensor = async (uri: string) => {
    const urlComponents = uri.split("/");
    const fileNameAndExtension = urlComponents[urlComponents.length - 1];
    const destPath = `${RNFS.TemporaryDirectoryPath}/${fileNameAndExtension}`;
    await RNFS.copyFile(uri, destPath);

    console.log("1", "file:/" + destPath);
    const imgB64 = await FileSystem.readAsStringAsync("file://" + destPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("2", imgB64);
    const imgBuffer = tf.util.encodeString(imgB64, "base64").buffer;
    console.log("3");
    const raw = new Uint8Array(imgBuffer);
    console.log("4");
    const imageTensor = tfRN.decodeJpeg(raw);
    console.log("5");

    // const imageAssetPath = Image.resolveAssetSource(image);
    // const response = await tfRN.fetch('file://' + destPath);
    // const blob = await response.blob();

    // const imageTensor = await tf.browser.fromPixels(blob);

    console.log("imageTensor", imageTensor);
    return imageTensor;
  };

  const handleCapture = async (image: { uri: string }) => {
    setImageUri(image.uri);

    if (model) {
      const tensor = await convertImageToTensor(image.uri);
      const detections = await model.detect(tensor);
      setDetections(detections);
      console.log("Predictions:", detections);
    }
  };

  console.log("Predictions", detections);

  return (
    <SafeAreaView style={styles.root}>
      {cameraVisible ? (
        imageUri ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setImageUri(null);
                setDetections([]);
              }}
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
        <View style={{ opacity: model === null ? 0.6 : 1 }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => model !== null && setCameraVisible(true)}
          >
            {model === null ? (
              <View style={styles.row}>
                <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Loading Model</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Open Camera</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {detections.length > 0 && (
        <Text>Detected: {JSON.stringify(detections)}</Text>
      )}
    </SafeAreaView>
  );
}

const styles: StyleSheet.NamedStyles<any> = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ababab",
  },
  row: {
    flexDirection: "row",
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
    fontWeight: "600",
  },
  buttonIcon: {
    color: "#000000",
    fontSize: 26,
    fontWeight: "600",
  },
  captureButton: {
    height: 60,
    width: 60,
    backgroundColor: "#ffffff",
    borderColor: "#000000",
    borderWidth: 4,
    // outlineColor: "#f0f0f0",
    // outlineWidth: 3,
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
