import { Image, ImageStyle, StyleProp, StyleSheet, View } from "react-native";

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function AppLogo({ size = 88, style }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={require("../../assets/logo.png")}
        resizeMode="contain"
        style={[{ width: size, height: size }, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
