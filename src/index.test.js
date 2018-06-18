import React from 'react';
import ReactDOM from 'react-dom';
import renderer from 'react-test-renderer';
import puppeteer from "puppeteer";

describe('game', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
    headless: false
    });
  }, 3000);

  beforeEach(async () => {
    page = await browser.newPage();
    // TODO: set up jest puppeteer config
    await page.goto('http://localhost:3000');
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  }, 3000);

  describe('start game', () => {
    test('Start Button is displayed', async () => {
      let text = await page.evaluate(() => document.body.textContent);
      expect(text).toContain('Start Game');
      expect(text).not.toContain('Next Game');
    });

    test('Start Button starts game', async () => {
      await page.$eval('.cover-button', button => button.click());
      let text = await page.evaluate(() => document.body.textContent);
      expect(text).toContain('Opening roll');
    });
  });

  describe('move piece, double click', async () => {
    test('piece moves to expected target', async () => {
      await page.$eval('.cover-button', button => button.click());
    });
  });
});
