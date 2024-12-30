# Teeter Totter Game

An interactive balancing game where objects fall onto a teeter-totter, built with Vue 3, TypeScript, and Pinia.

## 🎮 Demo

[Demo link - to be added]

![Game screenshot - to be added]

## 🚀 Features

- Dynamic falling objects with different shapes and weights
- Physics-based teeter-totter balancing system
- Progressive difficulty levels
- Scoring system with bonuses
- Visual effects (confetti, fireworks)
- Responsive interface
- Auto-play mode
- High score system

## 🛠️ Technologies

- Vue 3.5.13
- TypeScript
- Pinia 2.2.6
- Vite 6.0.1
- SCSS/CSS Modules

## 📦 Installation

1. Clone the repository:

$
git clone [REPOSITORY_URL]
$

2. Navigate to the project directory:

$
cd teeter-totter-game
$

3. Install dependencies:

$
npm install
$

4. Run the development server:

$
npm run dev
$

## 🎯 How to Play

1. Click "Start" to begin the game
2. Use arrow keys to control:
   - ← → to move objects
   - ↓ to speed up falling
3. Space - pause
4. R - reset game

## 🏗️ Project Architecture

$
src/
├── components/          # Vue components
│   ├── atoms/          # Basic components (Shape, Button)
│   ├── molecules/      # Composite components (Timer, ControlPanel)
│   └── organisms/      # Main components (GameBoard, TeeterTotter)
├── stores/             # Pinia stores
├── helpers/            # Helper functions
├── constants/          # Constants and configuration
└── types/              # TypeScript definitions
$

### Key Components

#### GameBoard
- Main game component
- Manages game logic and state
- Handles user interactions
- Renders objects and teeter-totter

#### TeeterTotter
- Renders the teeter-totter
- Handles tilt animations
- Displays positioning grid

#### Shape
- Renders falling objects
- Handles different shapes and sizes
- Fall and collision animations

### Physics System

- Moment force calculations
- Collision detection
- Gravity simulation
- Teeter-totter balancing

### Scoring System

- Base points for time
- Stability bonuses
- Object count bonuses
- Weight balance bonuses

### Game Phases

1. Phase 1 - Light (0-30 pts)
   - Light objects (1-2 kg)
2. Phase 2 - Medium (31-60 pts)
   - Medium objects (2-4 kg)
3. Phase 3 - Heavy (61-90 pts)
   - Heavy objects (3-6 kg)
4. Phase 4 - Expert (91+ pts)
   - Very heavy objects (4-8 kg)

## 🧪 Testing

Run unit tests:

$
npm run test:unit
$

## 🔧 Configuration

Main game parameters can be adjusted in `src/constants/gameConstants.ts`:
- Board dimensions
- Physics parameters
- Phase score thresholds
- Object weight ranges

## 📝 TODO

- [ ] Add sound effects
- [ ] Add multiplayer mode
- [ ] Add more shapes
- [ ] Add achievement system
- [ ] Add training mode

## 👥 Authors

- [Your Name] - Lead Developer

## 📄 License

This project is licensed under the [MIT License](LICENSE).
