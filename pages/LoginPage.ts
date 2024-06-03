import { Page } from 'playwright';

export class LoginPage {
  private page: Page;
  private usernameField = 'input[name="username"]';
  private passwordField = 'input[name="password"]';
  private loginButton = 'button[type="submit"]';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
  }

  async login(username: string, password: string) {
    await this.page.fill(this.usernameField, username);
    await this.page.fill(this.passwordField, password);
    await this.page.click(this.loginButton);
  }
}

