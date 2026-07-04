import { Text, View } from "react-native";
import TempoHost from "./.tempo/tempo-host";

const isTempoHostRoute =
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/tempo-host");

export default function App() {
  if (isTempoHostRoute) {
    return <TempoHost />;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Tempo Expo sidecar</Text>
    </View>
  );
}
