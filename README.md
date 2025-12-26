# QuizForge

Academic Quiz Management System built with Tauri + React + TypeScript

## Overview

QuizForge is a desktop application for creating, managing, and taking academic quizzes. It features a hierarchical structure of **Subject → Topic → Quiz** with a centralized question bank that supports 9 different question types.

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Tauri 2.x (Rust)
- **Database**: SQLite (via tauri-plugin-sql)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Routing**: React Router

## Features

### Question Types Supported
1. Single Choice (MCQ with one correct answer)
2. Multiple Choice (MCQ with multiple correct answers)
3. Fill in the Blank (text/numeric input)
4. Fill in the Blank - Multiple (dropdown selections)
5. Numeric Input (calculations with tolerance)
6. Matching (pair items)
7. Ordering (sequence items)
8. Image Identification (identify from image)
9. Calculation (multi-step problems)

### Core Functionality
- Subject and topic management
- Centralized question bank
- Quiz generation from question bank
- Quiz taking with timer
- Answer validation and scoring
- Quiz attempt history
- Performance analytics

## Development Setup

### Prerequisites
- Node.js 18+
- Rust 1.70+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
quizforge/
├── src/                          # React frontend
│   ├── components/               # React components
│   │   ├── layout/              # Layout components
│   │   ├── subjects/            # Subject management
│   │   ├── topics/              # Topic management
│   │   ├── questions/           # Question editors & renderers
│   │   ├── quizzes/             # Quiz components
│   │   ├── analytics/           # Analytics dashboard
│   │   └── ui/                  # Reusable UI components
│   ├── pages/                   # Page components
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand stores
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri commands
│   │   ├── db/                 # Database logic
│   │   └── models/             # Rust data models
│   └── Cargo.toml
└── README.md
```

## Database

QuizForge uses SQLite as an embedded database. The schema is automatically initialized on first run.

### Tables
- `subjects` - Academic subjects
- `topics` - Topics within subjects
- `questions` - Question bank
- `question_options` - Answer options for choice questions
- `question_blanks` - Fill-in-the-blank answers
- `question_matches` - Matching pairs
- `question_order_items` - Ordering sequences
- `quizzes` - Quiz configurations
- `quiz_attempts` - Quiz attempt history
- `attempt_responses` - Individual question responses

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project scaffolding
- [x] Database setup
- [x] Basic UI structure
- [x] Type definitions

### Phase 2: Subject & Topic CRUD
- [ ] Subject CRUD operations
- [ ] Topic CRUD operations
- [ ] Navigation between subjects/topics

### Phase 3: Question Bank - Basic Types
- [ ] Question list with filters
- [ ] Single choice editor/renderer
- [ ] Multiple choice editor/renderer
- [ ] Fill blank editor/renderer

### Phase 4: Question Bank - Advanced Types
- [ ] Matching editor/renderer
- [ ] Ordering editor/renderer
- [ ] Image identification editor/renderer
- [ ] Numeric/Calculation editor/renderer

### Phase 5: Quiz System
- [ ] Quiz CRUD operations
- [ ] Question selection from bank
- [ ] Quiz taking interface
- [ ] Answer validation
- [ ] Results display

### Phase 6: Polish & Analytics
- [ ] Quiz attempt history
- [ ] Analytics dashboard
- [ ] Performance optimizations
- [ ] Error handling & validation

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
