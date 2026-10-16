import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";

export function OrbitScene({ dark }: { dark: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotation = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true }));
    const bob = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    rotation.start();
    bob.start();
    return () => { rotation.stop(); bob.stop(); };
  }, [spin, float]);

  if (Platform.OS !== "web") return null;

  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const counterRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [5, -7] });
  const lime = dark ? "#c4e478" : "#6f8f36";
  const blue = dark ? "#8fb7e8" : "#315f9b";
  const purple = dark ? "#c0a5e8" : "#7450a4";
  const panel = dark ? "#171b20" : "#f1f3eb";

  return (
    <View style={{ width: "100%", height: 250, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Animated.View style={{ width: 210, height: 210, alignItems: "center", justifyContent: "center", transform: [{ translateY }, { perspective: 700 }, { rotateY }] }}>
        <View style={{ position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1.5, borderColor: blue, transform: [{ rotateX: "66deg" }, { rotateZ: "24deg" }] }} />
        <Animated.View style={{ position: "absolute", width: 174, height: 174, borderRadius: 87, borderWidth: 1.5, borderColor: purple, transform: [{ rotateX: "68deg" }, { rotateY: counterRotate }, { rotateZ: "-32deg" }] }} />
        <View style={{ position: "absolute", width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: blue, opacity: 0.45, transform: [{ rotateY: "68deg" }] }} />
        <View style={{ width: 112, height: 112, borderRadius: 34, backgroundColor: lime, borderWidth: 1, borderColor: dark ? "#e4f7ae" : "#50682b", alignItems: "center", justifyContent: "center", transform: [{ rotateZ: "45deg" }], shadowColor: lime, shadowOffset: { width: 0, height: 8 }, shadowOpacity: dark ? 0.3 : 0.18, shadowRadius: 22, elevation: 12 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: panel, opacity: 0.88, transform: [{ rotateZ: "-12deg" }], alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: lime, opacity: 0.9 }} />
          </View>
        </View>
        <View style={{ position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: purple, top: 20, right: 26, borderWidth: 2, borderColor: panel }} />
        <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: blue, bottom: 25, left: 18, borderWidth: 1, borderColor: panel }} />
      </Animated.View>
    </View>
  );
}
