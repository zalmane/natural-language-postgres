# Chat Application Test Automation

This directory contains end-to-end tests for the recent chats functionality using Playwright.

## Test Coverage

The tests verify the following functionality:

### 1. Session Creation & Duplication Prevention
- ✅ Creates only one session when clicking "New Chat"
- ✅ Prevents duplicate session creation during rapid clicks
- ✅ Handles session initialization properly

### 2. Message Persistence
- ✅ Saves messages to localStorage for each session
- ✅ Loads correct messages when switching between chats
- ✅ Maintains message history across sessions

### 3. Chat Switching
- ✅ Switches between chats without losing data
- ✅ Handles rapid chat switching without errors
- ✅ Maintains proper chat order (newest first)

### 4. Sidebar Functionality
- ✅ Shows recent chats with proper titles and timestamps
- ✅ Clears all chats when requested
- ✅ Updates chat metadata when messages are sent

### 5. Error Handling
- ✅ Handles non-existent sessions gracefully
- ✅ No console errors during rapid operations
- ✅ Proper cleanup on component unmount

## Running Tests

### Prerequisites
```bash
npm install @playwright/test
npx playwright install
```

### Run All Tests
```bash
npm run test
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:headed
```

### Debug Tests
```bash
npm run test:debug
```

## Test Structure

### `chat-sessions.spec.ts`
Main test file containing all recent chats functionality tests:

1. **Session Creation Test**: Verifies no duplicate sessions are created
2. **Message Persistence Test**: Ensures messages are saved and loaded correctly
3. **Metadata Update Test**: Checks chat titles and metadata are updated
4. **Clear All Test**: Verifies chat clearing functionality
5. **Rapid Switching Test**: Tests performance under stress
6. **Chat Order Test**: Ensures proper chronological ordering

## Test Data Attributes

The tests use the following `data-testid` attributes:

- `new-chat-button`: New chat button in sidebar
- `clear-chats-button`: Clear all chats button
- `chat-item`: Individual chat items in sidebar
- `chat-title`: Chat title text
- `chat-input`: Message input field
- `send-button`: Send message button
- `message-content`: Message content display

## Debugging Failed Tests

1. **Screenshots**: Failed tests automatically capture screenshots
2. **Traces**: Use `--trace on` to capture detailed execution traces
3. **Console Logs**: Tests capture console errors and warnings
4. **localStorage**: Tests verify localStorage state directly

## CI/CD Integration

The tests are configured to run in CI environments with:
- Retry logic for flaky tests
- Parallel execution
- HTML report generation
- Screenshot capture on failure

## Adding New Tests

When adding new tests:

1. Use descriptive test names
2. Add appropriate `data-testid` attributes to components
3. Test both happy path and error scenarios
4. Verify localStorage state when testing persistence
5. Include cleanup in `beforeEach` hooks 