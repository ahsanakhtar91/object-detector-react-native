Object Detector (React Native)
-------------------------------

An example app in **React Native**, related to **AI** and **Machine Learning**. The features of this app are:

* It detects objects from the images on _Android_, either captured by **camera** (front/back) or picked from the **gallery** on the mobile device.
* After detection is successful, it shows a list of detected objects (up to 4) along with their probabilities.

Packages
--------
* Object Detection happens with **TensorFlow**'s `mobilenet_v2` ML model (using [@tensorflow/tfjs-react-native](https://www.npmjs.com/package/@tensorflow/tfjs-react-native) and [@tensorflow-models/mobilenet](https://www.npmjs.com/package/@tensorflow-models/mobilenet)).
* [react-native-camera-kit](https://www.npmjs.com/package/react-native-camera-kit) is used for capturing images with camera (front/back).
* [react-native-image-crop-picker](https://www.npmjs.com/package/react-native-image-crop-picker) is used for picking images from the gallery (can crop if needed).



**Built with**: `React Native CLI`

### Steps to run

```bash
# Install Packages
$ yarn

# Start Metro
$ yarn start --reset-cache

# Run on Android (only Android is configured in this project).
$ yarn android
```

**Tested on**: Xiaomi Redmi Note 10S

**Made By**: [Ahsan Akhtar](https://www.linkedin.com/in/m-ahsan-akhtar)