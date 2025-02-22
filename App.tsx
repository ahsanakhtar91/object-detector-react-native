import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera } from "expo-camera";
// import { StatusBar } from "expo-status-bar";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { modelURI } from "./modelHandler";
import CameraView from "./CameraView";

const App = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState("front");
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [inputTensor, setInputTensor] = useState<number[] | undefined>([]);

  // model configuration
  const configurations = { threshold: 0.25 };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      tf.ready().then(async () => {
        const yolov5 = await tf.loadGraphModel(modelURI, {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }); // load model

        // warming up model
        const dummyInput = tf.ones(yolov5.inputs[0].shape!);
        await yolov5.executeAsync(dummyInput);
        tf.dispose(dummyInput);

        // set state
        setInputTensor(yolov5.inputs[0].shape);
        setModel(yolov5);
        setLoading({ loading: false, progress: 1 });
      });
    })();
  }, []);

  console.log(hasPermission, loading)

  return (
    <SafeAreaView style={styles.root}>
      {hasPermission ? (
        <>
          {loading.loading ? (
            <Text>Loading model... {(loading.progress * 100).toFixed(2)}%</Text>
          ) : (
            <>
              {/* // <View> */}
                {/* <Camera
                  // ref={cameraRef}
                  style={{ flex: 1 }}
                  cameraType={CameraType.Front}
                  flashMode="auto"
                /> */}
                <CameraView
                  type={type}
                  model={model}
                  inputTensorSize={inputTensor}
                  config={configurations}
                >
                  <View
                  // className="absolute left-0 top-0 w-full h-full flex justify-end items-center bg-transparent z-20"
                  >
                    <TouchableOpacity
                      // className="flex flex-row items-center bg-transparent border-2 border-white p-3 mb-10 rounded-lg"
                      onPress={() =>
                        setType((current) =>
                          current === "back" ? "front" : "back"
                        )
                      }
                    >
                      {/* // { <MaterialCommunityIcons
                      //   className="mx-2"
                      //   name="camera-flip"
                      //   size={30}
                      //   color="white"
                      // />} */}
                      <Text
                      // className="mx-2 text-white text-lg font-semibold"
                      >
                        Flip Camera
                      </Text>
                    </TouchableOpacity>
                  </View>
                </CameraView>
              {/* // </View> */}
            </>
          )}
        </>
      ) : (
        <View>
          <Text>Permission not granted!</Text>
        </View>
      )}
      {/* <StatusBar style="auto" /> */}
    </SafeAreaView>
  );
};

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
