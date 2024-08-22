import puppeteer from 'puppeteer';
import fs from 'fs';
import db from './db';

const url = 'https://www.namshi.com/uae-en/clothing/apparel/outerwear_jackets/b/?page=1&f%5Bbrand_code%5D=adidas&f%5Bbrand_code%5D=nike';

const getProducts = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.ProductBox_container__wiajf');
    const products = await page.evaluate(() => {
        const cleanImageUrl = (url) => url.replace(/\?.*$/, '');
        const productElements = document.querySelectorAll('.ProductBox_container__wiajf');
        const productArray = [];
        productElements.forEach((element) => {
            const brand = element.querySelector('.ProductBox_brand__oDc9f')?.textContent.trim() || '';
            const simpleName = element.querySelector('.ProductBox_productTitle__6tQ3b')?.textContent.trim() || '';
            const name = `${brand} ${simpleName}`;

            const images = Array.from(
                new Set(
                    Array.from(element.querySelectorAll('.slider-list .slide img'))
                        .map(img => img.getAttribute('src'))
                        .map(src => cleanImageUrl(src))
                )
            );

            const rating = Math.floor(Math.random() * 5) + 2;
            const quantity = Math.floor(Math.random() * 300) + 1;
            const sizeList = ['S', 'M', 'L', 'XL', 'XXL'];
            const sizes = sizeList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            const slug = name.toLowerCase().replace(/ /g, '-');
            const shipping = Math.random() < 0.5 ? 'Paid Shipping' : 'Free Shipping';
            const colorList = ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray', 'black', 'white'];
            const colors = colorList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            //.ProductPrice_preReductionPrice__S72wT ProductPrice_large__yN1M7
            const priceElement = element.querySelector('.ProductPrice_preReductionPrice__S72wT');
            const priceText = priceElement?.textContent.trim() || '0.00';
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));

           
            
            productArray.push({
                name,
                description: `Stay Warm, Stay Stylish
Discover the best of outerwear with our exclusive collection from Adidas and Nike. Whether you're braving the cold or adding an edge to your everyday look, our selection of jackets has got you covered.`,
                price: price, // Ensure price is a float
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

    
    const response = await fetch('http://localhost:8000/api/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(products),
    });

    // Check response status and text
    const responseText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Text:', responseText);

    try {
        const data = JSON.parse(responseText);
        console.log('Data:', data);
    } catch (e) {
        console.error('Error parsing JSON:', e.message);
    }

    return products;
}

const main = async () => {
    try {
        const products = await getProducts();
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        console.log('Data successfully written to products.json');
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

main();
