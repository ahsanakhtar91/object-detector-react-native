import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { Camera, CameraType } from "react-native-camera-kit";

const TensorCamera = cameraWithTensors(Camera);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === "dark";

  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={{ height: 600, width: 400 }}>
        <TensorCamera
          // Standard Camera props
          style={{ zIndex: 10000 }}
          // type={CameraType.Front}
          // Tensor related props
          cameraTextureHeight={1000}
          cameraTextureWidth={800}
          resizeHeight={200}
          resizeWidth={152}
          resizeDepth={3}
          onReady={() => console.log("yes")}
          autorender={true}
          useCustomShadersToResize={false}
        />
        {/* <Camera
          // ref={(ref) => (this.camera = ref)}
          cameraType={CameraType.Front} // front/back(default)
          flashMode="off"
        /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

export default App;
