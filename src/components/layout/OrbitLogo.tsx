"use client";
import React from "react";

interface OrbitLogoProps {
  variant?: "icon" | "full" | "horizontal";
  size?: number;
  padding?: boolean;
}

export default function OrbitLogo({ variant = "full", size = 28, padding = false }: OrbitLogoProps) {
  // Renders the transparent white logo optimized for the dark surface theme
  const src = variant === "icon" ? "/logo.png" : "/logo.png";
  
  if (variant === "icon") {
    return (
      <div 
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: padding ? `${size * 0.1}px` : "0",
          overflow: "hidden"
        }}
      >
        <img 
          src="/logo.png" 
          alt="Orbit" 
          width={size} 
          height={size} 
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </div>
    );
  }

  // Full / horizontal version: contains the emblem and stylized "orbit" brand text
  return (
    <div 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: size * 0.35,
        padding: padding ? "8px" : "0"
      }}
    >
      <div 
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
      >
        <img 
          src="/logo.png" 
          alt="Orbit Logo" 
          width={size} 
          height={size} 
          style={{ objectFit: "contain", width: "100%", height: "100%" }}
        />
      </div>
      <span 
        style={{ 
          fontWeight: 800, 
          fontSize: `${size * 0.65}px`, 
          letterSpacing: "-0.03em", 
          whiteSpace: "nowrap", 
          color: "var(--text-primary)",
          lineHeight: 1
        }}
      >
        Orbit
      </span>
    </div>
  );
}
