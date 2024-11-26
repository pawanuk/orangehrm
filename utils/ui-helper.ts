import { Page } from '@playwright/test';
import { CONFIG } from '../config/env';

export class GitHubUiHelper {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async login(username: string, password: string): Promise<void> {
        // Navigate and login
        await this.page.goto('https://github.com/login');
        
        // Hardcoded credentials
        await this.page.getByLabel('Username or email address').fill(username);
        await this.page.getByLabel('Password').fill(password);
        await this.page.getByRole('button', { name: 'Sign in' }).click();

        // Wait for login to complete
        await this.page.waitForURL('https://github.com/**');
    }

    async navigateToRepository(owner: string, repo: string): Promise<void> {
        await this.page.goto(`${ CONFIG.UI_BASE_URL }/${ owner }/${ repo }`);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getStarCount(): Promise<number> {
        const starText = await this.page.locator('[id="repo-stars-counter-star"]').innerText();
        return this.formatStarCount(starText);
    }

    async getDescription(): Promise<string> {
        return await this.page.locator('[data-test-selector="repository-description"]').innerText();
    }

    private formatStarCount(count: string): number {
        if (count.includes('k')) {
            return parseFloat(count.replace('k', '')) * 1000;
        }
        return parseInt(count.replace(',', ''));
    }


}