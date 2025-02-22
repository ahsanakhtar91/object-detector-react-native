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
// import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Camera, CameraApi, CameraType } from "react-native-camera-kit";
import { FileSystem } from "react-native-unimodules";
import RNFS from "react-native-fs";
import ImagePicker from "react-native-image-crop-picker";
import { modelURI as yolov5ModelURI } from "./modelHandler";
import { renderBoxes } from "./utils/renderBox";
// @ts-ignore
import Canvas from "react-native-canvas";
import { preprocess } from "./utils/preprocess";

function App(): React.JSX.Element {
  const cameraRef = useRef<CameraApi>(null);

  const [ctx, setCTX] = useState(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.Back);

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [detections, setDetections] = useState<
    {
      className: string;
      probability: number;
    }[]
  >([]);

  const [inputTensor, setInputTensor] = useState<number[] | undefined>([]);

  useEffect(() => {
    (async () => {
      await tf.ready();

      tf.loadGraphModel(yolov5ModelURI, {
        onProgress: (fractions) => {
          console.log(fractions);
        },
      })
        .then(async (loadedModel) => {
          console.log("loadedModel", loadedModel.modelSignature);
          const dummyInput = tf.ones(loadedModel.inputs[0].shape!);
          await loadedModel.executeAsync(dummyInput);
          tf.dispose(dummyInput);

          // set state
          setInputTensor(loadedModel.inputs[0].shape);
          setModel(loadedModel);
        })
        .catch((error) => {
          console.log("Error in loading model", error);
        });

      // mobilenet
      //   .load({ version: 2, alpha: 0.75 })
      //   .then((loadedModel) => {
      //     console.log("loadedModel", loadedModel);
      //     setModel(loadedModel);
      //   })
      //   .catch((error) => {
      //     console.log("Error in loading model", error);
      //   });
    })();
  }, []);

  const convertImageToTensor = async (uri: string, fromCamera: boolean) => {
    if (!inputTensor) return;

    let imageUri = "";
    if (fromCamera) {
      const urlComponents = uri.split("/");
      const fileNameAndExtension = urlComponents[urlComponents.length - 1];
      const destPath = `${RNFS.TemporaryDirectoryPath}/${fileNameAndExtension}`;
      await RNFS.copyFile(uri, destPath);
      imageUri = "file://" + destPath;
    } else {
      imageUri = uri;
    }

    console.log("fromCamera", fromCamera);
    console.log("1", imageUri);
    const imgB64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log("2");
    const imgBuffer = tf.util.encodeString(imgB64, "base64");
    console.log("3");
    const raw = Uint8Array.from(imgBuffer);
    console.log("4");
    // const imageTensor = tfRN.decodeJpeg(raw);
    const imageTensor = tf.browser
      .fromPixels({ data: raw, width: inputTensor[2], height: inputTensor[1] })
      .resizeNearestNeighbor([inputTensor[2], inputTensor[1]])
      // .expandDims()
      // .toFloat();

    console.log("imageTensor", imageTensor);

    return imageTensor;
  };

  const handleCapture = async (image: { uri: string }, fromCamera: boolean) => {
    setImageUri(image.uri);

    if (model && inputTensor) {
      const tensor = await convertImageToTensor(image.uri, fromCamera);

      if (!tensor) return;

      console.log("y");
      tf.engine().startScope();
      console.log("x");
      const [input, xRatio, yRatio] = preprocess(
        tensor,
        inputTensor[2],
        inputTensor[1]
      );
      console.log("z");

      if (!input) return;

      const detections = await model
        .executeAsync(input)
        .then(async (res: any) => {
          const [boxes, scores, classes] = res.slice(0, 3);
          const boxes_data = boxes.dataSync();
          const scores_data = scores.dataSync();
          const classes_data = classes.dataSync();

          console.log("***ahsan1:", boxes_data);
          console.log("***ahsan2:", scores_data);
          console.log("***ahsan3:", classes_data);
          // console.log("Detections_INNER:", res);

          const list = await renderBoxes(
            ctx,
            0.25, // config.threshold,
            boxes_data,
            scores_data,
            classes_data,
            [xRatio, yRatio]
          );
          tf.dispose([res, input]);

          console.log(list);
          setDetections([{ className: "s", probability: 2 }]);
        });
      console.log("Detections_OUTER:", detections);
      tf.engine().endScope();
      // if (detections && detections.length > 0) {
      //   setDetections(detections);
      // }
      // if (detections && detections.length > 0) {
      //   setDetections(detections);
      // }
    }
  };

  const handleCanvas = (canvas: any) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "purple";
    ctx.fillRect(
      0,
      0,
      100, // Dimensions.get("screen").width,
      100 // Dimensions.get("screen").height
    );
    setCTX(ctx);
  };

  console.log("Detections", detections, inputTensor);

  return (
    <SafeAreaView style={styles.root}>
      <Canvas ref={handleCanvas} style={{ flex: 1 }} />
      {cameraVisible ? (
        imageUri ? (
          <>
            <View style={{ opacity: detections.length === 0 ? 0.6 : 1 }}>
              <TouchableOpacity
                style={styles.button}
                disabled={detections.length === 0}
                onPress={() => {
                  if (detections.length !== 0) {
                    setImageUri(null);
                    setDetections([]);
                  }
                }}
              >
                {detections.length === 0 ? (
                  <View style={styles.row}>
                    <ActivityIndicator
                      color="white"
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.buttonText}>Detecting Objects</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Go Back</Text>
                )}
              </TouchableOpacity>
            </View>
            <Image source={{ uri: imageUri }} style={{ flex: 1 }} />
          </>
        ) : (
          <>
            {
              <Camera
                ref={cameraRef}
                style={{ flex: 1 }}
                cameraType={cameraType}
                flashMode="auto"
                // textureDims={}
              />
            }
            <TouchableOpacity
              style={styles.pickFromGalleryButton}
              onPress={() =>
                ImagePicker.openPicker({
                  width: 300,
                  height: 400,
                  cropping: true,
                  multiple: false,
                }).then((image) => {
                  if (!Array.isArray(image)) {
                    handleCapture({ uri: image.path }, false);
                  }
                })
              }
            >
              <Text style={{ ...styles.buttonIcon, fontSize: 18 }}>🖼️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={async () => {
                const image = await cameraRef.current?.capture();
                image?.uri && handleCapture(image, true);
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
              <Text style={{ ...styles.buttonIcon, fontSize: 26 }}>↻</Text>
            </TouchableOpacity>
          </>
        )
      ) : (
        <View style={{ opacity: model === null ? 0.6 : 1 }}>
          <TouchableOpacity
            style={styles.button}
            disabled={model === null}
            onPress={() => model !== null && setCameraVisible(true)}
          >
            {model === null ? (
              <View style={styles.row}>
                <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>
                  Loading TFJS Mobilenet Model
                </Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Open Camera</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      {detections.length > 0 && (
        <View style={styles.detectionsArea}>
          {detections.map(({ className, probability }, i) => (
            <View style={styles.detections} key={i}>
              <Text style={styles.detectionsLeft}>{className}</Text>
              <Text style={styles.detectionsRight}>{`${(
                probability * 100
              ).toFixed(3)}%`}</Text>
            </View>
          ))}
        </View>
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
    height: 70,
    width: 70,
    backgroundColor: "#ffffff",
    borderColor: "#555",
    borderWidth: 5,
    borderRadius: 35,
    position: "absolute",
    bottom: 40,
    left: Dimensions.get("window").width / 2 - 35,
  },
  flipTypeButton: {
    height: 40,
    width: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    borderRadius: 20,
    position: "absolute",
    bottom: 50,
    left: Dimensions.get("window").width / 2 + 80,
  },
  pickFromGalleryButton: {
    height: 40,
    width: 40,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    position: "absolute",
    bottom: 50,
    left: Dimensions.get("window").width / 2 - 120,
  },
  detectionsArea: {
    backgroundColor: "#333333",
    borderColor: "#7359be",
    borderWidth: 2,
  },
  detections: {
    flexDirection: "row",
    borderColor: "#7359be",
    borderBottomWidth: 2,
    paddingHorizontal: 6,
  },
  detectionsLeft: {
    flex: 1,
    color: "#7359be",
    fontWeight: "bold",
  },
  detectionsRight: {
    color: "#7359be",
    fontWeight: "bold",
  },
});

export default App;
