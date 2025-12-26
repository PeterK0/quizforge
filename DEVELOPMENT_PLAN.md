# QuizForge Development Plan

## ✅ Completed: Phases 1, 2, 3, 5, and 6

### Phase 1: Foundation ✅
- [x] Project scaffolding (Tauri 2.x + React + TypeScript + Tailwind CSS)
- [x] Database setup (SQLite with rusqlite)
- [x] Schema implementation (10 tables for all entities)
- [x] Auto-initialization on app startup
- [x] Basic UI structure and routing
- [x] TypeScript type definitions (all 9 question types)

### Phase 2: Subject & Topic Management ✅
- [x] **Backend (Rust)**:
  - `get_subjects()`, `get_subject()`, `create_subject()`, `update_subject()`, `delete_subject()`
  - `get_topics()`, `get_topic()`, `create_topic()`, `update_topic()`, `delete_topic()`
  - Proper State management with `State<DbConnection>`

- [x] **Frontend (React)**:
  - `useSubjects()` and `useTopics()` hooks
  - SubjectCard, SubjectGrid, SubjectModal components
  - TopicItem, TopicList, TopicModal components
  - SubjectPage and TopicPage with full CRUD
  - Reusable UI components (Button, Modal, Input, ColorPicker, IconPicker)
  - Layout components (Sidebar, Header, MainLayout)

- [x] **Routing**:
  - `/` - Home page
  - `/subjects` - Subject list/grid
  - `/subjects/:subjectId/topics` - Topic list for subject

---

## ✅ Phase 3: Question Bank (Basic Types) - COMPLETE

### Implemented Features

### Overview
Implement the question bank with 3 basic question types: Single Choice, Multiple Choice, and Fill Blank.

### Backend Tasks

#### 1. Create Question Commands (`src-tauri/src/commands/questions.rs`)

```rust
use tauri::State;
use crate::db::DbConnection;

// Commands to implement:
#[tauri::command]
pub fn get_questions(db: State<DbConnection>, topic_id: i64) -> Result<Vec<Question>, String>

#[tauri::command]
pub fn get_question(db: State<DbConnection>, id: i64) -> Result<Question, String>

#[tauri::command]
pub fn create_question(db: State<DbConnection>, data: CreateQuestionData) -> Result<Question, String>

#[tauri::command]
pub fn update_question(db: State<DbConnection>, id: i64, data: UpdateQuestionData) -> Result<Question, String>

#[tauri::command]
pub fn delete_question(db: State<DbConnection>, id: i64) -> Result<(), String>

#[tauri::command]
pub fn get_question_options(db: State<DbConnection>, question_id: i64) -> Result<Vec<QuestionOption>, String>

#[tauri::command]
pub fn get_question_blanks(db: State<DbConnection>, question_id: i64) -> Result<Vec<QuestionBlank>, String>
```

**Key Implementation Notes**:
- When creating/updating questions, you'll need to:
  1. Insert/update the base question record
  2. Handle related records (options, blanks) in separate transactions
  3. For options: delete old ones and insert new ones
  4. Return the complete question with all related data

#### 2. Register Commands in `lib.rs`

Add to `invoke_handler`:
```rust
get_questions,
get_question,
create_question,
update_question,
delete_question,
```

### Frontend Tasks

#### 1. Create Question Hook (`src/hooks/useQuestions.ts`)

```typescript
export function useQuestions(topicId?: number) {
  // Similar pattern to useSubjects/useTopics
  // State: questions, loading, error
  // Methods: fetchQuestions, createQuestion, updateQuestion, deleteQuestion
}
```

#### 2. Create Question List Components

**File**: `src/components/questions/QuestionList.tsx`
- Display questions filtered by topic
- Show question type badge
- Show difficulty badge
- Edit/Delete buttons

**File**: `src/components/questions/QuestionFilters.tsx`
- Filter by question type
- Filter by difficulty
- Filter by source
- Search by text

#### 3. Create Question Editor Component

**File**: `src/components/questions/QuestionEditor.tsx`
- Question type selector (dropdown)
- Dynamically render appropriate editor based on type
- Common fields: question text, difficulty, points, source, explanation

#### 4. Create Type-Specific Editors

**File**: `src/components/questions/editors/SingleChoiceEditor.tsx`
```typescript
interface SingleChoiceEditorProps {
  value: SingleChoiceQuestionData;
  onChange: (data: SingleChoiceQuestionData) => void;
}
```
- Question text input
- Add/remove options (min 2, typical 4-5)
- Mark correct answer (radio button)
- Image upload for question (optional)

**File**: `src/components/questions/editors/MultipleChoiceEditor.tsx`
- Similar to SingleChoiceEditor
- Multiple correct answers (checkboxes)
- Validation: at least one must be correct

**File**: `src/components/questions/editors/FillBlankEditor.tsx`
- Question text with blank markers: `____` or `[BLANK]`
- Detect blanks automatically or manually add
- For each blank:
  - Correct answer
  - Acceptable alternatives (array)
  - Is numeric (checkbox)
  - Tolerance (if numeric)
  - Unit (optional)

#### 5. Create Question Modal

**File**: `src/components/questions/QuestionModal.tsx`
- Create/Edit modal for questions
- Question type selector at top (disabled when editing)
- Render appropriate editor component
- Validation before save

#### 6. Create QuestionBank Page

**File**: `src/pages/QuestionBankPage.tsx`
- Route: `/subjects/:subjectId/topics/:topicId/questions`
- Breadcrumbs: Home > Subjects > [Subject] > [Topic] > Questions
- Action button: "New Question"
- QuestionFilters component
- QuestionList component
- QuestionModal for create/edit

#### 7. Update Routing

**File**: `src/App.tsx`
```typescript
<Route path="/subjects/:subjectId/topics/:topicId/questions" element={<QuestionBankPage />} />
```

#### 8. Update TopicPage Navigation

In `src/pages/TopicPage.tsx`, update `handleTopicClick`:
```typescript
const handleTopicClick = (topic: Topic) => {
  navigate(`/subjects/${subjectId}/topics/${topic.id}/questions`);
};
```

### Implementation Order

1. **Backend First**:
   - Create `commands/questions.rs` with all question CRUD operations
   - Test with basic inserts/queries
   - Handle question options and blanks

2. **Frontend Hook**:
   - Create `useQuestions` hook
   - Test fetching and creating questions

3. **UI Components (Bottom-Up)**:
   - Create editors: SingleChoiceEditor, MultipleChoiceEditor, FillBlankEditor
   - Create QuestionEditor wrapper
   - Create QuestionList
   - Create QuestionFilters
   - Create QuestionModal
   - Create QuestionBankPage

4. **Integration**:
   - Add routing
   - Connect TopicPage navigation
   - Test full CRUD flow

### Validation Rules

**Single/Multiple Choice**:
- Minimum 2 options required
- At least 1 correct answer required
- All option texts must be non-empty

**Fill Blank**:
- Question text must contain blanks
- Each blank must have a correct answer
- If numeric: tolerance required
- Acceptable answers should be trimmed and lowercased for comparison

### Database Query Patterns

**Get Question with Related Data**:
```sql
-- Get base question
SELECT * FROM questions WHERE id = ?

-- Get options (if SINGLE_CHOICE or MULTIPLE_CHOICE)
SELECT * FROM question_options WHERE question_id = ? ORDER BY display_order

-- Get blanks (if FILL_BLANK)
SELECT * FROM question_blanks WHERE question_id = ? ORDER BY blank_index
```

**Create Question with Options**:
```rust
// 1. Insert question
let question_id = /* insert and get last_insert_rowid() */;

// 2. Insert options in loop
for option in options {
    conn.execute(
        "INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES (?, ?, ?, ?)",
        [question_id, option.text, option.is_correct, option.order]
    )?;
}
```

**Backend**:
- ✅ Complete CRUD operations for questions (`commands/questions.rs`)
- ✅ Support for 3 question types: Single Choice, Multiple Choice, Fill Blank
- ✅ Handles question options and blanks with proper CASCADE deletes

**Frontend**:
- ✅ `useQuestions` hook with full CRUD
- ✅ Question editors for all 3 basic types
- ✅ QuestionBankPage with filtering by type and difficulty
- ✅ Question modal for create/edit
- ✅ Full validation and error handling

---

## ⏭️ Phase 4: Question Bank (Advanced Types) - SKIPPED (To be implemented)

### Question Types to Implement
1. **Numeric Input** - Calculations with tolerance
2. **Matching** - Match left items to right items
3. **Ordering** - Put items in correct sequence
4. **Image Identification** - Identify from image
5. **Calculation** - Multi-step calculations
6. **Fill Blank Multiple** - Fill blanks with dropdown options

### Tasks (Same Pattern as Phase 3)
- Create editors for each type
- Create renderers for each type (for taking quizzes)
- Update database commands to handle additional tables:
  - `question_matches`
  - `question_order_items`

**Note**: User chose to skip Phase 4 initially and proceed to Phase 5. Phase 4 will be implemented next.

---

## ✅ Phase 5: Quiz System - COMPLETE

### Backend Tasks

#### Commands (`src-tauri/src/commands/quizzes.rs`)
```rust
#[tauri::command]
pub fn get_quizzes(db: State<DbConnection>, topic_id: i64) -> Result<Vec<Quiz>, String>

#[tauri::command]
pub fn create_quiz(db: State<DbConnection>, data: CreateQuizData) -> Result<Quiz, String>

#[tauri::command]
pub fn generate_quiz_questions(db: State<DbConnection>, quiz_id: i64) -> Result<Vec<Question>, String>
// This selects random questions from the topic's question bank

#[tauri::command]
pub fn start_quiz_attempt(db: State<DbConnection>, quiz_id: i64) -> Result<QuizAttempt, String>

#[tauri::command]
pub fn submit_response(db: State<DbConnection>, attempt_id: i64, question_id: i64, response_data: String) -> Result<ResponseResult, String>

#[tauri::command]
pub fn complete_attempt(db: State<DbConnection>, attempt_id: i64) -> Result<AttemptResult, String>
```

### Frontend Tasks

#### 1. Quiz Configuration Components
- `QuizConfig.tsx` - Form to create quiz
  - Select topic
  - Number of questions
  - Time limit (optional)
  - Shuffle options
  - Answer reveal timing

#### 2. Quiz Taking Components
- `QuizTaker.tsx` - Main quiz interface
  - Timer component (if enabled)
  - Question display (render by type)
  - Navigation sidebar
  - Progress indicator
  - Submit confirmation

#### 3. Question Renderers (for quiz taking)
- `SingleChoiceRenderer.tsx`
- `MultipleChoiceRenderer.tsx`
- `FillBlankRenderer.tsx`
- etc.

#### 4. Quiz Results
- `QuizResults.tsx`
  - Score summary
  - Per-question review
  - Show correct answers (based on settings)
  - Explanation display

### Answer Validation Logic

Create `src/utils/answerCheckers.ts`:
```typescript
export function checkSingleChoice(userAnswer: number, correctAnswer: number): boolean
export function checkMultipleChoice(userAnswers: number[], correctAnswers: number[]): boolean
export function checkFillBlank(userAnswer: string, correctAnswer: string, alternatives?: string[]): boolean
export function checkNumeric(userAnswer: number, correctAnswer: number, tolerance: number): boolean
// etc.
```

**Backend** (`commands/quizzes.rs`):
- ✅ Full quiz CRUD operations
- ✅ Quiz configuration (time limits, shuffling, answer reveal settings)
- ✅ Quiz attempt tracking with `save_quiz_attempt`
- ✅ Quiz history with `get_all_quiz_attempts`

**Frontend**:
- ✅ Quiz creation and configuration (`QuizModal.tsx`)
- ✅ Quiz taking interface with timer (`QuizTakingPage.tsx`)
- ✅ Question/option shuffling
- ✅ Answer grading for all 3 basic question types
- ✅ Results page with detailed breakdown (`QuizResultsPage.tsx`)
- ✅ Quiz attempts saved to database
- ✅ Start time tracking for accurate timing

**Features**:
- Timer with auto-submit on timeout
- Progress indicator
- Question navigation
- Comprehensive results display
- Pass/fail determination

---

## ✅ Phase 6: Analytics & Polish - COMPLETE

### Analytics Dashboard
- Recent quiz attempts
- Score trends over time (chart)
- Topic performance breakdown
- Most missed questions
- Average scores by difficulty

### Components
- `AnalyticsPage.tsx`
- `PerformanceChart.tsx` (use a charting library like recharts)
- `MissedQuestions.tsx`

### Backend Queries
```rust
#[tauri::command]
pub fn get_topic_stats(db: State<DbConnection>, topic_id: i64) -> Result<TopicStats, String>

#[tauri::command]
pub fn get_attempt_history(db: State<DbConnection>, quiz_id: Option<i64>) -> Result<Vec<QuizAttempt>, String>

#[tauri::command]
pub fn get_missed_questions(db: State<DbConnection>, subject_id: i64, limit: i32) -> Result<Vec<Question>, String>
```

### Polish Tasks
- Error handling improvements
- Loading states
- Empty states
- Confirmation dialogs
- Toast notifications
- Keyboard shortcuts
- Export quiz results (CSV/PDF)

---

## 🏗️ Architecture Patterns Established

### Backend Pattern (Rust)
```rust
use tauri::State;
use crate::db::DbConnection;

#[tauri::command]
pub fn command_name(db: State<DbConnection>, params: Type) -> Result<ReturnType, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Execute queries

    Ok(result)
}
```

### Frontend Hook Pattern
```typescript
export function useEntity(filterId?: number) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const results = await invoke<Entity[]>('get_entities', { filterId });
      setEntities(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [filterId]);

  return { entities, loading, error, fetchEntities, /* CRUD methods */ };
}
```

### Component Pattern
```typescript
interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  entity?: Entity | null;
}
```

---

## 📁 Current File Structure

```
quizforge/
├── src/                                 # React frontend
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             ✅
│   │   │   ├── Header.tsx              ✅
│   │   │   └── MainLayout.tsx          ✅
│   │   ├── subjects/
│   │   │   ├── SubjectCard.tsx         ✅
│   │   │   ├── SubjectGrid.tsx         ✅
│   │   │   └── SubjectModal.tsx        ✅
│   │   ├── topics/
│   │   │   ├── TopicItem.tsx           ✅
│   │   │   ├── TopicList.tsx           ✅
│   │   │   └── TopicModal.tsx          ✅
│   │   ├── questions/                   🔜 NEXT
│   │   │   ├── QuestionList.tsx
│   │   │   ├── QuestionFilters.tsx
│   │   │   ├── QuestionEditor.tsx
│   │   │   ├── QuestionModal.tsx
│   │   │   ├── editors/
│   │   │   │   ├── SingleChoiceEditor.tsx
│   │   │   │   ├── MultipleChoiceEditor.tsx
│   │   │   │   └── FillBlankEditor.tsx
│   │   │   └── renderers/
│   │   │       ├── SingleChoiceRenderer.tsx
│   │   │       ├── MultipleChoiceRenderer.tsx
│   │   │       └── FillBlankRenderer.tsx
│   │   ├── quizzes/
│   │   │   ├── QuizList.tsx
│   │   │   ├── QuizConfig.tsx
│   │   │   ├── QuizTaker.tsx
│   │   │   └── QuizResults.tsx
│   │   ├── analytics/
│   │   │   └── Dashboard.tsx
│   │   └── ui/
│   │       ├── Button.tsx              ✅
│   │       ├── Modal.tsx               ✅
│   │       ├── Input.tsx               ✅
│   │       ├── ColorPicker.tsx         ✅
│   │       └── IconPicker.tsx          ✅
│   ├── pages/
│   │   ├── Home.tsx                    ✅
│   │   ├── SubjectPage.tsx             ✅
│   │   ├── TopicPage.tsx               ✅
│   │   ├── QuestionBankPage.tsx        🔜 NEXT
│   │   ├── QuizPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── hooks/
│   │   ├── useSubjects.ts              ✅
│   │   ├── useTopics.ts                ✅
│   │   ├── useQuestions.ts             🔜 NEXT
│   │   ├── useQuizzes.ts
│   │   └── useAttempts.ts
│   ├── types/                          ✅ ALL DEFINED
│   │   ├── subject.ts
│   │   ├── topic.ts
│   │   ├── question.ts
│   │   ├── quiz.ts
│   │   └── attempt.ts
│   ├── utils/
│   │   ├── answerCheckers.ts
│   │   └── formatters.ts
│   ├── App.tsx                         ✅
│   └── index.css                       ✅
├── src-tauri/                          # Rust backend
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs                  ✅
│   │   │   ├── subjects.rs             ✅
│   │   │   ├── topics.rs               ✅
│   │   │   ├── questions.rs            🔜 NEXT
│   │   │   ├── quizzes.rs
│   │   │   └── attempts.rs
│   │   ├── db/
│   │   │   ├── mod.rs                  ✅
│   │   │   ├── models.rs               ✅
│   │   │   └── schema.sql              ✅
│   │   ├── lib.rs                      ✅
│   │   └── main.rs                     ✅
│   └── Cargo.toml                      ✅
└── README.md                           ✅
```

---

## 🎯 Immediate Next Steps (Start Here)

1. **Create `src-tauri/src/commands/questions.rs`**
   - Copy pattern from `subjects.rs`
   - Implement `get_questions`, `create_question`, `update_question`, `delete_question`
   - Handle question options and blanks

2. **Register question commands in `lib.rs`**
   - Add to invoke_handler

3. **Create `src/hooks/useQuestions.ts`**
   - Copy pattern from `useSubjects.ts`
   - Update invoke calls for question commands

4. **Create editors (one at a time)**:
   - Start with `SingleChoiceEditor.tsx` (simplest)
   - Then `MultipleChoiceEditor.tsx`
   - Then `FillBlankEditor.tsx`

5. **Create `QuestionBankPage.tsx`**
   - Implement full CRUD workflow
   - Add routing

6. **Test thoroughly** before moving to Phase 4

---

## 💡 Important Notes

### Database Considerations
- SQLite is being used (not MySQL as originally specified)
- Database is auto-initialized on app startup
- Schema is already complete with all 10 tables
- Foreign key constraints are enabled

### State Management
- Using Zustand in frontend (installed but not yet used for global state)
- Currently using React hooks for data fetching
- Consider Zustand for:
  - Current quiz attempt state
  - User preferences
  - Filter states across pages

### Testing Strategy
- Test each question type thoroughly
- Test answer validation logic carefully (especially numeric with tolerance)
- Test quiz generation randomization
- Test timer functionality

### Performance Optimizations (Phase 6)
- Lazy load question renderers
- Virtualize long question lists
- Cache quiz questions in memory during attempt
- Debounce search/filter inputs

### Future Enhancements (Post-MVP)
- Question import/export (CSV, JSON)
- Question tags/categories
- Study mode (practice without scoring)
- Spaced repetition algorithm
- Multi-user support
- Cloud sync
- Print quiz to PDF

---

## 🔧 Development Commands

```bash
# Run development server
npm run tauri dev

# Build for production
npm run tauri build

# Run frontend only (for UI development)
npm run dev

# Build Rust only
cargo build --manifest-path=src-tauri/Cargo.toml

# Database location
# macOS: ~/Library/Application Support/com.quizforge.dev/quizforge.db
# Can inspect with: sqlite3 ~/Library/Application\ Support/com.quizforge.dev/quizforge.db
```

---

## ✅ Success Criteria

### Phase 3 Complete When:
- [ ] Can create all 3 basic question types (Single Choice, Multiple Choice, Fill Blank)
- [ ] Can view list of questions filtered by topic
- [ ] Can edit existing questions
- [ ] Can delete questions
- [ ] Question data persists correctly in database
- [ ] All related data (options, blanks) saves/loads correctly

### Phase 4 Complete When:
- [ ] All 9 question types are supported
- [ ] Advanced editors work smoothly
- [ ] Image upload for questions works

### Phase 5 Complete When:
- [ ] Can create and configure quizzes
- [ ] Can take a quiz with all question types
- [ ] Answer validation works correctly for all types
- [ ] Quiz results show accurate scores
- [ ] Quiz attempts are saved to database

### Phase 6 Complete When:
- [ ] Analytics dashboard shows meaningful data
- [ ] Performance is optimized
- [ ] All edge cases handled
- [ ] Error messages are user-friendly
- [ ] App is polished and production-ready

**Implemented Features**:

### Analytics Dashboard ✅
- ✅ Performance trend chart (line chart showing last 10 attempts)
- ✅ Topic performance breakdown (bar chart + detailed stats)
- ✅ Statistics overview (total attempts, avg score, pass rate, avg time)
- ✅ Performance trend indicator (up/down/neutral)
- ✅ Complete quiz attempt history

### Backend Commands ✅
- ✅ `get_all_quiz_attempts` - Fetch all quiz attempts with related data
- ✅ `get_topic_performance` - Performance breakdown by topic
- ✅ `save_quiz_attempt` - Save attempts to database

### Export Functionality ✅
- ✅ Export quiz results as text file
- ✅ Includes full question breakdown
- ✅ Shows correct answers and explanations

### Polish ✅
- ✅ Fixed deletion operations (foreign keys enabled per connection)
- ✅ Confirmation dialogs (subjects and quizzes only)
- ✅ Fixed duplicate quiz attempt records
- ✅ Proper error handling and loading states
- ✅ Empty states for all pages
- ✅ Scrollable modals
- ✅ Improved navigation with back buttons

**Outstanding Polish Tasks** (optional enhancements):
- Toast notifications
- Keyboard shortcuts
- Most missed questions feature
- CSV export (currently text export only)

---

## 🚀 Next: Phase 4 - Question Bank (Advanced Types)

We're now circling back to implement the 6 advanced question types that were skipped:

1. **Numeric Input** - Calculations with tolerance
2. **Matching** - Match left items to right items
3. **Ordering** - Put items in correct sequence
4. **Image Identification** - Identify from image
5. **Calculation** - Multi-step calculations
6. **Fill Blank Multiple** - Fill blanks with dropdown options

---

**Last Updated**: Phase 6 Complete - Ready to implement Phase 4 (Advanced Question Types)
**Database**: SQLite, auto-initialized, 10 tables ready
**Architecture**: Full-stack application with analytics
**Current Status**: Phases 1, 2, 3, 5, and 6 complete
**Next**: Implement advanced question types (Phase 4)
