"use client";
import { useEffect, useState } from "react";

const words = ["education", "development", "networking"];
const colors = ["#FFC300", "#000814", "#003566"]; // rotating box colors

export default function AnimatedSubheading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="px-4 py-2 text-white font-bold rounded-md transition-all duration-700 animate-fade"
      style={{ backgroundColor: colors[index] }}
    >
      {words[index]}
    </span>
  );
}
