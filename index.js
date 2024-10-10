import express from "express";
import qs from 'qs';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 2000;

const validApiKeys = new Set([process.env.API_KEY]);

app.use((req, res, next) => {
    const apiKey = req.headers['authorization']?.split(' ')[1];
    if (validApiKeys.has(apiKey)) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

app.get("/:dni?", async (req, res) => {
    const dni = req.params.dni || process.env.DNI_DEFAULT;
    const result = await sendPostRequest(dni);
    res.send(result);
});

async function sendPostRequest(dni) {
    const data = qs.stringify({ criterio: dni }); // Formatear los datos correctamente

    try {
        const response = await axios.post('https://datuar.com/pedido.php', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        const valueSex = $('#Datos img').attr('alt');
        const sex = valueSex === 'Hombre' ? 'M' : (valueSex === 'Mujer' ? 'F' : 'N/A');
        let name = $('#Datos h5').eq(1).text().trim();
        name = name.replace(/,/g, '');
        const cuil = $('#Datos p:contains("CUIL") span').text().trim();
        const dni = cuil.slice(2, -1);

        if (!name) {
            return { error: 'No data found' };
        }

        return { name, sex, dni };
    } catch (error) {
        console.error('Error sending POST request:', error);
        return { error: 'Error sending POST request' };
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});