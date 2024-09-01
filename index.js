import { chromium } from "playwright";
import express from "express";

const app = express();
const port = process.env.PORT || 2000;

app.get("/", async (req, res) => {
    const dni = req.query.dni || "34564345";
    const result = await fetchData(dni);
    res.send(result);
});

async function fetchData(dni) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://www.cuitonline.com/search.php?q=" + dni);

    try {
        const hasResult = await page.$eval('.denominacion', el => el.textContent);
        if (!hasResult) {
            await browser.close();
            return { error: "No se encontraron resultados" };
        }
    } catch (error) {
        await browser.close();
        return { error: "No se encontraron resultados" };
    }

    const nombreApellido = await page.$eval('.denominacion', el => el.textContent);
    const nameFormatted = nombreApellido.replace(/^\s+/g, '');

    const cuit = await page.$eval('.cuit', el => el.textContent);
    const match = cuit.match(/-(\d{8})-/);
    const extractedNumber = match ? match[1] : null;

    const sex = await page.$eval('.doc-facets', el => el.innerHTML.includes('masculino') ? 'M' : 'F');

    await browser.close();

    return {
        name: nameFormatted,
        dni: extractedNumber,
        sex: sex
    };
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});