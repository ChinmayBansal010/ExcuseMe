import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";

export function OrbitScene({ dark }: { dark: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const rotation = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true }));
    const bob = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    rotation.start(); bob.start();
    return () => { rotation.stop(); bob.stop(); };
  }, [spin, float]);
  if (Platform.OS !== "web") return null;
  const rotateY = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const counterRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-360deg"] });
  const tilt = spin.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "12deg"] });
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [5, -8] });
  const lime = dark ? "#c4e478" : "#6f8f36";
  const blue = dark ? "#8fb7e8" : "#315f9b";
  const purple = dark ? "#c0a5e8" : "#7450a4";
  const panel = dark ? "#171b20" : "#f1f3eb";
  const text = dark ? "#edf0e8" : "#22291f";
  const muted = dark ? "#a0a8b2" : "#6c7568";
  const tag = (label: string, color: string, style: any) => (
    <View style={[{ position: "absolute", paddingHorizontal: 9, paddingVertical: 7, backgroundColor: panel, borderWidth: 1, borderColor: color, borderRadius: 8, borderBottomWidth: 3 }, style]}>
      <Text style={{ color: text, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }}>{label}</Text>
    </View>
  );
  return (
    <View style={{ width: "100%", height: 250, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <View style={{ position: "absolute", width: 225, height: 225, borderRadius: 112, borderWidth: 1, borderColor: dark ? "#293039" : "#d9dfcf" }} />
      <View style={{ position: "absolute", width: 196, height: 196, borderRadius: 98, borderWidth: 1, borderColor: dark ? "#242c35" : "#e0e5d8", transform: [{ rotateX: "70deg" }, { rotateZ: "25deg" }] }} />
      <Animated.View style={{ width: 210, height: 210, alignItems: "center", justifyContent: "center", transform: [{ translateY }, { perspective: 700 }, { rotateY }, { rotateX: tilt }] }}>
        <View style={{ position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1.5, borderColor: blue, transform: [{ rotateX: "66deg" }, { rotateZ: "24deg" }] }} />
        <Animated.View style={{ position: "absolute", width: 166, height: 166, borderRadius: 83, borderWidth: 1.5, borderColor: purple, transform: [{ rotateX: "68deg" }, { rotateY: counterRotate }, { rotateZ: "-32deg" }] }} />
        <View style={{ position: "absolute", width: 136, height: 136, borderRadius: 68, borderWidth: 1, borderColor: blue, opacity: 0.55, transform: [{ rotateY: "68deg" }] }} />
        <View style={{ width: 108, height: 108, borderRadius: 29, backgroundColor: lime, borderWidth: 1, borderColor: dark ? "#e4f7ae" : "#50682b", alignItems: "center", justifyContent: "center", transform: [{ rotateZ: "45deg" }], shadowColor: lime, shadowOffset: { width: 0, height: 9 }, shadowOpacity: dark ? 0.34 : 0.2, shadowRadius: 20, elevation: 12 }}>
          <View style={{ width: 69, height: 69, borderRadius: 20, backgroundColor: panel, borderWidth: 1, borderColor: dark ? "#343d43" : "#d5dccb", transform: [{ rotateZ: "-12deg" }], alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: lime, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: panel }} />
            </View>
          </View>
        </View>
        <View style={{ position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: purple, top: 16, right: 23, borderWidth: 2, borderColor: panel }} />
        <View style={{ position: "absolute", width: 9, height: 9, borderRadius: 5, backgroundColor: blue, bottom: 21, left: 16, borderWidth: 1, borderColor: panel }} />
      </Animated.View>
      {tag("HEDGING", purple, { top: 27, left: 15 })}
      {tag("CAUSE", blue, { bottom: 30, left: 23 })}
      {tag("COMMITMENT", lime, { top: 47, right: 10 })}
      <Text style={{ position: "absolute", bottom: 9, right: 13, color: muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.5 }}>LINGUISTIC SIGNALS / 01</Text>
    </View>
  );
}
