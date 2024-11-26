import { APIRequestContext } from '@playwright/test';
import { GitHubRepo } from '../types/github';

export class GitHubApiClient {
    private context: APIRequestContext;

    constructor(context: APIRequestContext) {
        this.context = context;
    }

    async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
        const url = `/repos/${owner}/${repo}`
        console.log(url);
        
        const response = await this.context.get(url);
        if (!response.ok()) {
            throw new Error(`API request failed: ${response.statusText()}`);
        }
        return await response.json();
    }

    async getUserRepositories(): Promise<GitHubRepo[]> {
        const response = await this.context.get('/user/repos');
        if (!response.ok()) {
            throw new Error(`API request failed: ${response.statusText()}`);
        }
        return await response.json();
    }
}