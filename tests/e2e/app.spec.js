const { test, expect } = require('@playwright/test');

test('application displays the correct title', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Mini Task Manager',
      exact: true,
    })
  ).toBeVisible();

  await expect(page).toHaveTitle('Mini Task Manager');
});


test('user can add a new task', async ({ page }) => {
  await page.goto('/');

  // Start with a clean task list.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Enter a new task.
  await page.getByRole('textbox', {
    name: 'New task',
  }).fill('Learn Playwright');

  // Submit the task.
  await page.getByRole('button', {
    name: 'Add Task',
  }).click();

  // Verify that the task appears.
  await expect(
    page.locator('#task-list')
  ).toContainText('Learn Playwright');

  // Verify task statistics.
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('0');
  await expect(page.locator('#remaining-count')).toHaveText('1');
});


test('user can complete and uncomplete a task', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Add a new task.
  await page.getByRole('textbox', {
    name: 'New task',
  }).fill('Learn Playwright');

  await page.getByRole('button', {
    name: 'Add Task',
  }).click();

  // Find the task checkbox.
  const checkbox = page.getByRole('checkbox', {
    name: 'Mark Learn Playwright as completed',
  });

  // Complete the task.
  await checkbox.check();

  await expect(checkbox).toBeChecked();
  await expect(page.locator('#task-list li')).toHaveClass(/completed/);

  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('0');

  // Uncomplete the task.
  await checkbox.uncheck();

  await expect(checkbox).not.toBeChecked();
  await expect(page.locator('#task-list li')).not.toHaveClass(/completed/);

  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('0');
  await expect(page.locator('#remaining-count')).toHaveText('1');
});


test('user can delete a task', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Add a task.
  await page.getByRole('textbox', {
    name: 'New task',
  }).fill('Task to delete');

  await page.getByRole('button', {
    name: 'Add Task',
  }).click();

  // Verify the task exists.
  await expect(
    page.locator('#task-list li')
  ).toHaveCount(1);

  // Delete the task.
  await page.getByRole('button', {
    name: 'Delete Task to delete',
  }).click();

  // Verify the task was removed.
  await expect(
    page.locator('#task-list li')
  ).toHaveCount(0);

  // Verify statistics.
  await expect(page.locator('#total-count')).toHaveText('0');
  await expect(page.locator('#completed-count')).toHaveText('0');
  await expect(page.locator('#remaining-count')).toHaveText('0');

  // Verify localStorage.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks') || '[]'
    );
  });

  expect(savedTasks).toEqual([]);
});


test('tasks persist after page reload', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Add a new task.
  await page.getByRole('textbox', {
    name: 'New task',
  }).fill('Persistent task');

  await page.getByRole('button', {
    name: 'Add Task',
  }).click();

  // Mark the task as completed.
  await page.getByRole('checkbox', {
    name: 'Mark Persistent task as completed',
  }).check();

  // Reload the application.
  await page.reload();

  // Verify the task still exists.
  await expect(
    page.locator('#task-list li')
  ).toHaveCount(1);

  await expect(
    page.locator('#task-list')
  ).toContainText('Persistent task');

  // Verify completion state was restored.
  await expect(
    page.getByRole('checkbox', {
      name: 'Mark Persistent task as completed',
    })
  ).toBeChecked();

  // Verify statistics after reload.
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('0');

  // Verify the stored data.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks') || '[]'
    );
  });

  expect(savedTasks).toHaveLength(1);
  expect(savedTasks[0].text).toBe('Persistent task');
  expect(savedTasks[0].completed).toBe(true);
});
