const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('main page has no detectable WCAG 2.1 A and AA violations', async ({ page }) => {
  await page.goto('/');

  const accessibilityScan = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
    ])
    .analyze();

  expect(accessibilityScan.violations).toEqual([]);
});


test('task list has no detectable WCAG 2.1 A and AA violations', async ({ page }) => {
  await page.goto('/');

  // Add a task to display dynamic UI elements.
  await page.locator('#task-input').fill('Accessibility audit task');
  await page.locator('#task-input').press('Enter');

  // Verify the task was added.
  await expect(
    page.locator('#task-list li')
  ).toHaveCount(1);

  // Run accessibility audit with the task visible.
  const accessibilityScan = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
    ])
    .analyze();

  expect(accessibilityScan.violations).toEqual([]);
});


test('completed task has no detectable WCAG 2.1 A and AA violations', async ({ page }) => {
  await page.goto('/');

  // Add a task.
  await page.locator('#task-input').fill('Completed accessibility task');
  await page.locator('#task-input').press('Enter');

  // Find the task.
  const task = page.locator('#task-list li').filter({
    hasText: 'Completed accessibility task',
  });

  await expect(task).toHaveCount(1);

  // Complete the task.
  await task.getByRole('checkbox').check();

  // Verify the completed state.
  await expect(task).toHaveClass(/completed/);

  // Run the accessibility audit.
  const accessibilityScan = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
    ])
    .analyze();

  expect(accessibilityScan.violations).toEqual([]);
});

