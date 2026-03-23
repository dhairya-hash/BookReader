#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Create a standalone offline Android application that reads PDF books with Kokoro TTS model using 
  onnxruntime-android for speech generation (q4 or int8 quantized). Features include advanced player 
  controls (play/pause, speed control, rewind, skip word/sentence, fast-forward), page-by-page PDF 
  loading, synchronized word-by-word text highlighting, and voice settings. Remember last cursor position.
  100% offline - no server dependency.

frontend:
  - task: "Book Library Screen"
    implemented: true
    working: "NA"
    file: "app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented book library with PDF import via document picker, displays books in cards with metadata, FAB button for adding books, settings button navigation. Uses zustand for state management and AsyncStorage for persistence."

  - task: "PDF Document Picker"
    implemented: true
    working: "NA"
    file: "app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented using expo-document-picker to select PDFs from device storage, copies PDF to permanent app storage directory, stores metadata in local state."

  - task: "PDF Reader Screen"
    implemented: true
    working: "NA"
    file: "app/reader.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created reader screen with page navigation controls (previous/next), page counter display, placeholder for PDF viewer (react-native-pdf removed to fix web build), web platform fallback message. Note: PDF rendering temporarily showing placeholder until native-only solution is integrated."

  - task: "Settings Screen"
    implemented: true
    working: "NA"
    file: "app/settings.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented settings with playback speed slider (0.5x-2.0x), auto-play toggle, highlight color picker, about section, TTS model status indicator. Settings persisted with AsyncStorage."

  - task: "Local State Management"
    implemented: true
    working: "NA"
    file: "store/bookStore.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created zustand store for book management with AsyncStorage persistence. Handles adding/removing books, updating reading progress (page & word position), loading saved books on app start."

  - task: "App Navigation"
    implemented: true
    working: "NA"
    file: "app/_layout.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Set up Expo Router with Stack navigation, configured screens for library (index), reader, and settings with consistent header styling."

backend:
  - task: "No backend needed"
    implemented: true
    working: true
    file: "N/A"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "This is a standalone offline app - no backend or server dependencies. All processing happens on device."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: true
  phase: "Phase 1 - Basic PDF Reader Infrastructure"

test_plan:
  current_focus:
    - "Book Library Screen"
    - "PDF Document Picker"
    - "App Navigation"
    - "Local State Management"
    - "Settings Screen"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"
  notes: |
    Phase 1 focuses on basic app structure and PDF import functionality.
    PDF rendering is temporarily showing placeholder (react-native-pdf caused web build issues).
    Next phases will integrate:
    - Phase 2: Kokoro TTS ONNX model integration
    - Phase 3: Audio player with advanced controls
    - Phase 4: Text extraction and synchronized highlighting
    - Phase 5: Full persistence and settings

agent_communication:
  - agent: "main"
    message: |
      Phase 1 implementation complete! Built the foundation:
      
      ✅ Book library with import functionality
      ✅ Navigation between screens  
      ✅ Settings page with TTS configuration options
      ✅ Local state management with persistence
      ✅ Android permissions configured in app.json
      
      Installed packages:
      - expo-document-picker (PDF selection)
      - expo-file-system (local file storage)
      - @react-native-async-storage/async-storage (data persistence)
      - zustand (state management)
      - @react-native-community/slider (speed control)
      
      Note: react-native-pdf temporarily removed from reader to fix web bundling.
      Will integrate native PDF rendering in next iteration.
      
      Ready for testing on mobile device!
