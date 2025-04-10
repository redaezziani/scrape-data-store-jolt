import puppeteer from 'puppeteer';
import fs from 'fs';

const baseUrl = 'https://www.namshi.com/uae-en/women/search/?q=cap&selected_gender=women';
const initialUrl = baseUrl + '?f%5Bbrand_code%5D=angelsin&page=1';

// Delimiter condition - you can customize this
const MAX_PAGES = 10; // Default max pages as safety measure
const PRODUCTS_PER_PAGE_THRESHOLD = 3; // If fewer products found, consider it a delimiter

const scrapeAllPages = async (maxPages = MAX_PAGES, productsThreshold = PRODUCTS_PER_PAGE_THRESHOLD) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    let currentPage = 1;
    let hasNextPage = true;
    let allProducts = [];
    
    try {
        while (hasNextPage && currentPage <= maxPages) {
            const pageUrl = `${baseUrl}&page=${currentPage}`;
            console.log(`Scraping page ${currentPage}: ${pageUrl}`);
            
            await page.goto(pageUrl, { waitUntil: 'networkidle2' });
            
            try {
                await page.waitForSelector('.ProductBox_container__wiajf', { timeout: 10000 });
            } catch (error) {
                console.log(`No products found on page ${currentPage}. Reached the end.`);
                break;
            }
            
            const pageProducts = await scrapeProductsFromPage(page);
            console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
            
            // Add products from this page to our collection
            allProducts = [...allProducts, ...pageProducts];
            
            // Check if we've reached our delimiter condition (few or no products)
            if (pageProducts.length < productsThreshold) {
                console.log(`Reached delimiter condition: only ${pageProducts.length} products found (threshold: ${productsThreshold})`);
                hasNextPage = false;
            } else {
                currentPage++;
            }
        }
    } catch (error) {
        console.error('Error during pagination scraping:', error);
    } finally {
        await browser.close();
    }
    
    return allProducts;
};

const scrapeProductsFromPage = async (page) => {
    return await page.evaluate(() => {
        const cleanImageUrl = (url) => url.replace(/\?.*$/, '');
        const productElements = document.querySelectorAll('.ProductBox_container__wiajf.ProductBox_boxContainer__p7PaQ');
        
        if (productElements.length === 0) {
            console.error('No product elements found on this page.');
            return [];
        }
        
        const productArray = [];
        productElements.forEach((element) => {
            const brand = element.querySelector('.ProductBox_brand__oDc9f')?.textContent.trim() || '';
            const simpleName = element.querySelector('.ProductBox_productTitle__6tQ3b')?.textContent.trim() || '';
            const name = `${brand} ${simpleName}`;

            // Get images
            const images = Array.from(
                new Set(
                    Array.from(element.querySelectorAll('.ProductImage_imageContainer__B5pcR img'))
                        .map(img => img.getAttribute('src'))
                        .filter(src => src)
                        .map(src => cleanImageUrl(src))
                )
            );

            // Extract price information
            const currencyElement = element.querySelector('.ProductPrice_currency__issmK');
            const valueElement = element.querySelector('.ProductPrice_value__hnFSS');
            const currency = currencyElement?.textContent.trim() || '';
            const value = valueElement?.textContent.trim() || '0';
            
            // Get original price
            const originalPriceElement = element.querySelector('.ProductPrice_preReductionPrice__S72wT');
            const originalPrice = originalPriceElement?.textContent.trim() || '0';
            
            // Extract discount percentage
            const discountElement = element.querySelector('.DiscountTag_value__D52x5');
            const discount = discountElement?.textContent.trim() || '';

            const price = parseFloat(value);

            const rating = Math.floor(Math.random() * 5) + 2;
            const quantity = Math.floor(Math.random() * 300) + 1;
            const sizeList = ['S', 'M', 'L', 'XL', 'XXL'];
            const sizes = sizeList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            const slug = name.toLowerCase().replace(/ /g, '-');
            const shipping = Math.random() < 0.5 ? 'Paid Shipping' : 'Free Shipping';
            const colorList = ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray', 'black', 'white'];
            const colors = colorList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            
            productArray.push({
                name,
                description: `Stay Warm, Stay Stylish
Discover the best of outerwear with our exclusive collection from Adidas and Nike. Whether you're braving the cold or adding an edge to your everyday look, our selection of jackets has got you covered.`,
                price: price,
                original_price: parseFloat(originalPrice),
                discount: discount,
                currency: currency,
                rating,
                sizes,
                quantity,
                cover_img: images[0],
                prev_imgs: images.join('@'),
                category_id: 3,
                slug,
                shipping,
                colors,
            });
        });

        return productArray;
    });
};

const postProductsToAPI = async (products) => {
    if (products.length === 0) {
        console.warn('No products found to post to API');
        return;
    }
    
    console.log(`Posting ${products.length} products to Laravel API...`);
    
    try {
        const response = await fetch('http://localhost:8000/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(products),
        });
        
        const responseText = await response.text();
        console.log('Response Status:', response.status);
        
        try {
            const responseData = JSON.parse(responseText);
            console.log('API Response:', responseData);
        } catch (e) {
            console.error('Failed to parse response:', e);
        }
        
        if (!response.ok) {
            console.error('API Error: Server returned status', response.status);
        }
    } catch (apiError) {
        console.error('Failed to communicate with API:', apiError.message);
    }
};

const main = async () => {
    try {
        // Configure your delimiter conditions here
        const maxPages = 10;  // Maximum number of pages to scrape
        const productsThreshold = 3;  // If fewer products found, consider it the end
        
        console.log(`Starting pagination scraping (max ${maxPages} pages, threshold ${productsThreshold} products)`);
        
        // Scrape all products from multiple pages
        const allProducts = await scrapeAllPages(maxPages, productsThreshold);
        
        // Save all products to a single JSON file
        fs.writeFileSync('products.json', JSON.stringify(allProducts, null, 2));
        console.log(`Data successfully written to products.json (${allProducts.length} total products)`);
        
        // Post products to API
        await postProductsToAPI(allProducts);
        
    } catch (error) {
        console.error('Error during scraping process:', error);
    }
};

main();