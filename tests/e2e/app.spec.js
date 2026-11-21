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


test('user cannot add a whitespace-only task', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Enter whitespace-only text.
  await page.locator('#task-input').fill('   ');

  // Submit the form.
  await page.locator('#task-form').evaluate(form => {
    form.requestSubmit();
  });

  // Verify no task was created.
  await expect(page.locator('#task-list li')).toHaveCount(0);

  // Verify statistics remain unchanged.
  await expect(page.locator('#total-count')).toHaveText('0');
  await expect(page.locator('#completed-count')).toHaveText('0');
  await expect(page.locator('#remaining-count')).toHaveText('0');

  // Verify no task was saved.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks') || '[]'
    );
  });

  expect(savedTasks).toEqual([]);
});


test('task text is trimmed before saving', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Enter text with leading and trailing spaces.
  await page.locator('#task-input').fill(
    '   Learn Playwright Testing   '
  );

  // Submit the form.
  await page.locator('#task-form').evaluate(form => {
    form.requestSubmit();
  });

  // Verify the displayed text is trimmed.
  await expect(
    page.locator('#task-list li span')
  ).toHaveText('Learn Playwright Testing');

  // Verify statistics.
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('1');

  // Verify the saved text is also trimmed.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks') || '[]'
    );
  });

  expect(savedTasks).toHaveLength(1);
  expect(savedTasks[0].text).toBe('Learn Playwright Testing');
});


test('duplicate task names are handled independently', async ({ page }) => {
  await page.goto('/');

  // Start with empty storage.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const input = page.locator('#task-input');
  const form = page.locator('#task-form');

  // Add two tasks with the same name.
  for (let i = 0; i < 2; i++) {
    await input.fill('Duplicate task');
    await form.evaluate(element => element.requestSubmit());
  }

  // Both tasks should exist.
  await expect(page.locator('#task-list li')).toHaveCount(2);
  await expect(page.locator('#total-count')).toHaveText('2');

  // Complete only the first task.
  await page.getByRole('checkbox', {
    name: 'Mark Duplicate task as completed',
  }).first().check();

  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('1');

  // Delete only the first task.
  await page.getByRole('button', {
    name: 'Delete Duplicate task',
  }).first().click();

  // The second task must remain.
  await expect(page.locator('#task-list li')).toHaveCount(1);
  await expect(page.locator('#total-count')).toHaveText('1');

  // Verify the remaining task is not completed.
  await expect(page.getByRole('checkbox', {
    name: 'Mark Duplicate task as completed',
  })).not.toBeChecked();

  // Verify saved data.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks') || '[]'
    );
  });

  expect(savedTasks).toHaveLength(1);
  expect(savedTasks[0].text).toBe('Duplicate task');
  expect(savedTasks[0].completed).toBe(false);
});


test('application recovers from malformed localStorage JSON', async ({ page }) => {
  await page.goto('/');

  // Store invalid JSON.
  await page.evaluate(() => {
    localStorage.setItem(
      'mini-task-manager-tasks',
      '{invalid-json'
    );
  });

  // Reload to trigger loadTasks().
  await page.reload();

  // Verify the application still works.
  await expect(page.locator('#task-list li')).toHaveCount(0);

  await expect(page.locator('#total-count')).toHaveText('0');
  await expect(page.locator('#completed-count')).toHaveText('0');
  await expect(page.locator('#remaining-count')).toHaveText('0');

  // Add a valid task after recovery.
  await page.locator('#task-input').fill('Recovered task');

  await page.locator('#task-form').evaluate(form => {
    form.requestSubmit();
  });

  // Verify the new task appears.
  await expect(
    page.locator('#task-list li')
  ).toHaveCount(1);

  await expect(
    page.locator('#task-list')
  ).toContainText('Recovered task');

  // Verify valid data replaced malformed JSON.
  const savedTasks = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem('mini-task-manager-tasks')
    );
  });

  expect(savedTasks).toHaveLength(1);
  expect(savedTasks[0].text).toBe('Recovered task');
  expect(savedTasks[0].completed).toBe(false);
});


test('invalid stored tasks are filtered out', async ({ page }) => {
  await page.goto('/');

  // Prepare a mixture of valid and invalid tasks.
  const storedTasks = [
    {
      id: 'valid-1',
      text: 'Valid task',
      completed: false,
    },
    {
      id: 'valid-2',
      text: 'Completed task',
      completed: true,
    },
    {
      id: 123,
      text: 'Invalid ID',
      completed: false,
    },
    {
      id: 'invalid-text',
      text: null,
      completed: false,
    },
    {
      id: 'invalid-status',
      text: 'Invalid status',
      completed: 'yes',
    },
    null,
  ];

  // Store test data.
  await page.evaluate(tasks => {
    localStorage.setItem(
      'mini-task-manager-tasks',
      JSON.stringify(tasks)
    );
  }, storedTasks);

  // Reload to trigger loadTasks().
  await page.reload();

  // Only the two valid tasks should appear.
  await expect(page.locator('#task-list li')).toHaveCount(2);

  await expect(page.locator('#task-list'))
    .toContainText('Valid task');

  await expect(page.locator('#task-list'))
    .toContainText('Completed task');

  // Verify statistics.
  await expect(page.locator('#total-count')).toHaveText('2');
  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('1');

  // Verify the completed state.
  await expect(
    page.getByRole('checkbox', {
      name: 'Mark Completed task as completed',
    })
  ).toBeChecked();

  // Verify invalid tasks are not rendered.
  await expect(page.locator('#task-list'))
    .not.toContainText('Invalid ID');

  await expect(page.locator('#task-list'))
    .not.toContainText('Invalid status');
});

test('mobile viewport displays the task form without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({
    width: 375,
    height: 812,
  });

  await page.goto('/');

  const taskInput = page.locator('#task-input');
  const taskForm = page.locator('#task-form');

  await expect(taskInput).toBeVisible();
  await expect(taskForm).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(hasHorizontalOverflow).toBe(false);
});

test('desktop viewport displays the task form without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({
    width: 1440,
    height: 900,
  });

  await page.goto('/');

  const taskInput = page.locator('#task-input');
  const taskForm = page.locator('#task-form');

  await expect(taskInput).toBeVisible();
  await expect(taskForm).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(hasHorizontalOverflow).toBe(false);
});

test('mobile user can add a task', async ({ page }) => {
  await page.setViewportSize({
    width: 375,
    height: 812,
  });

  await page.goto('/');

  await page.locator('#task-input').fill('Mobile responsive task');

  await page.locator('#task-form').evaluate((form) => {
    form.requestSubmit();
  });

  const taskList = page.locator('#task-list');

  await expect(taskList.locator('li')).toHaveCount(1);

  await expect(
    taskList.getByText('Mobile responsive task')
  ).toBeVisible();

  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('1');
});

test('mobile user can complete a task', async ({ page }) => {
  await page.setViewportSize({
    width: 375,
    height: 812,
  });

  await page.goto('/');

  // Add a new task
  await page.locator('#task-input').fill('Complete mobile task');

  await page.locator('#task-form').evaluate((form) => {
    form.requestSubmit();
  });

  const task = page.locator('#task-list li').filter({
    hasText: 'Complete mobile task',
  });

  await expect(task).toHaveCount(1);

  // Complete the task
  await task.getByRole('checkbox').check();

  // Verify completed state
  await expect(task).toHaveClass(/completed/);
  await expect(task.getByRole('checkbox')).toBeChecked();

  // Verify statistics
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('0');
});

test('desktop user can add a task', async ({ page }) => {
  await page.setViewportSize({
    width: 1440,
    height: 900,
  });

  await page.goto('/');

  // Add a new task
  await page.locator('#task-input').fill('Desktop responsive task');

  await page.locator('#task-form').evaluate((form) => {
    form.requestSubmit();
  });

  // Verify the task appears
  const taskList = page.locator('#task-list');

  await expect(taskList.locator('li')).toHaveCount(1);

  await expect(
    taskList.getByText('Desktop responsive task')
  ).toBeVisible();

  // Verify task statistics
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('1');
});

test('desktop user can complete a task', async ({ page }) => {
  await page.setViewportSize({
    width: 1440,
    height: 900,
  });

  await page.goto('/');

  // Add a new task
  await page.locator('#task-input').fill('Complete desktop task');

  await page.locator('#task-form').evaluate((form) => {
    form.requestSubmit();
  });

  const task = page.locator('#task-list li').filter({
    hasText: 'Complete desktop task',
  });

  await expect(task).toHaveCount(1);

  // Complete the task
  await task.getByRole('checkbox').check();

  // Verify completed state
  await expect(task).toHaveClass(/completed/);
  await expect(task.getByRole('checkbox')).toBeChecked();

  // Verify statistics
  await expect(page.locator('#total-count')).toHaveText('1');
  await expect(page.locator('#completed-count')).toHaveText('1');
  await expect(page.locator('#remaining-count')).toHaveText('0');
});
