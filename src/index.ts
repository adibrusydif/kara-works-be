import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import bankRouter from './routes/bank.js'
import uploadRouter from './routes/upload.js'
import hotelRouter from './routes/hotel.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())


// Home route - HTML
app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Express on Vercel</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/api-data">API Data</a>
          <a href="/healthz">Health</a>
        </nav>
        <h1>Welcome to Express on Vercel 🚀</h1>
        <p>This is a minimal example without a database or forms.</p>
        <img src="/logo.png" alt="Logo" width="120" />
      </body>
    </html>
  `)
})

app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'components', 'about.htm'))
})

// Example API endpoint - JSON
app.get('/api-data', (req, res) => {
  res.json({
    message: 'Here is some sample API data',
    items: ['apple', 'banana', 'cherry'],
  })
})

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Bank routes
app.use('/api/banks', bankRouter)

// Upload routes
app.use('/api/upload', uploadRouter)

// Hotel routes
app.use('/api/hotels', hotelRouter)

app.get('/test-upload', (req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test File Upload</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #555;
        }
        input[type="text"],
        input[type="file"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }
        button {
          background: #007bff;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
        }
        button:hover {
          background: #0056b3;
        }
        #result {
          margin-top: 20px;
          padding: 15px;
          border-radius: 4px;
          display: none;
        }
        .success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        .error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧪 Test File Upload</h1>
        
        <form id="uploadForm">
          <div class="form-group">
            <label for="hotelId">Hotel ID:</label>
            <input type="text" id="hotelId" placeholder="e.g., 11d55faf-b8de-48eb-a865-7ec552fcc876" required>
          </div>
          
          <div class="form-group">
            <label for="logoFile">Logo File:</label>
            <input type="file" id="logoFile" accept="image/*" required>
          </div>
          
          <button type="submit">📤 Upload Logo</button>
        </form>
        
        <div id="result"></div>
      </div>

      <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const hotelId = document.getElementById('hotelId').value.trim();
          const fileInput = document.getElementById('logoFile');
          const file = fileInput.files[0];
          const resultDiv = document.getElementById('result');
          
          if (!hotelId) {
            resultDiv.className = 'error';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<strong>Error:</strong> Please enter a Hotel ID';
            return;
          }
          
          if (!file) {
            resultDiv.className = 'error';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<strong>Error:</strong> Please select a file';
            return;
          }
          
          // Show loading state
          resultDiv.className = '';
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = '<strong>Uploading...</strong> Please wait...';
          
          const formData = new FormData();
          formData.append('logo', file);
          
          try {
            const response = await fetch(\`/api/upload/hotels/\${hotelId}/logo\`, {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
              resultDiv.className = 'success';
              resultDiv.innerHTML = \`
                <strong>✅ Upload Successful!</strong>
                <pre>\${JSON.stringify(result, null, 2)}</pre>
                <p><strong>Logo URL:</strong> <a href="\${result.logoUrl}" target="_blank">\${result.logoUrl}</a></p>
              \`;
            } else {
              resultDiv.className = 'error';
              resultDiv.innerHTML = \`
                <strong>❌ Upload Failed</strong>
                <pre>\${JSON.stringify(result, null, 2)}</pre>
              \`;
            }
          } catch (error) {
            resultDiv.className = 'error';
            resultDiv.innerHTML = \`
              <strong>❌ Error:</strong> \${error.message}
            \`;
          }
        });
      </script>
    </body>
    </html>
  `)
})

export default app
