import { test, expect } from '@playwright/test';

test.describe('Recent Chats Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should create only one session when clicking New Chat', async ({ page }) => {
    await page.goto('/chat');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="chat-input"]');
    
    // Check initial localStorage state
    const initialChats = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    expect(initialChats).toHaveLength(1); // Should have exactly one session
    
    // Click New Chat button in sidebar
    await page.click('[data-testid="new-chat-button"]');
    
    // Wait a moment for any potential duplicate creation
    await page.waitForTimeout(1000);
    
    // Check localStorage again - should still have only one session
    const chatsAfterNewChat = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    expect(chatsAfterNewChat).toHaveLength(1);
    
    // Verify the session ID is the same (no duplicate created)
    expect(chatsAfterNewChat[0].id).toBe(initialChats[0].id);
  });

  test('should persist messages when switching between chats', async ({ page }) => {
    await page.goto('/chat');
    
    // Send first message in Chat 1
    await page.fill('[data-testid="chat-input"]', 'Hello from Chat 1');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="message-content"]');
    
    // Create new chat
    await page.click('[data-testid="new-chat-button"]');
    
    // Send message in Chat 2
    await page.fill('[data-testid="chat-input"]', 'Hello from Chat 2');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="message-content"]');
    
    // Switch back to first chat
    await page.click('[data-testid="chat-item"]:first-child');
    
    // Verify Chat 1 messages are still there
    const chat1Messages = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(chat1Messages.some(msg => msg.includes('Hello from Chat 1'))).toBeTruthy();
    expect(chat1Messages.some(msg => msg.includes('Hello from Chat 2'))).toBeFalsy();
    
    // Switch to second chat
    await page.click('[data-testid="chat-item"]:nth-child(2)');
    
    // Verify Chat 2 messages are there
    const chat2Messages = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(chat2Messages.some(msg => msg.includes('Hello from Chat 2'))).toBeTruthy();
    expect(chat2Messages.some(msg => msg.includes('Hello from Chat 1'))).toBeFalsy();
  });

  test('should update chat metadata when sending messages', async ({ page }) => {
    await page.goto('/chat');
    
    // Send a message
    await page.fill('[data-testid="chat-input"]', 'This is a test message for chat title');
    await page.press('[data-testid="chat-input"]', 'Enter');
    
    // Wait for response
    await page.waitForSelector('[data-testid="message-content"]');
    
    // Check that chat title was updated
    const chats = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    
    expect(chats[0].title).not.toBe('New Chat');
    expect(chats[0].title).toContain('This is a test message');
    expect(chats[0].messageCount).toBeGreaterThan(0);
    expect(chats[0].lastMessage).toBeTruthy();
  });

  test('should clear all chats when clicking clear button', async ({ page }) => {
    await page.goto('/chat');
    
    // Send a message to create a chat
    await page.fill('[data-testid="chat-input"]', 'Test message');
    await page.press('[data-testid="chat-input"]', 'Enter');
    await page.waitForSelector('[data-testid="message-content"]');
    
    // Verify chat exists
    const chatsBefore = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    expect(chatsBefore.length).toBeGreaterThan(0);
    
    // Click clear all button
    await page.click('[data-testid="clear-chats-button"]');
    
    // Confirm dialog
    await page.on('dialog', dialog => dialog.accept());
    
    // Verify chats are cleared
    const chatsAfter = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('recent_chats') || '[]');
    });
    expect(chatsAfter).toHaveLength(0);
    
    // Verify sidebar shows "No recent chats"
    await expect(page.locator('text=No recent chats')).toBeVisible();
  });

  test('should handle rapid chat switching without errors', async ({ page }) => {
    await page.goto('/chat');
    
    // Create multiple chats quickly
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="new-chat-button"]');
      await page.fill('[data-testid="chat-input"]', `Message ${i + 1}`);
      await page.press('[data-testid="chat-input"]', 'Enter');
      await page.waitForSelector('[data-testid="message-content"]');
    }
    
    // Rapidly switch between chats
    const chatItems = await page.locator('[data-testid="chat-item"]').all();
    
    for (let i = 0; i < 5; i++) {
      await chatItems[i % chatItems.length].click();
      await page.waitForTimeout(100); // Brief pause
    }
    
    // Verify no errors occurred
    const consoleErrors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    expect(consoleErrors).toHaveLength(0);
  });

  test('should maintain chat order in sidebar (newest first)', async ({ page }) => {
    await page.goto('/chat');
    
    // Create multiple chats
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="new-chat-button"]');
      await page.fill('[data-testid="chat-input"]', `Chat ${i + 1}`);
      await page.press('[data-testid="chat-input"]', 'Enter');
      await page.waitForSelector('[data-testid="message-content"]');
    }
    
    // Get chat titles from sidebar
    const chatTitles = await page.locator('[data-testid="chat-title"]').allTextContents();
    
    // Verify newest chat is first
    expect(chatTitles[0]).toContain('Chat 3');
    expect(chatTitles[1]).toContain('Chat 2');
    expect(chatTitles[2]).toContain('Chat 1');
  });
}); 