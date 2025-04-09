import puppeteer from 'puppeteer';
import fs from 'fs';

const url = 'https://www.namshi.com/uae-en/women-clothing-jumpsuits_playsuits/';

const getProducts = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.ProductBox_container__wiajf');
    const products = await page.evaluate(() => {
        const cleanImageUrl = (url) => url.replace(/\?.*$/, '');
        const productElements = document.querySelectorAll('.ProductBox_container__wiajf.ProductBox_boxContainer__p7PaQ');
        console.log('Product Elements:', productElements.length);
        if (productElements.length === 0) {
            console.error('No product elements found.');
            return [];
        }
        const productArray = [];
        productElements.forEach((element) => {
            const brand = element.querySelector('.ProductBox_brand__oDc9f')?.textContent.trim() || '';
            const simpleName = element.querySelector('.ProductBox_productTitle__6tQ3b')?.textContent.trim() || '';
            const name = `${brand} ${simpleName}`;

            // Updated image selector to target the correct container
            const images = Array.from(
                new Set(
                    Array.from(element.querySelectorAll('.ProductImage_imageContainer__B5pcR img'))
                        .map(img => img.getAttribute('src'))
                        .filter(src => src) // Filter out null or undefined values
                        .map(src => cleanImageUrl(src))
                )
            );

            // Extract price information from the updated structure
            const currencyElement = element.querySelector('.ProductPrice_currency__issmK');
            const valueElement = element.querySelector('.ProductPrice_value__hnFSS');
            const currency = currencyElement?.textContent.trim() || '';
            const value = valueElement?.textContent.trim() || '0';
            
            // Get original price (pre-reduction price)
            const originalPriceElement = element.querySelector('.ProductPrice_preReductionPrice__S72wT');
            const originalPrice = originalPriceElement?.textContent.trim() || '0';
            
            // Extract discount percentage if available
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

    await browser.close();

    // Post data to Laravel API

    
    

    return products;
}

const main = async () => {
    try {
        // Scrape products and save to file
        const products = await getProducts();
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        console.log('Data successfully written to products.json');
        
        // Read the saved products file
        const data = fs.readFileSync('products.json', 'utf8');
        const jsonData = JSON.parse(data);
        
        if (jsonData.length === 0) {
            console.warn('No products found to post to API');
            return;
        }
        
        console.log(`Posting ${jsonData.length} products to Laravel API...`);
        
        // Send all products in a single request
        try {
            const response = await fetch('http://localhost:8000/api/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });
            
            const responseText = await response.text();
            console.log('Response Status:', response.status);
            
            try {
                const responseData = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response:', e);
            }
            
            if (!response.ok) {
                console.error('API Error: Server returned status', response.status);
            }
        } catch (apiError) {
            console.error('Failed to communicate with API:', apiError.message);
        }
    } catch (error) {
        console.error('Error during scraping process:', error);
    }
}

main();
