import React from "react";
import { useState } from "react";
import { View } from "react-native";
import { Camera, CameraType } from "expo-camera";
import { GLView } from "expo-gl";
import Expo2DContext from "expo-2d-context";
import * as tf from "@tensorflow/tfjs";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { preprocess } from "../utils/preprocess";
import { renderBoxes } from "../utils/renderBox";
import Canvas from "react-native-canvas";

const TensorCamera = cameraWithTensors(Camera);

const CameraView = ({ type, model, inputTensorSize, config, children }) => {
  const [ctx, setCTX] = useState(null);
  const typesMapper = { back: "back", front: "front" };

  const cameraStream = (images) => {
    const detectFrame = async () => {
      tf.engine().startScope();
      const [input, xRatio, yRatio] = preprocess(
        images.next().value,
        inputTensorSize[2],
        inputTensorSize[1]
      );

      console.log("ahsan", images);

      await model.executeAsync(input).then((res) => {
        const [boxes, scores, classes] = res.slice(0, 3);
        const boxes_data = boxes.dataSync();
        const scores_data = scores.dataSync();
        const classes_data = classes.dataSync();

        renderBoxes(
          ctx,
          config.threshold,
          boxes_data,
          scores_data,
          classes_data,
          [xRatio, yRatio]
        );
        tf.dispose([res, input]);
      });

      requestAnimationFrame(detectFrame); // get another frame
      tf.engine().endScope();
    };

    console.log("asdasd", ctx);

    detectFrame();
  };

  console.log("ctxx", ctx);

  const handleCanvas = (canvas) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    // ctx.fillStyle = "purple";
    // ctx.fillRect(0, 0, 100, 100);
    setCTX(ctx);
  };

  return (
    <View style={{ backgroundColor: "red", flex: 1 }}>
      {ctx && (
        <TensorCamera
          // Standard Camera props
          // className="w-full h-full z-0"
          style={{ flex: 1, zIndex: 10000 }}
          type={typesMapper[type]}
          // Tensor related props
          //use_custom_shaders_to_resize={true}
          resizeHeight={inputTensorSize[1]}
          resizeWidth={inputTensorSize[2]}
          resizeDepth={inputTensorSize[3]}
          onReady={cameraStream}
          autorender={true}
        />
      )}
      <View>
        {/* <GLView
          className="w-full h-full "
          onContextCreate={async (gl) => {
            console.log("yes1")
            const ctx2d = new Expo2DContext(gl);
            console.log("yes2")
            await ctx2d.initializeText();
            console.log("yes3")
            setCTX(ctx2d);
          }}
        /> */}
        <Canvas ref={handleCanvas} />
      </View>
      {children}
    </View>
  );
};

export default CameraView;
