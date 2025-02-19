Object Detector (React Native)
-------------------------------

A **React Native** app, it detects objects from the images on _Android_, either taken by **camera** or picked from the **gallery**.

After detection is successful, it shows the list of detected objects alongwith their probabilities.

Object Detection happens with **TensorFlow**'s `mobilenet` ML model (the packages involved are [@tensorflow/tfjs-react-native](https://www.npmjs.com/package/@tensorflow/tfjs-react-native) and [@tensorflow-models/mobilenet](https://www.npmjs.com/package/@tensorflow-models/mobilenet)).

Built with **React Native CLI**.

## Steps to run

```bash
# Install Packages
$ yarn

# Start Metro
$ yarn start --reset-cache

# Run on Android (only Android is configured in this project).
$ yarn android
```

Tested on Xiaomi Redmi Note 10S.

Made By: [Ahsan Akhtar](https://www.linkedin.com/in/m-ahsan-akhtar)