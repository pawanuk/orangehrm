export interface GitHubRepo {
    name: string;
    description: string;
    stargazers_count: number;
    owner: {
      login: string;
    };
    private: boolean;
  }
  
  export interface TestRepository {
    owner: string;
    name: string;
    expectedDescription?: string;
  }