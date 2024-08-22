# Product Scraper for Jolt Store

Welcome to the Product Scraper for Jolt Store! This project is designed to scrape product data from e-commerce websites and integrate it into our store database. It utilizes Puppeteer for web scraping and Prisma Client for managing the database.

## Project Overview

This project includes a script that scrapes product data from a specified e-commerce website and stores it in the database of our store. The data collected includes product names, descriptions, prices, images, ratings, sizes, quantities, and other relevant information. 

### Key Features

- **Web Scraping**: Uses Puppeteer to automate browsing and extract product data from the e-commerce site.
- **Data Management**: Utilizes Prisma Client to interact with the SQLite database and manage the scraped data.
- **Integration**: Posts the scraped data to a Laravel API endpoint for integration into the Jolt Store.

## Installation

To get started, follow these steps:

1. Clone the repository:

   ```bash
   git clone
    ```
2. Install the dependencies:

   ```bash
   npm install
   ```
3. Set up the environment variables:

   ```bash
    cp .env.example .env
    ```
4. Update the environment variables in the `.env` file with your configuration.

5. Run the scraper script:

   ```bash
   npm start
   ```
6. Verify that the data has been successfully scraped and stored in the database.

## Usage

The scraper script can be run manually or scheduled to run at specific intervals. You can customize the script to scrape data from different e-commerce websites by modifying the scraping logic.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2022 Jolt Store. All rights reserved.
```


