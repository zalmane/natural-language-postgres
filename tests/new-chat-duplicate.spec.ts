import { test, expect } from '@playwright/test';

test.describe('New Chat Duplicate Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      console.log('localStorage cleared');
    });
  });

  test('should create only one chat when clicking New Chat button', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    
    // Wait for the page to load and sidebar to be visible
    await page.waitForSelector('[data-testid="new-chat-button"]');
    
    // Wait for the initial chat session to be created
    await page.waitForFunction(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      return chats.length > 0;
    }, { timeout: 5000 });
    
    // Get initial state - should have one chat created automatically
    const initialChats = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Initial chats in localStorage:', chats);
      return chats;
    });
    
    console.log('Initial chats count:', initialChats.length);
    expect(initialChats.length).toBe(1);
    
    // Get initial chat items in sidebar
    const initialChatItems = await page.locator('[data-testid="chat-item"]').count();
    console.log('Initial chat items in sidebar:', initialChatItems);
    expect(initialChatItems).toBe(1);
    
    // Click the New Chat button
    await page.click('[data-testid="new-chat-button"]');
    
    // Wait a moment for any potential duplicate creation
    await page.waitForTimeout(2000);
    
    // Check localStorage again - should still have only one chat
    const chatsAfterClick = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Chats after New Chat click in localStorage:', chats);
      return chats;
    });
    
    console.log('Chats after New Chat click count:', chatsAfterClick.length);
    expect(chatsAfterClick.length).toBe(1);
    
    // Check sidebar again - should still have only one chat item
    const chatItemsAfterClick = await page.locator('[data-testid="chat-item"]').count();
    console.log('Chat items in sidebar after click:', chatItemsAfterClick);
    expect(chatItemsAfterClick).toBe(1);
    
    // Verify the chat ID is the same (no duplicate created)
    expect(chatsAfterClick[0].id).toBe(initialChats[0].id);
    
    // Verify the chat has the correct description
    expect(chatsAfterClick[0].title).toBe('New Chat');
    expect(chatsAfterClick[0].messageCount).toBe(0);
    expect(chatsAfterClick[0].lastMessage).toBe('');
  });

  test('should show correct chat in sidebar after creating new chat', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="new-chat-button"]');
    
    // Wait for the initial chat session to be created
    await page.waitForFunction(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      return chats.length > 0;
    }, { timeout: 5000 });
    
    // Click New Chat button
    await page.click('[data-testid="new-chat-button"]');
    
    // Wait for sidebar to update
    await page.waitForTimeout(500);
    
    // Check that only one chat item is visible in sidebar
    const chatItems = await page.locator('[data-testid="chat-item"]').count();
    expect(chatItems).toBe(1);
    
    // Verify the chat title is correct
    const chatTitle = await page.locator('[data-testid="chat-title"]').first().textContent();
    expect(chatTitle).toBe('New Chat');
    
    // Verify the chat preview shows "No messages yet"
    const chatPreview = await page.locator('[data-testid="chat-item"] .text-xs.text-gray-500').first().textContent();
    expect(chatPreview).toBe('No messages yet');
  });

  test('should not create duplicate when clicking New Chat multiple times rapidly', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="new-chat-button"]');
    
    // Wait for the initial chat session to be created
    await page.waitForFunction(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      return chats.length > 0;
    }, { timeout: 5000 });
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="chat-item"]').count();
    console.log('Initial chat items:', initialCount);
    
    // Click New Chat button multiple times rapidly
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="new-chat-button"]');
      await page.waitForTimeout(100); // Brief pause between clicks
    }
    
    // Wait for any potential async operations to complete
    await page.waitForTimeout(2000);
    
    // Check localStorage - should still have only one chat
    const chats = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Chats after rapid clicking in localStorage:', chats);
      return chats;
    });
    
    console.log('Chats after rapid clicking count:', chats.length);
    expect(chats.length).toBe(1);
    
    // Check sidebar - should still have only one chat item
    const chatItems = await page.locator('[data-testid="chat-item"]').count();
    console.log('Chat items in sidebar after rapid clicking:', chatItems);
    expect(chatItems).toBe(1);
  });

  test('should update chat description when sending first message', async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="chat-input"]');
    
    // Wait for the initial chat session to be created
    await page.waitForFunction(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      return chats.length > 0;
    }, { timeout: 5000 });
    
    // Send a message
    const testMessage = 'This is a test message for chat title';
    await page.fill('[data-testid="chat-input"]', testMessage);
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="message-content"]');
    
    // Wait a moment for chat metadata to update
    await page.waitForTimeout(1000);
    
    // Check that chat title was updated in localStorage
    const chats = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    
    expect(chats.length).toBe(1);
    expect(chats[0].title).not.toBe('New Chat');
    expect(chats[0].title).toContain('This is a test message');
    expect(chats[0].messageCount).toBeGreaterThan(0);
    expect(chats[0].lastMessage).toBeTruthy();
    
    // Check that sidebar shows updated title
    const chatTitle = await page.locator('[data-testid="chat-title"]').first().textContent();
    expect(chatTitle).not.toBe('New Chat');
    expect(chatTitle).toContain('This is a test message');
  });

  test('should create chat from homepage and show in sidebar', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    // Listen for console errors and page errors
    const errors: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load and find the chat input
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Clear any existing logs
    consoleLogs.length = 0;
    
    // Enter text in the chat input
    const testMessage = 'Hello from homepage! This is my first message.';
    await page.fill('input[placeholder="Ask me anything about your data..."]', testMessage);
    
    // Submit the message (click the search button)
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load
    await page.waitForSelector('[data-testid="chat-input"]');
    
    // Wait for the chat session to be created and messages to load
    await page.waitForFunction(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      return chats.length > 0;
    }, { timeout: 10000 });
    
    // Wait for the user message to appear in the chat
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait a moment for chat metadata to update
    await page.waitForTimeout(2000);
    
    // Log all console output for debugging
    console.log('Console logs during test:', consoleLogs);
    
    // Check for React errors
    if (errors.length > 0) {
      console.error('Errors detected during test:', errors);
      throw new Error(`React errors occurred: ${errors.join(', ')}`);
    }
    
    // Check that there's exactly one chat in localStorage
    const chats = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Chats from homepage flow:', chats);
      return chats;
    });
    
    // Should have exactly one chat
    expect(chats.length).toBe(1);
    
    // Find the chat with our message
    const chatWithMessage = chats.find((chat: any) => chat.title.includes('Hello from homepage'));
    expect(chatWithMessage).toBeTruthy();
    expect(chatWithMessage.messageCount).toBeGreaterThan(0);
    expect(chatWithMessage.lastMessage).toBeTruthy();
    
    // Check that there's exactly one chat item in the sidebar
    const chatItems = await page.locator('[data-testid="chat-item"]').count();
    expect(chatItems).toBe(1);
    
    // Verify the chat title shows the entered text
    const chatTitle = await page.locator('[data-testid="chat-title"]').first().textContent();
    expect(chatTitle).toContain('Hello from homepage');
    
    // Verify the chat preview shows the message content
    const chatPreview = await page.locator('[data-testid="chat-item"] .text-xs.text-gray-500').first().textContent();
    expect(chatPreview).toContain('Hello from homepage');
    
    // Verify the message appears in the chat area
    const messageContent = await page.locator('[data-testid="message-content"]').first().textContent();
    expect(messageContent).toContain('Hello from homepage');
  });

  test('should not cause infinite loop when submitting from homepage', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000);

    // Listen for console errors and page errors
    const errors: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load and find the chat input
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Clear any existing logs
    consoleLogs.length = 0;
    
    // Enter text in the chat input
    const testMessage = 'Test message for infinite loop detection';
    await page.fill('input[placeholder="Ask me anything about your data..."]', testMessage);
    
    // Submit the message (click the search button)
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load
    await page.waitForSelector('[data-testid="chat-input"]');
    
    // Wait for the user message to appear in the chat
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait a moment for any potential infinite loops to manifest
    await page.waitForTimeout(3000);
    
    // Check for React errors (especially infinite loop errors)
    const infiniteLoopErrors = errors.filter(error => 
      error.includes('Maximum update depth exceeded') ||
      error.includes('infinite loop') ||
      error.includes('too many re-renders')
    );
    
    if (infiniteLoopErrors.length > 0) {
      console.error('Infinite loop errors detected:', infiniteLoopErrors);
      throw new Error(`Infinite loop detected: ${infiniteLoopErrors.join(', ')}`);
    }
    
    // Check for excessive console logs (indicates too many re-renders)
    const updateLogs = consoleLogs.filter(log => log.includes('Updating chat session'));
    if (updateLogs.length > 10) {
      console.error('Too many session updates detected:', updateLogs.length);
      throw new Error(`Too many session updates (${updateLogs.length}), possible infinite loop`);
    }
    
    // Verify the message was processed correctly
    const chats = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    
    // Should have exactly one chat
    expect(chats.length).toBe(1);
    
    // Find the chat with our message
    const chatWithMessage = chats.find((chat: any) => chat.title.includes('Test message for infinite loop detection'));
    expect(chatWithMessage).toBeTruthy();
    expect(chatWithMessage.messageCount).toBeGreaterThan(0);
    expect(chatWithMessage.lastMessage).toBeTruthy();
  });

  test('should create multiple chats from homepage and show correct history', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(120000);

    // Listen for console errors and page errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load and find the chat input
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Check initial state
    const initialChats = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Initial chats:', chats.length);
      return chats;
    });
    console.log('Initial chats count:', initialChats.length);
    
    // Send first message: "hi1"
    await page.fill('input[placeholder="Ask me anything about your data..."]', 'hi1');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load and message to appear
    await page.waitForSelector('[data-testid="chat-input"]');
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait for the assistant response to complete
    await page.waitForTimeout(3000);
    
    // Check state after first message
    const chatsAfterFirst = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Chats after first message:', chats.length);
      return chats;
    });
    console.log('Chats after first message count:', chatsAfterFirst.length);
    
    // Navigate back to homepage
    await page.goto('/');
    
    // Wait for the page to load again
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Send second message: "hi2"
    await page.fill('input[placeholder="Ask me anything about your data..."]', 'hi2');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page again
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load and message to appear
    await page.waitForSelector('[data-testid="chat-input"]');
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait for the assistant response to complete
    await page.waitForTimeout(3000);
    
    // Check for React errors
    if (errors.length > 0) {
      console.error('Errors detected during test:', errors);
      throw new Error(`React errors occurred: ${errors.join(', ')}`);
    }
    
    // Check that there are exactly 2 chats in localStorage
    const chats = await page.evaluate(() => {
      const chats = JSON.parse(localStorage.getItem('recent_chats') || '[]');
      console.log('Final chats from multiple homepage submissions:', chats);
      return chats;
    });
    
    console.log('Final chats count:', chats.length);
    expect(chats.length).toBe(2);
    
    // Check that there are exactly 2 chat items in the sidebar
    const chatItems = await page.locator('[data-testid="chat-item"]').count();
    expect(chatItems).toBe(2);
    
    // Find chats with our messages
    const hi1Chats = chats.filter((chat: any) => chat.title.includes('hi1'));
    const hi2Chats = chats.filter((chat: any) => chat.title.includes('hi2'));
    
    expect(hi1Chats.length).toBe(1);
    expect(hi2Chats.length).toBe(1);
    
    // Verify the chat metadata in localStorage is correct
    hi1Chats.forEach((chat: any) => {
      expect(chat.messageCount).toBeGreaterThan(0);
      expect(chat.lastMessage).toBeTruthy();
    });
    
    hi2Chats.forEach((chat: any) => {
      expect(chat.messageCount).toBeGreaterThan(0);
      expect(chat.lastMessage).toBeTruthy();
    });
    
    // Verify the chat IDs are different (different sessions)
    const allChatIds = chats.map((chat: any) => chat.id);
    const uniqueChatIds = new Set(allChatIds);
    expect(uniqueChatIds.size).toBe(2);
    
    // Verify the chat titles in sidebar show the correct messages
    const chatTitles = await page.locator('[data-testid="chat-title"]').allTextContents();
    expect(chatTitles.length).toBe(2);
    expect(chatTitles.some(title => title.includes('hi1'))).toBe(true);
    expect(chatTitles.some(title => title.includes('hi2'))).toBe(true);
    
    // Verify the chat previews show the correct messages
    const chatPreviews = await page.locator('[data-testid="chat-item"] .text-xs.text-gray-500').allTextContents();
    expect(chatPreviews.length).toBe(2);
    expect(chatPreviews.some(preview => preview.includes('hi1'))).toBe(true);
    expect(chatPreviews.some(preview => preview.includes('hi2'))).toBe(true);
  });

  test('should preserve message history when clicking back and forth between chats', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(120000);

    // Listen for console errors and page errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to load and find the chat input
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Send first message: "h1"
    await page.fill('input[placeholder="Ask me anything about your data..."]', 'h1');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load and message to appear
    await page.waitForSelector('[data-testid="chat-input"]');
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait for the assistant response to complete
    await page.waitForTimeout(3000);
    
    // Navigate back to homepage
    await page.goto('/');
    
    // Wait for the page to load again
    await page.waitForSelector('input[placeholder="Ask me anything about your data..."]');
    
    // Send second message: "h2"
    await page.fill('input[placeholder="Ask me anything about your data..."]', 'h2');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to chat page again
    await page.waitForURL('**/chat**');
    
    // Wait for the chat page to load and message to appear
    await page.waitForSelector('[data-testid="chat-input"]');
    await page.waitForSelector('[data-testid="message-content"]', { timeout: 20000 });
    
    // Wait for the assistant response to complete
    await page.waitForTimeout(3000);
    
    // Verify we have 2 chats in the sidebar
    const chatItems = await page.locator('[data-testid="chat-item"]').count();
    expect(chatItems).toBe(2);
    
    // Get the chat titles to identify them
    const chatTitles = await page.locator('[data-testid="chat-title"]').allTextContents();
    const h1ChatTitle = chatTitles.find(title => title.includes('h1'));
    const h2ChatTitle = chatTitles.find(title => title.includes('h2'));
    
    expect(h1ChatTitle).toBeTruthy();
    expect(h2ChatTitle).toBeTruthy();
    
    // Click on the h1 chat first
    await page.locator('[data-testid="chat-title"]').filter({ hasText: 'h1' }).click();
    
    // Wait for the chat to load
    await page.waitForTimeout(1000);
    
    // Verify h1 chat has both user and assistant messages
    const h1Messages = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(h1Messages.length).toBeGreaterThan(1); // Should have user + assistant messages
    expect(h1Messages.some(msg => msg.includes('h1'))).toBe(true);
    
    // Click on the h2 chat
    await page.locator('[data-testid="chat-title"]').filter({ hasText: 'h2' }).click();
    
    // Wait for the chat to load
    await page.waitForTimeout(1000);
    
    // Verify h2 chat has both user and assistant messages
    const h2Messages = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(h2Messages.length).toBeGreaterThan(1); // Should have user + assistant messages
    expect(h2Messages.some(msg => msg.includes('h2'))).toBe(true);
    
    // Click back to h1 chat
    await page.locator('[data-testid="chat-title"]').filter({ hasText: 'h1' }).click();
    
    // Wait for the chat to load
    await page.waitForTimeout(1000);
    
    // Verify h1 chat still has both user and assistant messages (history preserved)
    const h1MessagesAfterSwitch = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(h1MessagesAfterSwitch.length).toBeGreaterThan(1); // Should still have user + assistant messages
    expect(h1MessagesAfterSwitch.some(msg => msg.includes('h1'))).toBe(true);
    
    // Click back to h2 chat
    await page.locator('[data-testid="chat-title"]').filter({ hasText: 'h2' }).click();
    
    // Wait for the chat to load
    await page.waitForTimeout(1000);
    
    // Verify h2 chat still has both user and assistant messages (history preserved)
    const h2MessagesAfterSwitch = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(h2MessagesAfterSwitch.length).toBeGreaterThan(1); // Should still have user + assistant messages
    expect(h2MessagesAfterSwitch.some(msg => msg.includes('h2'))).toBe(true);
    
    // Click back to h1 chat one more time
    await page.locator('[data-testid="chat-title"]').filter({ hasText: 'h1' }).click();
    
    // Wait for the chat to load
    await page.waitForTimeout(1000);
    
    // Verify h1 chat still has both user and assistant messages (history preserved)
    const h1MessagesFinal = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(h1MessagesFinal.length).toBeGreaterThan(1); // Should still have user + assistant messages
    expect(h1MessagesFinal.some(msg => msg.includes('h1'))).toBe(true);
    
    // Check for React errors
    if (errors.length > 0) {
      console.error('Errors detected during test:', errors);
      throw new Error(`React errors occurred: ${errors.join(', ')}`);
    }
  });
}); 