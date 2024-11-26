import { test, expect } from '@playwright/test';
import { CONFIG } from '../config/env';
import { GitHubApiClient } from '../utils/api-client';
import { GitHubUiHelper } from '../utils/ui-helper';
import { TestRepository } from '../types/github';

test.describe('GitHub Repository Verification Tests', () => {
    let apiClient: GitHubApiClient;

    // Test repositories to verify
    const TEST_REPOS: TestRepository[] = [
        {
            owner: 'Ashish-py0409',
            name: 'taf-demoqa',
            expectedDescription: 'TypeScript is a superset of JavaScript that compiles to clean JavaScript output.'
        },
        {
            owner: "Ashish-py0409",
            name: "backpy",
            expectedDescription: ""
        },
        // Add more repositories as needed
    ];

    test.beforeAll(async ({ playwright }) => {
        console.log(CONFIG.GITHUB_API_TOKEN);

        const apiContext = await playwright.request.newContext({
            baseURL: CONFIG.API_BASE_URL,
            extraHTTPHeaders: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${CONFIG.GITHUB_API_TOKEN}`,
                'User-Agent': 'Playwright-Tests'
            },
        });
        apiClient = new GitHubApiClient(apiContext);
    });

    test.beforeEach(async ({ page }) => {
        // Add any setup needed before each test
        console.log(`Testing with GitHub account: ${CONFIG.GITHUB_EMAIL}`);
    });

    for (const repo of TEST_REPOS) {
        test(`verify repository: ${repo.owner} / ${repo.name}`, async ({ page }) => {
            const uiHelper = new GitHubUiHelper(page);

            // Get API data
            const apiData = await apiClient.getRepository(repo.owner, repo.name);

            await uiHelper.login("", "")

            // Get UI data
            await uiHelper.navigateToRepository(repo.owner, repo.name);
            const uiStarCount = await uiHelper.getStarCount();
            //const uiDescription = await uiHelper.getDescription();

            // Verify data
            const starCountDifference = Math.abs(uiStarCount - apiData.stargazers_count);
            const maxAllowedDifference = 10;

            // Log verification details
            console.log({
                repository: `${repo.owner} / ${repo.name}`,
                uiStarCount,
                apiStarCount: apiData.stargazers_count,
                starDifference: starCountDifference,
                //uiDescription,
                apiDescription: apiData.description
            });

            // Assertions
            expect(starCountDifference).toBeLessThan(maxAllowedDifference);
            //expect(uiDescription).toBe(apiData.description);
        });
    }
});