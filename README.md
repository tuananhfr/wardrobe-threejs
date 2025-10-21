# Wardrobe-ThreeJS

A React + Three.js configurator for modular wardrobes — build and preview your custom wardrobe in real time.  
This project provides a responsive UI to configure wardrobe types, dimensions, internal equipment, shelves, textures, and preview the result in 3D with @react-three/fiber.

---

## Demo

[demo](https://wardrobe-threejs.vercel.app/)

## Tech Stack

- React 19 + TypeScript
- Vite for development and build
- Three.js + @react-three/fiber + @react-three/drei for 3D rendering
- Bootstrap 5 for responsive layout and UI components
- Context API for configuration state, undo/redo, and debounced updates
- ESLint + TypeScript for code quality

---

## Features

- Interactive wardrobe configuration:
  - Type, height, base bar, columns, shelves, doors/drawers, internal equipment
- Real-time 3D preview using Three.js
- Texture and LED color selection
- Undo/Redo with debounced inputs
- Responsive layout:
  - Desktop: split preview/config view
  - Mobile: stacked panels

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/tuananhfr/wardrobe-threejs.git
cd wardrobe-threejs

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

```
