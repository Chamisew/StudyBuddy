import React, { useRef, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  SafeAreaView 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: 1,
    title: "Connect & Learn",
    text: "Find your perfect study partner and connect with expert tutors.",
    icon: "people-outline",
    colors: ["#1d4ed8", "#1e40af"]
  },
  {
    id: 2,
    title: "Interactive Learning",
    text: "Access quizzes, videos, and personalized study materials.",
    icon: "library-outline",
    colors: ["#1e40af", "#1e3a8a"]
  },
  {
    id: 3,
    title: "Track Progress",
    text: "Monitor your learning progress and achievements easily.",
    icon: "trophy-outline",
    colors: ["#1e3a8a", "#475569"]
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef(null);

  const nextSlide = () => {
    if (index < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      finishOnboarding();
    }
  };

  const skip = () => finishOnboarding();

  const finishOnboarding = async () => {
    await AsyncStorage.setItem("@onboarding_seen", "true");
    router.push("/signin");
  };

  const renderItem = ({ item }) => (
    <LinearGradient
      colors={item.colors}
      style={{
        width,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20
      }}
    >
      <Ionicons name={item.icon} size={80} color="#fff" />
      <Text style={{ fontSize: 28, color: "#fff", marginTop: 20, fontWeight: "700" }}>
        {item.title}
      </Text>
      <Text style={{ fontSize: 16, color: "#eee", textAlign: "center", marginTop: 10 }}>
        {item.text}
      </Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Skip Button */}
      <TouchableOpacity
        onPress={skip}
        style={{ position: "absolute", top: 40, right: 20, zIndex: 1 }}
      >
        <Text style={{ color: "#555", fontWeight: "600" }}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(newIndex);
        }}
      />

      {/* Pagination + Next */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
          gap: 10
        }}
      >
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? "#1d4ed8" : "#ccc"
            }}
          />
        ))}

        <TouchableOpacity
          onPress={nextSlide}
          style={{
            marginLeft: 20,
            backgroundColor: "#1d4ed8",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {index === slides.length - 1 ? "Continue" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
